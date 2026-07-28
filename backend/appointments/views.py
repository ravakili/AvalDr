from datetime import datetime, timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsActiveUser
from payments.models import Payment
from payments.serializers import PaymentSerializer

from .models import Appointment, VisitLog
from .serializers import AppointmentCreateSerializer, AppointmentSerializer, VisitLogSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = (IsActiveUser,)
    pagination_class = None
    http_method_names = ('get', 'post', 'patch', 'delete', 'head', 'options')

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Appointment.objects.none()
        queryset = Appointment.objects.select_related(
            'patient', 'patient__patient_profile', 'doctor', 'doctor__user', 'doctor__specialty'
        ).prefetch_related('doctor__working_hours')
        user = self.request.user
        if user.role == 'doctor':
            queryset = queryset.filter(doctor__user=user)
        elif user.role != 'admin':
            queryset = queryset.filter(patient=user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def get_serializer_class(self):
        return AppointmentCreateSerializer if self.action == 'create' else AppointmentSerializer

    def perform_create(self, serializer):
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)

    def _transition(self, request, appointment, target, allowed_from, allowed_roles):
        if request.user.role not in allowed_roles:
            return Response({'detail': 'دسترسی کافی ندارید.'}, status=403)
        if appointment.status not in allowed_from:
            return Response(
                {'detail': f'تغییر وضعیت از {appointment.status} به {target} مجاز نیست.'},
                status=409,
            )
        appointment.status = target
        if target == 'completed':
            appointment.end_time = (
                datetime.combine(appointment.date, appointment.time) + timedelta(minutes=30)
            ).time()
        appointment.save()
        VisitLog.objects.create(appointment=appointment, action=target, actor=request.user)
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=('post',))
    def approve(self, request, pk=None):
        return self._transition(
            request, self.get_object(), 'waiting', ('pending-approval',), ('doctor', 'admin')
        )

    @action(detail=True, methods=('post',))
    def cancel(self, request, pk=None):
        return self._transition(
            request,
            self.get_object(),
            'cancelled',
            ('pending-payment', 'pending-approval', 'waiting'),
            ('user', 'doctor', 'admin'),
        )

    @action(detail=True, methods=('post',))
    def start(self, request, pk=None):
        return self._transition(
            request, self.get_object(), 'in-progress', ('waiting',), ('doctor',)
        )

    @action(detail=True, methods=('post',))
    def complete(self, request, pk=None):
        return self._transition(
            request, self.get_object(), 'completed', ('in-progress',), ('doctor',)
        )

    @action(detail=True, methods=('post',))
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role != 'user' or appointment.status not in ('waiting', 'pending-payment'):
            return Response({'detail': 'تغییر زمان این نوبت مجاز نیست.'}, status=409)
        serializer = AppointmentCreateSerializer(
            appointment,
            data={
                'doctorId': appointment.doctor_id,
                'date': request.data.get('date', appointment.date),
                'time': request.data.get('time', appointment.time),
                'endTime': request.data.get('endTime', appointment.end_time),
                'reason': appointment.reason,
                'consultType': appointment.consult_type,
            },
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(appointment, field, value)
        appointment.status = 'pending-payment'
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=('post',), url_path='payment')
    def create_payment(self, request, pk=None):
        appointment = self.get_object()
        if request.user != appointment.patient:
            return Response({'detail': 'فقط بیمار می‌تواند پرداخت را آغاز کند.'}, status=403)
        communication = getattr(appointment.doctor, 'comm_settings', None)
        amount = (
            getattr(communication, f'{appointment.consult_type}_fee')
            if communication
            else appointment.doctor.fee
        )
        payment, _ = Payment.objects.get_or_create(
            appointment=appointment, defaults={'amount': amount}
        )
        return Response(PaymentSerializer(payment).data, status=201)

    @action(detail=True, methods=('get',), url_path='history')
    def history(self, request, pk=None):
        appointment = self.get_object()
        return Response(VisitLogSerializer(appointment.visit_logs.all(), many=True).data)

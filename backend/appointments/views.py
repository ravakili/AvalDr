from datetime import datetime, timedelta
from urllib.parse import urlencode

from django.db.models import Q
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsActiveUser
from notifications.services import notify, notify_admins
from payments.models import Payment
from payments.serializers import PaymentSerializer
from payments.services import ZarinpalClient, ZarinpalError

from .models import Appointment, VisitLog
from .serializers import AppointmentCreateSerializer, AppointmentSerializer, VisitLogSerializer
from .services import expire_stale_pending_payments


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = (IsActiveUser,)
    pagination_class = None
    http_method_names = ('get', 'post', 'patch', 'delete', 'head', 'options')

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Appointment.objects.none()
        expire_stale_pending_payments()
        queryset = Appointment.objects.select_related(
            'patient', 'patient__patient_profile', 'doctor', 'doctor__user', 'doctor__specialty'
        ).prefetch_related('doctor__working_hours')
        user = self.request.user
        if user.role == 'doctor':
            queryset = queryset.filter(doctor__user=user).exclude(status='pending-payment')
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
        if target == 'in-progress' and not appointment.started_at:
            appointment.started_at = timezone.now()
        if target == 'completed':
            appointment.end_time = (
                datetime.combine(appointment.date, appointment.time) + timedelta(minutes=30)
            ).time()
        appointment.save()
        VisitLog.objects.create(appointment=appointment, action=target, actor=request.user)
        if target == 'in-progress':
            notify(
                appointment.patient,
                'جلسه مشاوره شروع شد',
                f'{appointment.doctor.user.display_name} جلسه مشاوره را آغاز کرد.',
                'appointment',
                {'appointmentId': str(appointment.pk)},
            )
        elif target == 'completed':
            notify(
                appointment.patient,
                'جلسه مشاوره پایان یافت',
                'جلسه شما تکمیل شد و سوابق آن در نوبت‌های من در دسترس است.',
                'appointment',
                {'appointmentId': str(appointment.pk)},
            )
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=('post',))
    def approve(self, request, pk=None):
        return self._transition(
            request, self.get_object(), 'waiting', ('pending-approval',), ('doctor', 'admin')
        )

    @action(detail=True, methods=('post',))
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role not in ('user', 'doctor', 'admin'):
            return Response({'detail': 'دسترسی کافی ندارید.'}, status=403)
        if appointment.status not in ('pending-payment', 'pending-approval', 'waiting'):
            return Response({'detail': 'لغو این نوبت مجاز نیست.'}, status=409)

        payment = getattr(appointment, 'payment_record', None)
        if payment and payment.status == 'success':
            try:
                refund = ZarinpalClient().refund_payment(payment)
                payment.status = 'refunded'
                payment.refund_id = str(refund.get('refund_id') or refund.get('ref_id') or '')
                payment.refund_amount = payment.amount
                payment.refunded_at = timezone.now()
                payment.refund_error = ''
            except ZarinpalError as exc:
                payment.status = 'refund-failed'
                payment.refund_error = str(exc)
            payment.save()

        appointment.status = 'cancelled'
        appointment.save(update_fields=('status',))
        VisitLog.objects.create(appointment=appointment, action='cancelled', actor=request.user)
        refund_status = payment.status if payment else None
        body = 'نوبت لغو شد.'
        if refund_status == 'refunded':
            body = 'نوبت لغو و مبلغ پرداختی با موفقیت بازپرداخت شد.'
        elif refund_status == 'refund-failed':
            body = 'نوبت لغو شد، اما بازپرداخت نیازمند پیگیری پشتیبانی است.'
        for recipient in {appointment.patient, appointment.doctor.user}:
            notify(
                recipient,
                'لغو نوبت',
                body,
                'appointment',
                {'appointmentId': str(appointment.pk), 'refundStatus': refund_status},
            )
        notify_admins(
            'لغو نوبت',
            f'نوبت شماره {appointment.pk} لغو شد. وضعیت بازپرداخت: {refund_status or "بدون پرداخت"}',
            'appointment',
            {'appointmentId': str(appointment.pk), 'refundStatus': refund_status},
        )
        data = AppointmentSerializer(appointment).data
        data['refundStatus'] = refund_status
        return Response(data)

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
        if payment.status == 'success':
            return Response(PaymentSerializer(payment).data)
        callback_query = urlencode({'payment': payment.pk})
        separator = '&' if '?' in settings.ZARINPAL_CALLBACK_URL else '?'
        callback_url = f'{settings.ZARINPAL_CALLBACK_URL}{separator}{callback_query}'
        try:
            gateway = ZarinpalClient().request_payment(payment, callback_url)
        except ZarinpalError as exc:
            payment.status = 'failed'
            payment.save(update_fields=('status',))
            return Response(
                {'detail': str(exc), 'retryable': True},
                status=502,
            )
        payment.authority = gateway['authority']
        payment.gateway_url = gateway['gateway_url']
        payment.status = 'pending'
        payment.refund_error = ''
        payment.save(update_fields=('authority', 'gateway_url', 'status', 'refund_error'))
        return Response(PaymentSerializer(payment).data, status=201)

    @action(detail=True, methods=('get',), url_path='history')
    def history(self, request, pk=None):
        appointment = self.get_object()
        return Response(VisitLogSerializer(appointment.visit_logs.all(), many=True).data)

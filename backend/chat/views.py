from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from appointments.models import Appointment
from config.permissions import IsActiveUser
from notifications.services import notify, notify_admins

from .models import ChatMessage, SupportMessage, SupportThread
from .serializers import ChatMessageSerializer, SupportMessageSerializer, SupportThreadSerializer


def appointment_for_user(user, appointment_id):
    appointment = get_object_or_404(
        Appointment.objects.select_related('doctor__user', 'patient'),
        pk=appointment_id,
    )
    if user.role != 'admin' and user.id not in appointment.participants:
        return None
    return appointment


class ChatMessageViewSet(viewsets.GenericViewSet):
    permission_classes = (IsActiveUser,)
    serializer_class = ChatMessageSerializer

    def list(self, request, appointment_id=None):
        appointment = appointment_for_user(request.user, appointment_id)
        if not appointment:
            return Response({'detail': 'دسترسی به این گفتگو مجاز نیست.'}, status=403)
        return Response(ChatMessageSerializer(appointment.messages.all(), many=True, context={'request': request}).data)

    def create(self, request, appointment_id=None):
        appointment = appointment_for_user(request.user, appointment_id)
        if not appointment:
            return Response({'detail': 'دسترسی به این گفتگو مجاز نیست.'}, status=403)
        if appointment.status != 'in-progress':
            return Response({'detail': 'گفتگو فقط پس از شروع جلسه فعال است.'}, status=409)
        serializer = ChatMessageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        message = serializer.save(
            appointment=appointment,
            sender=request.user,
            file_name=getattr(request.data.get('file'), 'name', request.data.get('fileName', '')),
        )
        recipients = [appointment.patient, appointment.doctor.user]
        for recipient in recipients:
            if recipient.pk != request.user.pk:
                notify(
                    recipient,
                    f'پیام جدید از {request.user.display_name}',
                    message.text[:160],
                    'message',
                    {'appointmentId': str(appointment.pk), 'senderId': str(request.user.pk)},
                )
        return Response(ChatMessageSerializer(message, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ChatRoomViewSet(viewsets.GenericViewSet):
    permission_classes = (IsActiveUser,)
    serializer_class = ChatMessageSerializer

    def list(self, request):
        if request.user.role == 'doctor':
            appointments = Appointment.objects.filter(doctor__user=request.user).exclude(
                status='pending-payment'
            )
        elif request.user.role == 'admin':
            appointments = Appointment.objects.exclude(status='pending-payment')
        else:
            appointments = Appointment.objects.filter(patient=request.user).exclude(
                status='pending-payment'
            )
        data = []
        for appointment in appointments.select_related('doctor__user', 'doctor__specialty', 'patient'):
            last_message = appointment.messages.last()
            data.append({
                'appointmentId': str(appointment.pk),
                'doctorName': appointment.doctor.user.display_name,
                'patientName': appointment.patient.display_name,
                'specialty': appointment.doctor.specialty.name,
                'date': appointment.date,
                'time': appointment.time.strftime('%H:%M'),
                'status': appointment.status,
                'messageCount': appointment.messages.count(),
                'lastMessage': last_message.text if last_message else '',
            })
        return Response(data)


class SupportThreadViewSet(viewsets.GenericViewSet):
    permission_classes = (IsActiveUser,)
    serializer_class = SupportThreadSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return SupportThread.objects.select_related('participant')
        return SupportThread.objects.select_related('participant').filter(participant=user)

    def list(self, request):
        threads = self.get_queryset().prefetch_related('messages')
        return Response(
            SupportThreadSerializer(threads, many=True, context={'request': request}).data
        )

    def create(self, request):
        thread, _ = SupportThread.objects.get_or_create(participant=request.user)
        return Response(
            SupportThreadSerializer(thread, context={'request': request}).data,
            status=status.HTTP_201_CREATED if _ else status.HTTP_200_OK,
        )

    def _get_accessible(self, request, pk):
        thread = get_object_or_404(SupportThread, pk=pk)
        if request.user.role != 'admin' and thread.participant_id != request.user.pk:
            return None
        return thread

    @action(detail=True, methods=('get',))
    def messages(self, request, pk=None):
        thread = self._get_accessible(request, pk)
        if not thread:
            return Response({'detail': 'دسترسی به این گفتگو مجاز نیست.'}, status=403)
        return Response(
            SupportMessageSerializer(
                thread.messages.all(), many=True, context={'request': request}
            ).data
        )

    @action(detail=True, methods=('post',))
    def send(self, request, pk=None):
        thread = self._get_accessible(request, pk)
        if not thread:
            return Response({'detail': 'دسترسی به این گفتگو مجاز نیست.'}, status=403)
        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'detail': 'متن پیام الزامی است.'}, status=400)
        message = SupportMessage.objects.create(
            thread=thread, sender=request.user, text=text
        )
        if request.user.role == 'admin':
            notify(
                thread.participant,
                'پیام جدید از پشتیبانی',
                text[:160],
                'message',
                {'supportThreadId': str(thread.pk)},
            )
        else:
            notify_admins(
                'پیام جدید پشتیبانی',
                f'{request.user.display_name}: {text[:160]}',
                'message',
                {'supportThreadId': str(thread.pk)},
            )
        return Response(
            SupportMessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

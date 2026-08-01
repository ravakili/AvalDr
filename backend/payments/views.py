from django.utils import timezone
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from appointments.models import VisitLog
from config.permissions import IsPatient
from notifications.services import notify, notify_admins

from .models import Payment
from .serializers import PaymentSerializer
from .services import ZarinpalClient, ZarinpalError


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = (IsPatient,)
    pagination_class = None

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Payment.objects.none()
        return Payment.objects.filter(appointment__patient=self.request.user)

    @action(detail=True, methods=('post',))
    def verify(self, request, pk=None):
        payment = self.get_object()
        if payment.status == 'success':
            return Response(PaymentSerializer(payment).data)
        authority = request.data.get('authority') or request.data.get('Authority')
        gateway_status = request.data.get('status') or request.data.get('Status')
        if gateway_status and str(gateway_status).upper() != 'OK':
            payment.status = 'failed'
            payment.save(update_fields=('status',))
            return Response(PaymentSerializer(payment).data, status=status.HTTP_402_PAYMENT_REQUIRED)
        if authority and authority != payment.authority:
            return Response({'detail': 'کد Authority معتبر نیست.'}, status=400)
        try:
            result = ZarinpalClient().verify_payment(payment)
        except ZarinpalError as exc:
            return Response({'detail': str(exc)}, status=502)
        if result.get('code') not in (100, 101):
            payment.status = 'failed'
            payment.save(update_fields=('status',))
            return Response({'detail': 'تأیید پرداخت توسط زرین‌پال انجام نشد.'}, status=402)
        payment.status = 'success'
        payment.tracking_code = str(result.get('ref_id', ''))
        payment.ref_id = str(result.get('ref_id', ''))
        payment.card_number = str(result.get('card_pan', ''))
        payment.card_hash = str(result.get('card_hash', ''))
        payment.paid_at = timezone.now()
        payment.save()
        payment.appointment.status = 'waiting'
        payment.appointment.save(update_fields=('status',))
        VisitLog.objects.create(
            appointment=payment.appointment, action='payment-verified', actor=self.request.user
        )
        notify(
            payment.appointment.patient,
            'پرداخت نوبت موفق بود',
            f'پرداخت نوبت شماره {payment.appointment_id} با موفقیت تأیید شد.',
            'payment',
            {'appointmentId': str(payment.appointment_id), 'paymentId': str(payment.pk)},
        )
        notify(
            payment.appointment.doctor.user,
            'نوبت جدید پرداخت شد',
            f'{payment.appointment.patient.display_name} یک نوبت جدید ثبت کرده است.',
            'appointment',
            {'appointmentId': str(payment.appointment_id)},
        )
        notify_admins(
            'پرداخت جدید',
            f'پرداخت نوبت شماره {payment.appointment_id} تأیید شد.',
            'payment',
            {'appointmentId': str(payment.appointment_id), 'paymentId': str(payment.pk)},
        )
        return Response(PaymentSerializer(payment).data)

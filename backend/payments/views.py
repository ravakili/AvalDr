import secrets

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from appointments.models import VisitLog
from config.permissions import IsPatient

from .models import Payment
from .serializers import PaymentSerializer


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
        if request.data.get('success', True) is False:
            payment.status = 'failed'
            payment.save(update_fields=('status',))
            payment.appointment.status = 'cancelled'
            payment.appointment.save(update_fields=('status',))
            return Response(PaymentSerializer(payment).data, status=402)
        payment.status = 'success'
        payment.tracking_code = request.data.get('trackingCode') or secrets.token_hex(6).upper()
        payment.card_number = str(request.data.get('cardNumber', ''))[-4:]
        payment.paid_at = timezone.now()
        payment.save()
        payment.appointment.status = 'waiting'
        payment.appointment.save(update_fields=('status',))
        VisitLog.objects.create(
            appointment=payment.appointment, action='payment-verified', actor=self.request.user
        )
        return Response(PaymentSerializer(payment).data)

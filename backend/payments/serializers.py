from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    appointmentId = serializers.CharField(source='appointment_id', read_only=True)
    trackingCode = serializers.CharField(source='tracking_code', read_only=True)
    paidAt = serializers.DateTimeField(source='paid_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'appointmentId', 'amount', 'status', 'trackingCode', 'createdAt', 'paidAt'
        )

from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    appointmentId = serializers.CharField(source='appointment_id', read_only=True)
    trackingCode = serializers.CharField(source='tracking_code', read_only=True)
    paidAt = serializers.DateTimeField(source='paid_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    gatewayUrl = serializers.URLField(source='gateway_url', read_only=True)
    authority = serializers.CharField(read_only=True)
    refundId = serializers.CharField(source='refund_id', read_only=True)
    refundAmount = serializers.IntegerField(source='refund_amount', read_only=True)
    refundedAt = serializers.DateTimeField(source='refunded_at', read_only=True)
    refundError = serializers.CharField(source='refund_error', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'appointmentId', 'amount', 'status', 'trackingCode', 'authority',
            'gatewayUrl', 'createdAt', 'paidAt', 'refundId', 'refundAmount',
            'refundedAt', 'refundError',
        )

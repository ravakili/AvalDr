from rest_framework import serializers

from .models import Notification, NotificationPreference, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'title', 'body', 'type', 'read', 'data', 'createdAt')


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = NotificationPreference
        fields = ('id', 'key', 'label', 'enabled')
        read_only_fields = ('id', 'key', 'label')


class PushSubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.CharField()
    keys = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False)
    keys_p256dh = serializers.CharField(required=False, allow_blank=True)
    keys_auth = serializers.CharField(required=False, allow_blank=True)
    userAgent = serializers.CharField(required=False, allow_blank=True)

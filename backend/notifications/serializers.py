from rest_framework import serializers

from .models import Notification, NotificationPreference


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

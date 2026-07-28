from rest_framework import serializers

from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    senderId = serializers.CharField(source='sender_id', read_only=True)
    time = serializers.DateTimeField(source='created_at', read_only=True)
    type = serializers.CharField(source='message_type')
    fileUrl = serializers.FileField(source='file', read_only=True)
    fileName = serializers.CharField(source='file_name', required=False, allow_blank=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'senderId', 'text', 'time', 'type', 'fileUrl', 'fileName', 'file')
        extra_kwargs = {'file': {'write_only': True, 'required': False}}
        read_only_fields = ('id', 'senderId', 'time')

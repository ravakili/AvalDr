from rest_framework import serializers

from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    senderId = serializers.CharField(source='sender_id', read_only=True)
    time = serializers.DateTimeField(source='created_at', read_only=True)
    type = serializers.CharField(source='message_type')
    fileUrl = serializers.SerializerMethodField()
    fileName = serializers.CharField(source='file_name', required=False, allow_blank=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'senderId', 'text', 'time', 'type', 'fileUrl', 'fileName', 'file')
        extra_kwargs = {'file': {'write_only': True, 'required': False}}
        read_only_fields = ('id', 'senderId', 'time')

    def get_fileUrl(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

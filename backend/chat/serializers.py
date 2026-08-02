from rest_framework import serializers

from .models import ChatMessage, SupportMessage, SupportThread


class ChatMessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    senderId = serializers.CharField(source='sender_id', read_only=True)
    senderName = serializers.CharField(source='sender.display_name', read_only=True)
    senderRole = serializers.CharField(source='sender.role', read_only=True)
    senderAvatar = serializers.SerializerMethodField()
    time = serializers.DateTimeField(source='created_at', read_only=True)
    type = serializers.CharField(source='message_type')
    fileUrl = serializers.SerializerMethodField()
    fileName = serializers.CharField(source='file_name', required=False, allow_blank=True)

    class Meta:
        model = ChatMessage
        fields = (
            'id', 'senderId', 'senderName', 'senderRole', 'senderAvatar', 'text', 'time',
            'type', 'fileUrl', 'fileName', 'file',
        )
        extra_kwargs = {'file': {'write_only': True, 'required': False}}
        read_only_fields = ('id', 'senderId', 'time')

    def get_senderAvatar(self, obj):
        if not obj.sender.avatar:
            return ''
        request = self.context.get('request')
        url = obj.sender.avatar
        return request.build_absolute_uri(url) if request else url

    def get_fileUrl(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


def _absolute_avatar(request, avatar):
    if not avatar:
        return ''
    return request.build_absolute_uri(avatar) if request else avatar


class SupportMessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    senderId = serializers.CharField(source='sender_id', read_only=True)
    senderName = serializers.CharField(source='sender.display_name', read_only=True)
    senderRole = serializers.CharField(source='sender.role', read_only=True)
    senderAvatar = serializers.SerializerMethodField()
    time = serializers.DateTimeField(source='created_at', read_only=True)
    type = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = (
            'id', 'senderId', 'senderName', 'senderRole', 'senderAvatar',
            'text', 'time', 'type',
        )
        read_only_fields = fields

    def get_type(self, obj):
        return 'text'

    def get_senderAvatar(self, obj):
        return _absolute_avatar(self.context.get('request'), obj.sender.avatar)


class SupportThreadSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    participantName = serializers.CharField(source='participant.display_name', read_only=True)
    participantAvatar = serializers.SerializerMethodField()
    participantRole = serializers.CharField(source='participant.role', read_only=True)
    participantPhone = serializers.CharField(source='participant.phone', read_only=True)
    lastMessage = serializers.SerializerMethodField()
    messageCount = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = SupportThread
        fields = (
            'id', 'participantName', 'participantAvatar', 'participantRole',
            'participantPhone', 'lastMessage', 'messageCount', 'createdAt',
        )
        read_only_fields = fields

    def get_participantAvatar(self, obj):
        return _absolute_avatar(self.context.get('request'), obj.participant.avatar)

    def get_lastMessage(self, obj):
        last = obj.messages.last()
        return last.text if last else ''

    def get_messageCount(self, obj):
        return obj.messages.count()

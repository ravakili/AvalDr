import base64
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.files.base import ContentFile

from config.media_urls import absolute_media


class AppointmentConsumer(AsyncWebsocketConsumer):
    group_prefix = 'appointment'

    async def connect(self):
        self.appointment_id = self.scope['url_route']['kwargs']['appointment_id']
        if not await self.can_access_appointment():
            await self.close(code=4403)
            return
        host = ''
        for key, value in self.scope.get('headers', []):
            if key == b'host':
                host = value.decode()
                break
        self.request_host = host
        self.room_group = f'{self.group_prefix}_{self.appointment_id}'
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    @database_sync_to_async
    def can_access_appointment(self):
        from appointments.models import Appointment

        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            return False
        appointment = Appointment.objects.filter(pk=self.appointment_id).select_related(
            'doctor__user'
        ).first()
        return bool(
            appointment
            and (
                user.role == 'admin'
                or user.id in (appointment.patient_id, appointment.doctor.user_id)
            )
        )


class SignalConsumer(AppointmentConsumer):
    group_prefix = 'consult'

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            await self.close(code=4400)
            return
        await self.channel_layer.group_send(
            self.room_group,
            {'type': 'signal_message', 'data': data, 'sender': self.channel_name},
        )

    async def signal_message(self, event):
        if event['sender'] != self.channel_name:
            await self.send(text_data=json.dumps(event['data']))


class ChatConsumer(AppointmentConsumer):
    group_prefix = 'chat'

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            await self.close(code=4400)
            return

        action = data.get('action')
        if action == 'typing':
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'typing_event',
                    'sender': self.channel_name,
                    'senderId': str(self.scope['user'].id),
                },
            )
            return

        if data.get('type') == 'voice':
            message = await self.create_voice_message(data)
        else:
            message = await self.create_message(data)

        payload = self.build_payload(message)
        await self.channel_layer.group_send(
            self.room_group, {'type': 'chat_message', 'message': payload}
        )

    def build_payload(self, message):
        avatar = ''
        if message.sender.avatar:
            avatar = absolute_media(
                message.sender.avatar.url if hasattr(message.sender.avatar, 'url') else message.sender.avatar,
                request_host=self.request_host,
            )
        return {
            'id': str(message.id),
            'senderId': str(message.sender_id),
            'senderName': message.sender.display_name,
            'senderRole': message.sender.role,
            'senderAvatar': avatar,
            'text': message.text,
            'type': message.message_type,
            'time': message.created_at.isoformat(),
            'fileUrl': absolute_media(message.file.url, request_host=self.request_host) if message.file else None,
            'fileName': message.file_name,
            'voiceUrl': absolute_media(message.voice.url, request_host=self.request_host) if message.voice else None,
            'voiceDuration': message.voice_duration,
        }

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'event': 'message', 'message': event['message']}))

    async def typing_event(self, event):
        if event['sender'] != self.channel_name:
            await self.send(
                text_data=json.dumps({'event': 'typing', 'senderId': event['senderId']})
            )

    async def status_event(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    'event': 'status',
                    'appointmentId': event['appointmentId'],
                    'status': event['status'],
                    'startedAt': event.get('startedAt'),
                }
            )
        )

    @database_sync_to_async
    def create_message(self, data):
        from chat.models import ChatMessage

        return ChatMessage.objects.create(
            appointment_id=self.appointment_id,
            sender=self.scope['user'],
            text=data.get('text', ''),
            message_type='text',
        )

    @database_sync_to_async
    def create_voice_message(self, data):
        from chat.models import ChatMessage

        mime = data.get('mimeType') or 'audio/webm'
        ext = 'webm'
        if 'ogg' in mime:
            ext = 'ogg'
        elif 'mp4' in mime or 'aac' in mime or 'm4a' in mime:
            ext = 'm4a'
        payload = base64.b64decode(data.get('data', ''))
        message = ChatMessage.objects.create(
            appointment_id=self.appointment_id,
            sender=self.scope['user'],
            text='',
            message_type='voice',
            file_name='',
            voice_duration=float(data.get('duration', 0) or 0),
        )
        message.voice.save(f'voice-{message.id}.{ext}', ContentFile(payload), save=True)
        return message


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        requested_user_id = int(self.scope['url_route']['kwargs']['user_id'])
        if (
            not user
            or not user.is_authenticated
            or (user.id != requested_user_id and user.role != 'admin')
        ):
            await self.close(code=4403)
            return
        self.room_group = f'notifications_{requested_user_id}'
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def notification_message(self, event):
        await self.send(text_data=json.dumps(event['message']))
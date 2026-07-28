import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class AppointmentConsumer(AsyncWebsocketConsumer):
    group_prefix = 'appointment'

    async def connect(self):
        self.appointment_id = self.scope['url_route']['kwargs']['appointment_id']
        if not await self.can_access_appointment():
            await self.close(code=4403)
            return
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
        if not user or not user.is_authenticated or not user.is_active:
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
        message = await self.create_message(data)
        payload = {
            'id': str(message.id),
            'senderId': str(message.sender_id),
            'text': message.text,
            'type': message.message_type,
            'time': message.created_at.isoformat(),
        }
        await self.channel_layer.group_send(
            self.room_group, {'type': 'chat_message', 'message': payload}
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def create_message(self, data):
        from chat.models import ChatMessage

        return ChatMessage.objects.create(
            appointment_id=self.appointment_id,
            sender=self.scope['user'],
            text=data.get('text', ''),
            message_type=data.get('type', 'text'),
        )


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        requested_user_id = int(self.scope['url_route']['kwargs']['user_id'])
        if (
            not user
            or not user.is_authenticated
            or not user.is_active
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

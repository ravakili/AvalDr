from django.db import models
from django.conf import settings


class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ('text', 'متن'),
        ('prescription', 'نسخه'),
        ('system', 'سیستمی'),
        ('file', 'فایل'),
    )

    appointment = models.ForeignKey('appointments.Appointment', on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    message_type = models.CharField(max_length=12, choices=MESSAGE_TYPE_CHOICES, default='text')
    file = models.FileField(upload_to='chat_attachments/%Y/%m/', blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender} -> {self.appointment}: {self.message_type}'
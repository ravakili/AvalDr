from django.db import models
from django.conf import settings


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    body = models.TextField(blank=True)
    type = models.CharField(max_length=20, default='system')
    read = models.BooleanField(default=False)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.user}'


class NotificationPreference(models.Model):
    KEY_CHOICES = (
        ('appointment_reminder', 'یادآوری نوبت'),
        ('new_message', 'پیام جدید'),
        ('prescription_ready', 'نسخه آماده'),
        ('marketing', 'اخبار و تخفیف‌ها'),
        ('weekly_report', 'گزارش هفتگی سلامت'),
    )
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_prefs')
    key = models.CharField(max_length=30, choices=KEY_CHOICES)
    label = models.CharField(max_length=100)
    enabled = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_prefs'
        unique_together = ('patient', 'key')

    def __str__(self):
        return f'{self.patient} - {self.label}: {self.enabled}'

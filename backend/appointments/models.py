from django.db import models
from django.conf import settings


class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending-payment', 'در انتظار پرداخت'),
        ('pending-approval', 'در انتظار تأیید'),
        ('waiting', 'در انتظار'),
        ('in-progress', 'در حال انجام'),
        ('completed', 'تکمیل شده'),
        ('cancelled', 'لغو شده'),
    )
    CONSULT_CHOICES = (
        ('chat', 'متنی'),
        ('audio', 'صوتی'),
        ('video', 'ویدئویی'),
    )

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey('doctors.DoctorProfile', on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending-payment')
    reason = models.TextField(blank=True)
    consult_type = models.CharField(max_length=5, choices=CONSULT_CHOICES, default='video')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.doctor} - {self.date} {self.time}'

    @property
    def duration_minutes(self):
        if self.end_time:
            from datetime import datetime, timedelta
            start = datetime.combine(self.date, self.time)
            end = datetime.combine(self.date, self.end_time)
            return int((end - start).total_seconds() / 60)
        return 30

    @property
    def participants(self):
        return (self.patient_id, self.doctor.user_id)


class VisitLog(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='visit_logs')
    action = models.CharField(max_length=30)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'visit_logs'
        ordering = ['timestamp']

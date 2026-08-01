from django.db import models
from django.conf import settings
from appointments.models import Appointment


class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'در انتظار'),
        ('success', 'موفق'),
        ('failed', 'ناموفق'),
        ('refunded', 'بازپرداخت شده'),
        ('refund-failed', 'خطای بازپرداخت'),
    )

    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='payment_record')
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    card_number = models.CharField(max_length=16, blank=True)
    card_hash = models.CharField(max_length=64, blank=True)
    tracking_code = models.CharField(max_length=20, blank=True)
    ref_id = models.CharField(max_length=30, blank=True)
    authority = models.CharField(max_length=64, blank=True, db_index=True)
    gateway_url = models.URLField(blank=True)
    refund_id = models.CharField(max_length=64, blank=True)
    refund_amount = models.PositiveIntegerField(default=0)
    refund_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    refunded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f'Payment #{self.id} - {self.status}'

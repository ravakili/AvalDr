from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import Appointment


def payment_hold_cutoff():
    minutes = getattr(settings, 'PAYMENT_HOLD_MINUTES', 5)
    return timezone.now() - timedelta(minutes=minutes)


def expire_stale_pending_payments():
    return Appointment.objects.filter(
        status='pending-payment',
        created_at__lt=payment_hold_cutoff(),
    ).update(status='cancelled')

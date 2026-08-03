from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from appointments.models import Appointment

_previous_status = {}


@receiver(pre_save, sender=Appointment)
def _capture_previous_status(sender, instance, **kwargs):
    if instance.pk:
        _previous_status[instance.pk] = (
            Appointment.objects.filter(pk=instance.pk)
            .values_list('status', flat=True)
            .first()
        )


@receiver(post_save, sender=Appointment)
def _broadcast_status(sender, instance, **kwargs):
    previous = _previous_status.pop(instance.pk, None)
    if previous is not None and previous == instance.status:
        return
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        f'chat_{instance.pk}',
        {
            'type': 'status_event',
            'appointmentId': str(instance.pk),
            'status': instance.status,
            'startedAt': instance.started_at.isoformat() if instance.started_at else None,
        },
    )

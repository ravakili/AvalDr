import json
import logging
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from accounts.models import User

from .models import Notification, PushSubscription

logger = logging.getLogger(__name__)

READ_EXPIRY_DAYS = 3
_CLEANUP_CACHE_KEY = 'notifications_cleanup_last_run'
_CLEANUP_INTERVAL = timedelta(hours=1)


def cleanup_expired_notifications():
    """Delete read notifications older than READ_EXPIRY_DAYS."""
    cutoff = timezone.now() - timedelta(days=READ_EXPIRY_DAYS)
    return Notification.objects.filter(read=True, created_at__lt=cutoff).delete()


def cleanup_expired_notifications_throttled():
    """Run the cleanup at most once per hour (safe to call on every request)."""
    if cache.get(_CLEANUP_CACHE_KEY):
        return False
    deleted, _ = cleanup_expired_notifications()
    cache.set(_CLEANUP_CACHE_KEY, True, timeout=int(_CLEANUP_INTERVAL.total_seconds()))
    if deleted:
        logger.info('deleted %s expired read notifications', deleted)
    return bool(deleted)


def notification_url(user, notification_type, data):
    role = getattr(user, 'role', 'user') or 'user'
    prefix = {'user': '/user', 'doctor': '/doctor', 'admin': '/admin'}.get(role, '/user')
    aid = data.get('appointmentId')
    if aid:
        return f'{prefix}/consult/{aid}'
    if notification_type == 'message' and data.get('supportThreadId'):
        return f'{prefix}/consult'
    if notification_type == 'withdrawal':
        return f'{prefix}/withdrawals' if prefix == '/admin' else f'{prefix}/profile'
    if notification_type in ('account', 'prescription'):
        return f'{prefix}/profile'
    if notification_type == 'payment' and data.get('paymentId'):
        return f'{prefix}/appointments'
    return prefix


def _serialize(notification):
    return {
        'id': str(notification.id),
        'title': notification.title,
        'body': notification.body,
        'type': notification.type,
        'read': notification.read,
        'data': notification.data,
        'createdAt': notification.created_at.isoformat(),
    }


def _push_to_subscription(subscription, payload):
    from pywebpush import WebPushException, webpush

    try:
        webpush(
            subscription_info={
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.keys_p256dh,
                    'auth': subscription.keys_auth,
                },
            },
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={'sub': settings.VAPID_SUBJECT},
            timeout=10,
        )
    except WebPushException as exc:
        if exc.response is not None and exc.response.status_code in (404, 410):
            subscription.delete()
        else:
            logger.warning('web push failed for %s: %s', subscription.endpoint[:60], exc)


def _send_push(notification):
    if not settings.VAPID_PRIVATE_KEY:
        return
    payload = {
        'id': str(notification.id),
        'title': notification.title,
        'body': notification.body,
        'url': notification.data.get('url', '/'),
        'type': notification.type,
    }
    for subscription in notification.user.push_subscriptions.all():
        try:
            _push_to_subscription(subscription, payload)
        except Exception:
            logger.exception('push dispatch error')


def _broadcast_ws(notification):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        f'notifications_{notification.user_id}',
        {'type': 'notification_message', 'message': {'event': 'new_notification', 'notification': _serialize(notification)}},
    )


def notify(user, title, body='', notification_type='system', data=None):
    if not user:
        return None
    payload = dict(data or {})
    payload['url'] = notification_url(user, notification_type, payload)
    notification = Notification.objects.create(
        user=user,
        title=title,
        body=body,
        type=notification_type,
        data=payload,
    )
    try:
        _broadcast_ws(notification)
    except Exception:
        logger.exception('ws broadcast failed')
    try:
        _send_push(notification)
    except Exception:
        logger.exception('web push failed')
    return notification


def notify_admins(title, body='', notification_type='admin', data=None):
    return [
        notify(admin, title, body, notification_type, data)
        for admin in User.objects.filter(role='admin', is_active=True)
    ]

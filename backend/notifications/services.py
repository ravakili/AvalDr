from accounts.models import User

from .models import Notification


def notify(user, title, body='', notification_type='system', data=None):
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        title=title,
        body=body,
        type=notification_type,
        data=data or {},
    )


def notify_admins(title, body='', notification_type='admin', data=None):
    return [
        notify(admin, title, body, notification_type, data)
        for admin in User.objects.filter(role='admin', is_active=True)
    ]

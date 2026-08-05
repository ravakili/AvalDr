from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsActiveUser

from .models import Notification, NotificationPreference, PushSubscription
from .serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    PushSubscriptionSerializer,
)
from .services import cleanup_expired_notifications_throttled

DEFAULT_PREFERENCES = (
    ('appointment_reminder', 'یادآوری نوبت', True),
    ('new_message', 'پیام جدید', True),
    ('prescription_ready', 'آماده شدن نسخه', True),
    ('marketing', 'اخبار و تخفیف‌ها', False),
    ('weekly_report', 'گزارش هفتگی سلامت', True),
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (IsActiveUser,)
    pagination_class = None

    def get_queryset(self):
        cleanup_expired_notifications_throttled()
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=('post',), url_path='mark-read')
    def mark_read(self, request):
        ids = request.data.get('ids', [])
        updated = self.get_queryset().filter(id__in=ids, read=False).update(read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=('post',), url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(read=False).update(read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=('post',), url_path='subscriptions')
    def subscribe(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        keys = data.get('keys') or {}
        p256dh = data.get('keys_p256dh') or keys.get('p256dh', '')
        auth = data.get('keys_auth') or keys.get('auth', '')
        if not p256dh or not auth:
            return Response({'detail': 'p256dh و auth الزامی است.'}, status=400)
        subscription, created = PushSubscription.objects.update_or_create(
            endpoint=data['endpoint'],
            defaults={
                'user': request.user,
                'keys_p256dh': p256dh,
                'keys_auth': auth,
                'user_agent': data.get('userAgent', '')[:256],
            },
        )
        return Response({'created': created, 'id': str(subscription.pk)})

    @action(detail=False, methods=('post',), url_path='subscriptions/unsubscribe')
    def unsubscribe(self, request):
        endpoint = request.data.get('endpoint')
        if not endpoint:
            return Response({'detail': 'endpoint الزامی است.'}, status=400)
        deleted, _ = PushSubscription.objects.filter(
            user=request.user, endpoint=endpoint
        ).delete()
        return Response({'deleted': deleted})


class NotificationPreferenceViewSet(viewsets.GenericViewSet):
    permission_classes = (IsActiveUser,)
    serializer_class = NotificationPreferenceSerializer

    def _ensure_defaults(self, user):
        for key, label, enabled in DEFAULT_PREFERENCES:
            NotificationPreference.objects.get_or_create(
                patient=user, key=key, defaults={'label': label, 'enabled': enabled}
            )

    def list(self, request):
        self._ensure_defaults(request.user)
        preferences = NotificationPreference.objects.filter(patient=request.user)
        return Response(NotificationPreferenceSerializer(preferences, many=True).data)

    def partial_update(self, request, pk=None):
        self._ensure_defaults(request.user)
        preference = NotificationPreference.objects.get(patient=request.user, pk=pk)
        serializer = NotificationPreferenceSerializer(
            preference, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

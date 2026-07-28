from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import NotificationPreferenceViewSet, NotificationViewSet

router = DefaultRouter()
router.register('', NotificationViewSet, basename='notification')

urlpatterns = [
    path(
        'preferences/',
        NotificationPreferenceViewSet.as_view({'get': 'list'}),
        name='notification-preferences',
    ),
    path(
        'preferences/<int:pk>/',
        NotificationPreferenceViewSet.as_view({'patch': 'partial_update'}),
        name='notification-preference-detail',
    ),
] + router.urls

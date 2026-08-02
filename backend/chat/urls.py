from django.urls import path

from .views import ChatMessageViewSet, ChatRoomViewSet, SupportThreadViewSet

urlpatterns = [
    path('rooms/', ChatRoomViewSet.as_view({'get': 'list'}), name='chat-rooms'),
    path(
        'appointments/<int:appointment_id>/messages/',
        ChatMessageViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='chat-messages',
    ),
    path(
        'support/threads/',
        SupportThreadViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='chat-support-threads',
    ),
    path(
        'support/threads/<int:pk>/messages/',
        SupportThreadViewSet.as_view({'get': 'messages'}),
        name='chat-support-messages',
    ),
    path(
        'support/threads/<int:pk>/send/',
        SupportThreadViewSet.as_view({'post': 'send'}),
        name='chat-support-send',
    ),
]

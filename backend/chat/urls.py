from django.urls import path

from .views import ChatMessageViewSet, ChatRoomViewSet

urlpatterns = [
    path('rooms/', ChatRoomViewSet.as_view({'get': 'list'}), name='chat-rooms'),
    path(
        'appointments/<int:appointment_id>/messages/',
        ChatMessageViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='chat-messages',
    ),
]

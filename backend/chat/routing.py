from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/consult/(?P<appointment_id>\d+)/signal/$', consumers.SignalConsumer.as_asgi()),
    re_path(r'ws/consult/(?P<appointment_id>\d+)/chat/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', consumers.NotificationConsumer.as_asgi()),
]
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from admin_panel.models import HealthTip, Definition
from admin_panel.serializers import HealthTipSerializer, DefinitionSerializer
import random

class PublicHealthTipsView(APIView):
    permission_classes = (AllowAny,)
    def get(self, request):
        tips = list(HealthTip.objects.filter(active=True))
        selected = random.sample(tips, min(3, len(tips)))
        return Response(HealthTipSerializer(selected, many=True).data)


class PublicDefinitionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        type_param = request.query_params.get('type', '')
        if type_param:
            qs = Definition.objects.filter(type=type_param)
        else:
            qs = Definition.objects.all()
        return Response(DefinitionSerializer(qs, many=True).data)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/doctors/', include('doctors.urls')),
    path('api/v1/appointments/', include('appointments.urls')),
    path('api/v1/chat/', include('chat.urls')),
    path('api/v1/prescriptions/', include('prescriptions.urls')),
    path('api/v1/medical/', include('medical.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/health-tips/', PublicHealthTipsView.as_view(), name='public-health-tips'),
    path('api/v1/common/definitions/', PublicDefinitionsView.as_view(), name='public-definitions'),
    path('api/v1/admin/', include('admin_panel.urls')),
    path('api/v1/payments/', include('payments.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
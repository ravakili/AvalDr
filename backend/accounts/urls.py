from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import AccountViewSet, AuthViewSet, PatientViewSet

urlpatterns = [
    path('send-otp/', AuthViewSet.as_view({'post': 'create'}), name='send-otp'),
    path('verify-otp/', AuthViewSet.as_view({'post': 'verify'}), name='verify-otp'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', AccountViewSet.as_view({'get': 'me', 'patch': 'me'}), name='account-me'),
    path(
        'complete-profile/',
        AccountViewSet.as_view({'post': 'complete_profile'}),
        name='complete-profile',
    ),
    path(
        'patient/',
        PatientViewSet.as_view({'get': 'list', 'patch': 'partial_update'}),
        name='patient-profile',
    ),
]

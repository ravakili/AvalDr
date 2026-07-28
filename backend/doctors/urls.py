from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DoctorMeViewSet, DoctorViewSet, SpecialtyListView

router = DefaultRouter()
router.register('', DoctorViewSet, basename='doctor')

urlpatterns = [
    path('specialties/', SpecialtyListView.as_view({'get': 'list'}), name='specialties'),
    path('me/', DoctorMeViewSet.as_view({'get': 'list', 'patch': 'partial_update'}), name='doctor-me'),
    path(
        'me/communication/',
        DoctorMeViewSet.as_view({'get': 'communication', 'put': 'communication'}),
        name='doctor-communication',
    ),
    path(
        'me/working-hours/',
        DoctorMeViewSet.as_view({'get': 'working_hours', 'post': 'working_hours'}),
        name='doctor-working-hours',
    ),
    path(
        'me/working-hours/<int:hour_id>/',
        DoctorMeViewSet.as_view({
            'patch': 'working_hour_detail',
            'delete': 'working_hour_detail',
        }),
        name='doctor-working-hour-detail',
    ),
    path(
        'me/documents/',
        DoctorMeViewSet.as_view({'get': 'documents', 'post': 'documents'}),
        name='doctor-documents',
    ),
    path('me/earnings/', DoctorMeViewSet.as_view({'get': 'earnings'}), name='doctor-earnings'),
    path(
        'me/withdrawals/',
        DoctorMeViewSet.as_view({'get': 'withdrawals', 'post': 'withdrawals'}),
        name='doctor-withdrawals',
    ),
    path('', include(router.urls)),
]

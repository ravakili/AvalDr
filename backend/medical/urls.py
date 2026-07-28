from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import MedicalRecordViewSet, MedicalReportViewSet, PatientDocumentViewSet

router = DefaultRouter()
router.register('reports', MedicalReportViewSet, basename='medical-report')

urlpatterns = [
    path(
        'record/',
        MedicalRecordViewSet.as_view({'get': 'list', 'patch': 'partial_update'}),
        name='medical-record',
    ),
    path(
        'documents/',
        PatientDocumentViewSet.as_view({'post': 'create'}),
        name='patient-document-create',
    ),
    path(
        'documents/<int:pk>/',
        PatientDocumentViewSet.as_view({'delete': 'destroy'}),
        name='patient-document-detail',
    ),
] + router.urls

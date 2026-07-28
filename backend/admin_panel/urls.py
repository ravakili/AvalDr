from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminDashboardView,
    AuditLogViewSet,
    DefinitionViewSet,
    DoctorManageViewSet,
    DrugSuggestionViewSet,
    HealthTipViewSet,
    PlatformSettingViewSet,
    SmsTemplateViewSet,
    SpecialtyViewSet,
    UserExportView,
    UserManageViewSet,
    WithdrawalViewSet,
)

router = DefaultRouter()
router.register('specialties', SpecialtyViewSet, basename='admin-specialty')
router.register('definitions', DefinitionViewSet, basename='admin-definition')
router.register('health-tips', HealthTipViewSet, basename='admin-health-tip')
router.register('audit-logs', AuditLogViewSet, basename='admin-audit-log')
router.register('withdrawals', WithdrawalViewSet, basename='admin-withdrawal')
router.register('settings', PlatformSettingViewSet, basename='admin-setting')
router.register('sms-templates', SmsTemplateViewSet, basename='admin-sms-template')
router.register('drug-suggestions', DrugSuggestionViewSet, basename='admin-drug-suggestion')
router.register('users', UserManageViewSet, basename='admin-user')
router.register('doctors', DoctorManageViewSet, basename='admin-doctor')

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view({'get': 'list'}), name='admin-dashboard'),
    path('users-export/', UserExportView.as_view({'get': 'list'}), name='admin-user-export'),
] + router.urls

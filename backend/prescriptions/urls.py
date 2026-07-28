from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DrugSuggestionViewSet, PrescriptionViewSet

router = DefaultRouter()
router.register('', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    path('suggestions/', DrugSuggestionViewSet.as_view({'get': 'list'}), name='drug-suggestions'),
] + router.urls

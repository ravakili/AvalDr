from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from admin_panel.models import DrugSuggestion
from admin_panel.serializers import DrugSuggestionSerializer
from appointments.models import Appointment
from chat.models import ChatMessage
from config.permissions import IsActiveUser

from .models import Prescription
from .serializers import PrescriptionSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = (IsActiveUser,)
    pagination_class = None
    http_method_names = ('get', 'post', 'patch', 'head', 'options')

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Prescription.objects.none()
        user = self.request.user
        queryset = Prescription.objects.prefetch_related('items')
        if user.role == 'doctor':
            return queryset.filter(doctor__user=user)
        if user.role == 'admin':
            return queryset
        return queryset.filter(patient=user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'detail': 'فقط پزشک می‌تواند نسخه صادر کند.'}, status=403)
        appointment = get_object_or_404(
            Appointment, pk=request.data.get('appointmentId'), doctor__user=request.user
        )
        if appointment.status not in ('in-progress', 'completed'):
            return Response({'detail': 'صدور نسخه فقط در زمان یا پس از مشاوره مجاز است.'}, status=409)
        if hasattr(appointment, 'prescription'):
            return Response({'detail': 'برای این نوبت قبلاً نسخه صادر شده است.'}, status=409)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prescription = serializer.save(
            appointment=appointment,
            doctor=appointment.doctor,
            patient=appointment.patient,
        )
        ChatMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            text='نسخه پزشکی صادر شد.',
            message_type='prescription',
        )
        return Response(self.get_serializer(prescription).data, status=status.HTTP_201_CREATED)


class DrugSuggestionViewSet(viewsets.GenericViewSet):
    permission_classes = (IsActiveUser,)
    serializer_class = DrugSuggestionSerializer

    def list(self, request):
        query = request.query_params.get('q', '')
        suggestions = DrugSuggestion.objects.filter(name__icontains=query)[:20]
        return Response([item.name for item in suggestions])

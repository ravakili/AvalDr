from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from config.permissions import IsPatient

from .models import MedicalRecord, MedicalReport, PatientDocument
from .serializers import (
    MedicalRecordSerializer,
    MedicalReportSerializer,
    PatientDocumentSerializer,
)


class MedicalRecordViewSet(viewsets.GenericViewSet):
    permission_classes = (IsPatient,)
    serializer_class = MedicalRecordSerializer

    def list(self, request):
        record, _ = MedicalRecord.objects.get_or_create(patient=request.user)
        return Response(MedicalRecordSerializer(record).data)

    def partial_update(self, request):
        record, _ = MedicalRecord.objects.get_or_create(patient=request.user)
        serializer = MedicalRecordSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PatientDocumentViewSet(viewsets.GenericViewSet):
    permission_classes = (IsPatient,)
    serializer_class = PatientDocumentSerializer

    def create(self, request):
        serializer = PatientDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(patient=request.user)
        return Response(PatientDocumentSerializer(document).data, status=201)

    def destroy(self, request, pk=None):
        document = get_object_or_404(PatientDocument, patient=request.user, pk=pk)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MedicalReportViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalReportSerializer
    permission_classes = (IsPatient,)
    pagination_class = None
    http_method_names = ('get', 'post', 'patch', 'delete', 'head', 'options')

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MedicalReport.objects.none()
        return MedicalReport.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

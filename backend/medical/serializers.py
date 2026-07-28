from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from .models import MedicalRecord, MedicalReport, PatientDocument


class PatientDocumentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.CharField(source='doc_type', read_only=True)
    url = serializers.FileField(source='file', read_only=True)
    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = PatientDocument
        fields = ('id', 'name', 'type', 'url', 'uploadedAt', 'file')
        extra_kwargs = {'file': {'write_only': True}}
        read_only_fields = ('id', 'type', 'url', 'uploadedAt')

    def create(self, validated_data):
        file_obj = validated_data['file']
        validated_data['doc_type'] = file_obj.name.rsplit('.', 1)[-1].lower()
        validated_data.setdefault('name', file_obj.name)
        return super().create(validated_data)


class MedicalRecordSerializer(serializers.ModelSerializer):
    documents = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = ('diagnoses', 'allergies', 'medications', 'notes', 'documents')

    @extend_schema_field(PatientDocumentSerializer(many=True))
    def get_documents(self, obj):
        return PatientDocumentSerializer(obj.patient.documents.all(), many=True).data


class MedicalReportSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.CharField(source='file_type', read_only=True)
    url = serializers.FileField(source='file', read_only=True)
    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = MedicalReport
        fields = ('id', 'name', 'type', 'url', 'uploadedAt', 'saved', 'file')
        extra_kwargs = {'file': {'write_only': True}}
        read_only_fields = ('id', 'type', 'url', 'uploadedAt')

    def create(self, validated_data):
        file_obj = validated_data['file']
        validated_data['file_type'] = file_obj.name.rsplit('.', 1)[-1].lower()
        validated_data.setdefault('name', file_obj.name)
        return super().create(validated_data)

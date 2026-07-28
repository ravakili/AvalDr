from rest_framework import serializers

from .models import Prescription, PrescriptionItem


class PrescriptionItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = PrescriptionItem
        fields = ('id', 'drug', 'usage', 'dosage', 'duration')
        read_only_fields = ('id',)


class PrescriptionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    appointmentId = serializers.CharField(source='appointment_id', read_only=True)
    doctorId = serializers.CharField(source='doctor_id', read_only=True)
    patientId = serializers.CharField(source='patient.patient_profile.pk', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    items = PrescriptionItemSerializer(many=True)

    class Meta:
        model = Prescription
        fields = (
            'id', 'appointmentId', 'doctorId', 'patientId', 'items', 'notes', 'createdAt'
        )
        read_only_fields = ('id', 'appointmentId', 'doctorId', 'patientId', 'createdAt')

    def create(self, validated_data):
        items = validated_data.pop('items')
        prescription = Prescription.objects.create(**validated_data)
        PrescriptionItem.objects.bulk_create(
            [PrescriptionItem(prescription=prescription, **item) for item in items]
        )
        return prescription

    def update(self, instance, validated_data):
        items = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)
        if items is not None:
            instance.items.all().delete()
            PrescriptionItem.objects.bulk_create(
                [PrescriptionItem(prescription=instance, **item) for item in items]
            )
        return instance

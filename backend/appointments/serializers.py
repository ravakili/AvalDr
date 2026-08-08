from datetime import date

from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema_field

from accounts.models import User
from accounts.serializers import PatientProfileSerializer
from doctors.models import DoctorProfile
from doctors.models import CommunicationSetting
from doctors.serializers import PublicDoctorSerializer

from .models import Appointment, VisitLog
from .services import expire_stale_pending_payments


class AppointmentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    patientId = serializers.CharField(source='patient.patient_profile.pk', read_only=True)
    doctorId = serializers.CharField(source='doctor.pk', read_only=True)
    time = serializers.TimeField(format='%H:%M', read_only=True)
    endTime = serializers.TimeField(source='end_time', format='%H:%M', read_only=True)
    consultType = serializers.CharField(source='consult_type')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    startedAt = serializers.DateTimeField(source='started_at', read_only=True)
    isFollowUp = serializers.BooleanField(source='is_follow_up', required=False, default=False)
    patient = serializers.SerializerMethodField()
    doctor = PublicDoctorSerializer(read_only=True)
    paymentStatus = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = (
            'id', 'patientId', 'doctorId', 'date', 'time', 'endTime', 'status',
            'reason', 'consultType', 'createdAt', 'startedAt', 'isFollowUp', 'patient', 'doctor', 'paymentStatus',
        )

    @extend_schema_field(PatientProfileSerializer)
    def get_patient(self, obj):
        if hasattr(obj.patient, 'patient_profile'):
            return PatientProfileSerializer(obj.patient.patient_profile).data
        return None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_paymentStatus(self, obj):
        return obj.payment_record.status if hasattr(obj, 'payment_record') else None


class AppointmentCreateSerializer(serializers.ModelSerializer):
    doctorId = serializers.PrimaryKeyRelatedField(
        source='doctor', queryset=DoctorProfile.objects.filter(status='approved')
    )
    endTime = serializers.TimeField(source='end_time', required=False, allow_null=True)
    consultType = serializers.ChoiceField(source='consult_type', choices=Appointment.CONSULT_CHOICES)
    patientId = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    isFollowUp = serializers.BooleanField(required=False, default=False, write_only=True)

    class Meta:
        model = Appointment
        fields = (
            'doctorId', 'date', 'time', 'endTime', 'reason', 'consultType',
            'patientId', 'isFollowUp',
        )

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError('تاریخ نمی‌تواند در گذشته باشد.')
        return value

    def validate(self, attrs):
        expire_stale_pending_payments()
        user = self.context['request'].user
        doctor = attrs['doctor']
        consult_type = attrs['consult_type']
        is_follow_up = attrs.get('isFollowUp', False)
        patient_id = attrs.get('patientId')

        # Only a doctor or the admin may create an appointment for someone else
        # (the follow-up flow). Patients always book for themselves.
        is_moderated = user.role in ('doctor', 'admin')
        if patient_id and not is_moderated:
            raise PermissionDenied('فقط پزشک یا ادمین می‌تواند نوبت پیگیری ثبت کند.')

        if is_follow_up and patient_id and is_moderated:
            try:
                attrs['patient'] = User.objects.get(patient_profile__pk=patient_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({'patientId': 'بیمار یافت نشد.'})
        elif patient_id and not is_follow_up:
            # doctor/admin manually creating a normal appointment for a patient
            try:
                attrs['patient'] = User.objects.get(patient_profile__pk=patient_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({'patientId': 'بیمار یافت نشد.'})

        # A doctor/admin creating a follow-up has already decided on the method,
        # so the enabled-flag guard is not needed (it would otherwise block booking).
        if not is_follow_up or not is_moderated:
            try:
                communication = doctor.comm_settings
            except CommunicationSetting.DoesNotExist:
                communication = None
            if communication and not getattr(communication, f'{consult_type}_enabled'):
                raise serializers.ValidationError({'consultType': 'این روش مشاوره فعال نیست.'})

        if Appointment.objects.filter(
            doctor=doctor,
            date=attrs['date'],
            time=attrs['time'],
            status__in=('pending-payment', 'pending-approval', 'waiting', 'in-progress'),
        ).exists():
            raise serializers.ValidationError({'time': 'این ساعت قبلاً رزرو شده است.'})
        return attrs

    def create(self, validated_data):
        patient = validated_data.pop('patient', None) or self.context['request'].user
        is_follow_up = validated_data.pop('isFollowUp', False)
        return Appointment.objects.create(
            patient=patient,
            status='pending-payment',
            is_follow_up=is_follow_up,
            **validated_data,
        )


class VisitLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    actorName = serializers.CharField(source='actor.display_name', read_only=True)

    class Meta:
        model = VisitLog
        fields = ('id', 'action', 'actorName', 'timestamp')

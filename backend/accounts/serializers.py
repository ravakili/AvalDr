import re

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from admin_panel.models import Specialty
from doctors.models import CommunicationSetting, DoctorProfile
from medical.models import MedicalRecord

from .models import PatientProfile

User = get_user_model()


def validate_phone(value):
    normalized = re.sub(r'\D', '', value)
    if not re.fullmatch(r'09\d{9}', normalized):
        raise serializers.ValidationError('شماره موبایل باید با 09 شروع شود و 11 رقم باشد.')
    return normalized


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(source='display_name', read_only=True)
    refId = serializers.CharField(source='ref_id', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'role', 'avatar', 'phone', 'email', 'refId')


class PatientProfileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(source='full_name')
    phone = serializers.CharField(source='user.phone', read_only=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    avatar = serializers.URLField(source='user.avatar', required=False, allow_blank=True)
    nationalId = serializers.CharField(source='national_id', required=False, allow_blank=True)
    dateOfBirth = serializers.DateField(source='birth_date', required=False, allow_null=True)
    bloodType = serializers.CharField(source='blood_type', required=False, allow_blank=True)
    emergencyContact = serializers.JSONField(source='emergency_contact', required=False)
    receiveNotifications = serializers.BooleanField(source='receive_notifications', required=False)
    receivePromotions = serializers.BooleanField(source='receive_promotions', required=False)
    age = serializers.SerializerMethodField()
    medicalHistory = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = (
            'id', 'name', 'avatar', 'phone', 'email', 'nationalId', 'dateOfBirth',
            'gender', 'city', 'bloodType', 'emergencyContact', 'receiveNotifications',
            'receivePromotions', 'age', 'medicalHistory', 'suspended',
        )
        read_only_fields = ('id', 'suspended')

    @extend_schema_field(serializers.IntegerField)
    def get_age(self, obj):
        if not obj.birth_date:
            return 0
        from django.utils import timezone
        today = timezone.localdate()
        return (
            today.year
            - obj.birth_date.year
            - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        )

    def get_medicalHistory(self, obj):
        from medical.models import MedicalRecord
        from medical.serializers import MedicalRecordSerializer

        record, _ = MedicalRecord.objects.get_or_create(patient=obj.user)
        return MedicalRecordSerializer(record).data

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for field, value in user_data.items():
            setattr(instance.user, field, value)
        if user_data:
            instance.user.save()
        return super().update(instance, validated_data)


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(validators=[validate_phone])


class VerifyOTPSerializer(SendOTPSerializer):
    code = serializers.RegexField(r'^\d{6}$')


class CompleteProfileSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True)
    dateOfBirth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=('male', 'female'), required=False, allow_blank=True)
    bloodType = serializers.CharField(max_length=5, required=False, allow_blank=True)
    allergies = serializers.ListField(child=serializers.CharField(max_length=100), required=False)
    chronicConditions = serializers.ListField(child=serializers.CharField(max_length=100), required=False)
    emergencyContact = serializers.JSONField(required=False)
    isDoctor = serializers.BooleanField(default=False)
    specialtyId = serializers.PrimaryKeyRelatedField(
        source='specialty', queryset=Specialty.objects.all(), required=False
    )
    city = serializers.CharField(max_length=50, required=False, allow_blank=True)
    hospital = serializers.CharField(max_length=100, required=False, allow_blank=True)
    experienceYears = serializers.IntegerField(min_value=0, required=False, default=0)
    acceptTerms = serializers.BooleanField()
    acceptPrivacy = serializers.BooleanField()
    receiveNotifications = serializers.BooleanField(default=True)
    receivePromotions = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if not attrs['acceptTerms'] or not attrs['acceptPrivacy']:
            raise serializers.ValidationError('پذیرش قوانین و حریم خصوصی الزامی است.')
        if attrs['isDoctor'] and not attrs.get('specialty'):
            attrs['specialty'] = (
                Specialty.objects.filter(name='پزشک عمومی').first()
                or Specialty.objects.first()
            )
            if not attrs['specialty']:
                raise serializers.ValidationError({'specialtyId': 'هیچ تخصصی در سامانه تعریف نشده است.'})
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        user = self.context['request'].user
        data = self.validated_data
        name_parts = data['name'].strip().split(maxsplit=1)
        user.first_name = name_parts[0]
        user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        user.email = data.get('email', '')
        user.username = user.phone
        user.role = 'doctor' if data['isDoctor'] else 'user'
        user.save()

        if data['isDoctor']:
            PatientProfile.objects.filter(user=user).delete()
            profile, _ = DoctorProfile.objects.update_or_create(
                user=user,
                defaults={
                    'specialty': data['specialty'],
                    'city': data.get('city', ''),
                    'hospital': data.get('hospital', ''),
                    'experience_years': data.get('experienceYears', 0),
                },
            )
            CommunicationSetting.objects.get_or_create(doctor=profile)
        else:
            DoctorProfile.objects.filter(user=user).delete()
            PatientProfile.objects.update_or_create(
                user=user,
                defaults={
                    'full_name': data['name'],
                    'birth_date': data.get('dateOfBirth'),
                    'gender': data.get('gender', ''),
                    'blood_type': data.get('bloodType', ''),
                    'emergency_contact': data.get('emergencyContact', {}),
                    'receive_notifications': data.get('receiveNotifications', True),
                    'receive_promotions': data.get('receivePromotions', False),
                },
            )
            MedicalRecord.objects.update_or_create(
                patient=user,
                defaults={
                    'allergies': data.get('allergies', []),
                    'diagnoses': data.get('chronicConditions', []),
                },
            )
        return user

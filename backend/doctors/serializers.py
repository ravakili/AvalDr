from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from admin_panel.models import Specialty

from .models import CommunicationSetting, DoctorDocument, DoctorProfile, WorkingHour


class WorkingHourSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    breakMinutes = serializers.IntegerField(source='break_minutes', min_value=0, max_value=180)

    class Meta:
        model = WorkingHour
        fields = ('id', 'day', 'breakMinutes')
        read_only_fields = ('id',)

    def get_fields(self):
        fields = super().get_fields()
        fields['from'] = serializers.TimeField(
            source='from_time', format='%H:%M', input_formats=['%H:%M']
        )
        fields['to'] = serializers.TimeField(
            source='to_time', format='%H:%M', input_formats=['%H:%M']
        )
        return fields

    def validate(self, attrs):
        if attrs['from_time'] >= attrs['to_time']:
            raise serializers.ValidationError('ساعت پایان باید بعد از ساعت شروع باشد.')
        doctor = self.context.get('doctor')
        if doctor:
            overlap = WorkingHour.objects.filter(
                doctor=doctor,
                day=attrs['day'],
                from_time__lt=attrs['to_time'],
                to_time__gt=attrs['from_time'],
            )
            if self.instance:
                overlap = overlap.exclude(pk=self.instance.pk)
            if overlap.exists():
                raise serializers.ValidationError('این بازه با ساعات کاری موجود تداخل دارد.')
        return attrs


class CommunicationSettingSerializer(serializers.ModelSerializer):
    chat = serializers.SerializerMethodField()
    audio = serializers.SerializerMethodField()
    video = serializers.SerializerMethodField()

    class Meta:
        model = CommunicationSetting
        fields = ('chat', 'audio', 'video')

    @extend_schema_field(serializers.DictField)
    def get_chat(self, obj):
        return {'enabled': obj.chat_enabled, 'fee': obj.chat_fee}

    @extend_schema_field(serializers.DictField)
    def get_audio(self, obj):
        return {'enabled': obj.audio_enabled, 'fee': obj.audio_fee}

    @extend_schema_field(serializers.DictField)
    def get_video(self, obj):
        return {'enabled': obj.video_enabled, 'fee': obj.video_fee}

    def update(self, instance, validated_data):
        raw = self.initial_data
        for consult_type in ('chat', 'audio', 'video'):
            values = raw.get(consult_type)
            if values is None:
                continue
            if 'enabled' in values:
                setattr(instance, f'{consult_type}_enabled', bool(values['enabled']))
            if 'fee' in values:
                fee = int(values['fee'])
                if fee < 0:
                    raise serializers.ValidationError({consult_type: 'تعرفه نمی‌تواند منفی باشد.'})
                setattr(instance, f'{consult_type}_fee', fee)
        instance.save()
        return instance


class DoctorDocumentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.CharField(source='doc_type')
    url = serializers.FileField(source='file', read_only=True)
    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = DoctorDocument
        fields = ('id', 'type', 'url', 'verified', 'uploadedAt', 'file')
        extra_kwargs = {'file': {'write_only': True}}
        read_only_fields = ('id', 'verified', 'uploadedAt')


class DoctorSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(source='user.display_name', read_only=True)
    avatar = serializers.URLField(source='user.avatar', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    specialtyId = serializers.CharField(source='specialty_id', read_only=True)
    specialtyName = serializers.CharField(source='specialty.name', read_only=True)
    specialtyIcon = serializers.CharField(source='specialty.icon', read_only=True)
    experienceYears = serializers.IntegerField(source='experience_years')
    reviewsCount = serializers.IntegerField(source='reviews_count', read_only=True)
    workingHours = WorkingHourSerializer(source='working_hours', many=True, read_only=True)
    communication = CommunicationSettingSerializer(source='comm_settings', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = (
            'id', 'name', 'avatar', 'phone', 'email', 'specialtyId', 'specialtyName',
            'specialtyIcon', 'city', 'hospital', 'address', 'location', 'experienceYears',
            'rating', 'reviewsCount', 'fee', 'status', 'bio', 'workingHours', 'verified',
            'communication',
        )
        read_only_fields = ('id', 'rating', 'reviewsCount', 'status', 'verified')


class DoctorProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.display_name', required=False)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    avatar = serializers.URLField(source='user.avatar', required=False, allow_blank=True)
    specialtyId = serializers.PrimaryKeyRelatedField(
        source='specialty', queryset=Specialty.objects.all(), required=False
    )
    experienceYears = serializers.IntegerField(source='experience_years', min_value=0, required=False)
    cardNumber = serializers.CharField(source='card_number', required=False, allow_blank=True)
    accountNumber = serializers.CharField(source='account_number', required=False, allow_blank=True)

    class Meta:
        model = DoctorProfile
        fields = (
            'name', 'email', 'avatar', 'specialtyId', 'city', 'hospital', 'address',
            'location', 'experienceYears', 'fee', 'bio', 'cardNumber', 'accountNumber', 'shaba',
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        display_name = user_data.pop('display_name', None)
        if display_name is not None:
            parts = display_name.strip().split(maxsplit=1)
            instance.user.first_name = parts[0]
            instance.user.last_name = parts[1] if len(parts) > 1 else ''
        for field, value in user_data.items():
            setattr(instance.user, field, value)
        if display_name is not None or user_data:
            instance.user.save()
        return super().update(instance, validated_data)

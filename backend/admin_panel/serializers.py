from rest_framework import serializers

from .models import (
    AuditLog,
    Definition,
    DrugSuggestion,
    HealthTip,
    PlatformSetting,
    SmsTemplate,
    Specialty,
    WithdrawalRequest,
)


class SpecialtySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Specialty
        fields = ('id', 'name', 'icon', 'description')


class DefinitionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Definition
        fields = ('id', 'type', 'name')


class HealthTipSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = HealthTip
        fields = ('id', 'title', 'text', 'icon', 'active', 'createdAt')


class AuditLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    actor = serializers.CharField(source='actor_id', read_only=True)
    actorName = serializers.CharField(source='actor_name', read_only=True)
    targetName = serializers.CharField(source='target_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            'id', 'action', 'actor', 'actorName', 'target', 'targetName', 'details', 'timestamp'
        )


class WithdrawalSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    doctorId = serializers.CharField(source='doctor_id', read_only=True)
    doctorName = serializers.CharField(source='doctor.user.display_name', read_only=True)
    bankInfo = serializers.CharField(source='bank_info', read_only=True)
    adminNote = serializers.CharField(source='admin_note', required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    processedAt = serializers.DateTimeField(source='processed_at', read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = (
            'id', 'doctorId', 'doctorName', 'amount', 'status', 'createdAt',
            'processedAt', 'adminNote', 'bankInfo',
        )
        read_only_fields = (
            'id', 'doctorId', 'doctorName', 'amount', 'createdAt', 'processedAt', 'bankInfo'
        )


class PlatformSettingSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='setting_type')

    class Meta:
        model = PlatformSetting
        fields = ('key', 'label', 'value', 'type', 'options')


class SmsTemplateSerializer(serializers.ModelSerializer):
    body = serializers.CharField(source='template')

    class Meta:
        model = SmsTemplate
        fields = ('key', 'label', 'body')


class DrugSuggestionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = DrugSuggestion
        fields = ('id', 'name')

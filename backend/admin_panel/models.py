from django.db import models
from django.conf import settings


class Specialty(models.Model):
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=10, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'specialties'
        verbose_name_plural = 'تخصص‌ها'

    def __str__(self):
        return self.name


class Definition(models.Model):
    TYPE_CHOICES = (
        ('diagnosis', 'تشخیص'),
        ('allergy', 'آلرژی'),
        ('drug', 'دارو'),
        ('city', 'شهر'),
        ('gender', 'جنسیت'),
        ('blood_type', 'گروه خونی'),
        ('marital_status', 'وضعیت تأهل'),
    )

    type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'definitions'
        unique_together = ('type', 'name')

    def __str__(self):
        return f'{self.get_type_display()}: {self.name}'


class HealthTip(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField()
    icon = models.CharField(max_length=10, default='💡')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'health_tips'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'ایجاد'),
        ('update', 'بروزرسانی'),
        ('delete', 'حذف'),
        ('approve', 'تأیید'),
        ('reject', 'رد'),
        ('suspend', 'تعلیق'),
        ('unsuspend', 'رفع تعلیق'),
        ('verify', 'تأیید مدارک'),
        ('login', 'ورود'),
        ('logout', 'خروج'),
        ('export', 'خروجی'),
        ('settings_change', 'تغییر تنظیمات'),
    )

    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    actor_name = models.CharField(max_length=100, blank=True)
    target = models.CharField(max_length=50, blank=True)
    target_name = models.CharField(max_length=100, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.get_action_display()} by {self.actor_name} at {self.timestamp}'


class WithdrawalRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'در انتظار'),
        ('approved', 'تأیید'),
        ('rejected', 'رد'),
    )

    doctor = models.ForeignKey('doctors.DoctorProfile', on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    bank_info = models.CharField(max_length=255, blank=True)
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'withdrawal_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'Withdrawal {self.amount} - {self.status}'


class PlatformSetting(models.Model):
    SETTING_TYPE_CHOICES = (
        ('text', 'متن'),
        ('number', 'عدد'),
        ('toggle', 'تغییر وضعیت'),
        ('select', 'انتخاب'),
    )

    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    value = models.TextField(blank=True, default='')
    setting_type = models.CharField(max_length=10, choices=SETTING_TYPE_CHOICES, default='text')
    options = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_settings'

    def __str__(self):
        return f'{self.key}: {self.value}'


class SmsTemplate(models.Model):
    KEY_CHOICES = (
        ('welcome', 'خوش آمدگویی'),
        ('appointment_confirmation', 'تأیید نوبت'),
        ('appointment_reminder', 'یادآوری نوبت'),
        ('prescription_ready', 'نسخه آماده'),
        ('withdrawal_approved', 'برداشت تأیید'),
        ('withdrawal_rejected', 'برداشت رد'),
    )
    key = models.CharField(max_length=30, choices=KEY_CHOICES, unique=True)
    label = models.CharField(max_length=100)
    template = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sms_templates'

    def __str__(self):
        return self.label


class DrugSuggestion(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'drug_suggestions'
        ordering = ['name']

    def __str__(self):
        return self.name
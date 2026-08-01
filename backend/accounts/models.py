from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'Patient'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=11, unique=True)
    avatar = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.display_name} ({self.get_role_display()})'

    @property
    def display_name(self):
        return self.get_full_name().strip() or self.username or self.phone

    @property
    def ref_id(self):
        if self.role == 'doctor' and hasattr(self, 'doctor_profile'):
            return str(self.doctor_profile.pk)
        if self.role == 'user' and hasattr(self, 'patient_profile'):
            return str(self.patient_profile.pk)
        return ''

    @property
    def is_patient(self):
        return self.role == 'user'

    @property
    def is_doctor(self):
        return self.role == 'doctor'


class PatientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    full_name = models.CharField(max_length=100)
    national_id = models.CharField(max_length=10, blank=True)
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=6, choices=(('male', 'آقا'), ('female', 'خانم')), blank=True)
    city = models.CharField(max_length=50, blank=True)
    blood_type = models.CharField(max_length=5, blank=True)
    insurance_type = models.CharField(max_length=50, blank=True)
    supplementary_insurance = models.CharField(max_length=50, blank=True)
    emergency_contact = models.JSONField(default=dict, blank=True)
    receive_notifications = models.BooleanField(default=True)
    receive_promotions = models.BooleanField(default=False)
    suspended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_profiles'

    def __str__(self):
        return self.full_name

from django.db import models
from django.conf import settings


class MedicalRecord(models.Model):
    patient = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='medical_record')
    diagnoses = models.JSONField(default=list)
    allergies = models.JSONField(default=list)
    medications = models.JSONField(default=list)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medical_records'

    def __str__(self):
        return f'Medical Record - {self.patient}'


class PatientDocument(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='medical_reports/%Y/%m/')
    doc_type = models.CharField(max_length=10, verbose_name='نوع فایل')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.name} - {self.patient}'


class MedicalReport(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports')
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=5, verbose_name='نوع فایل')
    file = models.FileField(upload_to='medical_reports/%Y/%m/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    saved = models.BooleanField(default=False)

    class Meta:
        db_table = 'medical_reports'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.name} - {self.patient}'
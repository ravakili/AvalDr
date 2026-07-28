from django.db import models
from django.conf import settings


class Prescription(models.Model):
    appointment = models.OneToOneField('appointments.Appointment', on_delete=models.CASCADE, related_name='prescription')
    doctor = models.ForeignKey('doctors.DoctorProfile', on_delete=models.CASCADE, related_name='prescriptions')
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescriptions'

    def __str__(self):
        return f'Prescription for {self.patient} by Dr. {self.doctor}'


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    drug = models.CharField(max_length=100)
    usage = models.CharField(max_length=200, blank=True)
    dosage = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'prescription_items'

    def __str__(self):
        return self.drug
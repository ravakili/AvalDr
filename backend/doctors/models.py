from django.db import models
from django.conf import settings


class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.ForeignKey('admin_panel.Specialty', on_delete=models.PROTECT, related_name='doctors')
    city = models.CharField(max_length=50)
    hospital = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    experience_years = models.IntegerField(default=0)
    rating = models.FloatField(default=0)
    reviews_count = models.IntegerField(default=0)
    fee = models.PositiveIntegerField(default=0)
    card_number = models.CharField(max_length=19, blank=True)
    account_number = models.CharField(max_length=30, blank=True)
    shaba = models.CharField(max_length=26, blank=True)
    bio = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=(
        ('approved', 'تأیید'),
        ('pending', 'در انتظار'),
        ('suspended', 'معلق'),
    ), default='pending')
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'doctor_profiles'

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.specialty.name}'


class WorkingHour(models.Model):
    DAY_CHOICES = (
        ('شنبه', 'شنبه'),
        ('یکشنبه', 'یکشنبه'),
        ('دوشنبه', 'دوشنبه'),
        ('سه‌شنبه', 'سه‌شنبه'),
        ('چهارشنبه', 'چهارشنبه'),
        ('پنجشنبه', 'پنجشنبه'),
        ('جمعه', 'جمعه'),
    )

    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='working_hours')
    day = models.CharField(max_length=12, choices=DAY_CHOICES)
    from_time = models.TimeField()
    to_time = models.TimeField()
    break_minutes = models.IntegerField(default=0)
    appointment_duration_minutes = models.IntegerField(default=30)

    class Meta:
        db_table = 'working_hours'
        ordering = ('day', 'from_time')
        constraints = [
            models.UniqueConstraint(
                fields=('doctor', 'day', 'from_time', 'to_time'),
                name='unique_doctor_working_slot',
            ),
        ]

    def __str__(self):
        return f'{self.doctor} - {self.day} ({self.from_time.strftime("%H:%M")}-{self.to_time.strftime("%H:%M")})'


class CommunicationSetting(models.Model):
    doctor = models.OneToOneField(DoctorProfile, on_delete=models.CASCADE, related_name='comm_settings')
    chat_enabled = models.BooleanField(default=True)
    audio_enabled = models.BooleanField(default=True)
    video_enabled = models.BooleanField(default=True)
    chat_fee = models.PositiveIntegerField(default=100000)
    audio_fee = models.PositiveIntegerField(default=150000)
    video_fee = models.PositiveIntegerField(default=250000)
    chat_auto_close_minutes = models.PositiveIntegerField(default=1440)

    class Meta:
        db_table = 'communication_settings'


class DoctorDocument(models.Model):
    DOC_TYPE_CHOICES = (
        ('license', 'مجوز فعالیت'),
        ('national_id', 'کارت ملی'),
        ('experience', 'سوابق کار'),
        ('specialty', 'تخصص'),
        ('profile_photo', 'عکس پروفایل'),
        ('other', 'سایر'),
    )
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to='doctor_docs/%Y/%m/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'doctor_documents'

    def __str__(self):
        return f'{self.doctor} - {self.get_doc_type_display()}'

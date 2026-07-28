from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import PatientProfile
from admin_panel.models import DrugSuggestion, PlatformSetting, SmsTemplate, Specialty
from doctors.models import CommunicationSetting, DoctorProfile, WorkingHour
from medical.models import MedicalRecord

User = get_user_model()

SPECIALTIES = (
    ('قلب و عروق', '🫀'),
    ('پوست و مو', '🧴'),
    ('مغز و اعصاب', '🧠'),
    ('ارتوپدی', '🦴'),
    ('اطفال', '🧸'),
    ('گوش و حلق و بینی', '👂'),
    ('چشم پزشکی', '👁️'),
    ('روان پزشکی', '🧘'),
    ('دندان پزشکی', '🦷'),
    ('پزشک عمومی', '🩺'),
)

SETTINGS = (
    ('commission_rate', 'نرخ کمیسیون (درصد)', '15', 'number', []),
    ('min_appointment_fee', 'حداقل هزینه ویزیت (تومان)', '100000', 'number', []),
    ('max_daily_appointments', 'حداکثر نوبت روزانه هر پزشک', '20', 'number', []),
    ('allow_video_consult', 'فعال‌سازی مشاوره ویدئویی', 'true', 'toggle', []),
    ('allow_audio_consult', 'فعال‌سازی مشاوره صوتی', 'true', 'toggle', []),
    ('auto_approve_doctors', 'تأیید خودکار پزشکان', 'false', 'toggle', []),
    ('platform_currency', 'واحد پول', 'toman', 'select', ['toman', 'rial', 'dollar']),
    ('support_email', 'ایمیل پشتیبانی', 'support@avaldr.ir', 'text', []),
    ('notification_sms', 'ارسال پیامک اعلان', 'true', 'toggle', []),
    ('cancellation_policy_hours', 'ساعت مجاز لغو قبل از نوبت', '2', 'number', []),
)

DRUGS = (
    'آتورواستاتین ۲۰ میلی‌گرم',
    'آسپرین ۸۰ میلی‌گرم',
    'متفورمین ۵۰۰ میلی‌گرم',
    'لوزارتان ۵۰ میلی‌گرم',
    'آملودیپین ۵ میلی‌گرم',
    'امپرازول ۲۰ میلی‌گرم',
    'سوماتریپتان ۵۰ میلی‌گرم',
    'فلوکستین ۲۰ میلی‌گرم',
    'لوراتادین ۱۰ میلی‌گرم',
)


class Command(BaseCommand):
    help = 'Create idempotent demo data matching the frontend domain.'

    @transaction.atomic
    def handle(self, *args, **options):
        specialties = {}
        for name, icon in SPECIALTIES:
            specialty, _ = Specialty.objects.update_or_create(
                name=name, defaults={'icon': icon}
            )
            specialties[name] = specialty

        for key, label, value, setting_type, setting_options in SETTINGS:
            PlatformSetting.objects.update_or_create(
                key=key,
                defaults={
                    'label': label,
                    'value': value,
                    'setting_type': setting_type,
                    'options': setting_options,
                },
            )
        for name in DRUGS:
            DrugSuggestion.objects.get_or_create(name=name)

        for key, label, body in (
            ('welcome', 'پیام خوش‌آمد کاربر', 'سلام {name}، به اول دکتر خوش آمدید.'),
            (
                'appointment_confirmation',
                'تأیید نوبت',
                'نوبت شما با {doctor} در تاریخ {date} ساعت {time} تأیید شد.',
            ),
            ('appointment_reminder', 'یادآوری نوبت', 'نوبت شما تا یک ساعت دیگر آغاز می‌شود.'),
            (
                'prescription_ready',
                'آماده شدن نسخه',
                'نسخه شما توسط {doctor} صادر شد.',
            ),
        ):
            SmsTemplate.objects.update_or_create(
                key=key, defaults={'label': label, 'template': body}
            )

        admin, _ = User.objects.update_or_create(
            phone='09123456788',
            defaults={
                'username': '09123456788',
                'role': 'admin',
                'first_name': 'مدیر',
                'last_name': 'سیستم',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin.set_unusable_password()
        admin.save()

        patient_user, _ = User.objects.update_or_create(
            phone='09330001111',
            defaults={
                'username': '09330001111',
                'role': 'user',
                'first_name': 'محمد',
                'last_name': 'رحیمی',
                'email': 'mohammad@example.com',
            },
        )
        PatientProfile.objects.update_or_create(
            user=patient_user,
            defaults={
                'full_name': 'محمد رحیمی',
                'national_id': '0012345678',
                'gender': 'male',
                'city': 'تهران',
            },
        )
        MedicalRecord.objects.update_or_create(
            patient=patient_user,
            defaults={
                'diagnoses': ['فشار خون بالا', 'چربی خون'],
                'allergies': ['پنی‌سیلین'],
                'medications': ['آتورواستاتین ۲۰', 'آسپرین ۸۰'],
                'notes': 'سابقه خانوادگی بیماری قلبی',
            },
        )

        doctor_user, _ = User.objects.update_or_create(
            phone='09121110001',
            defaults={
                'username': '09121110001',
                'role': 'doctor',
                'first_name': 'دکتر سارا',
                'last_name': 'محمدی',
                'email': 'sara@example.com',
            },
        )
        doctor, _ = DoctorProfile.objects.update_or_create(
            user=doctor_user,
            defaults={
                'specialty': specialties['قلب و عروق'],
                'city': 'تهران',
                'hospital': 'بیمارستان دی',
                'experience_years': 12,
                'rating': 4.9,
                'reviews_count': 318,
                'fee': 250000,
                'status': 'approved',
                'verified': True,
                'bio': 'متخصص قلب و عروق با تمرکز بر فشار خون و اکوکاردیوگرافی.',
            },
        )
        CommunicationSetting.objects.update_or_create(
            doctor=doctor,
            defaults={
                'chat_enabled': True,
                'audio_enabled': True,
                'video_enabled': True,
                'chat_fee': 100000,
                'audio_fee': 150000,
                'video_fee': 250000,
            },
        )
        for day in ('شنبه', 'دوشنبه'):
            WorkingHour.objects.get_or_create(
                doctor=doctor,
                day=day,
                from_time='08:00',
                to_time='14:00',
                defaults={'break_minutes': 0},
            )

        self.stdout.write(self.style.SUCCESS('AvalDr demo data is ready.'))

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import PatientProfile
from admin_panel.models import (
    AuditLog,
    Definition,
    DrugSuggestion,
    HealthTip,
    PlatformSetting,
    SmsTemplate,
    Specialty,
    WithdrawalRequest,
)
from appointments.models import Appointment
from chat.models import ChatMessage
from doctors.models import CommunicationSetting, DoctorProfile, WorkingHour
from medical.models import MedicalRecord
from payments.models import Payment
from prescriptions.models import Prescription, PrescriptionItem

User = get_user_model()


def avatar(seed):
    return f'https://i.pravatar.cc/300?u={seed}'


SPECIALTIES = (
    ('cardio', 'قلب و عروق', '🫀'),
    ('derma', 'پوست و مو', '🧴'),
    ('neuro', 'مغز و اعصاب', '🧠'),
    ('ortho', 'ارتوپدی', '🦴'),
    ('ped', 'اطفال', '🧸'),
    ('ent', 'گوش و حلق و بینی', '👂'),
    ('eye', 'چشم پزشکی', '👁️'),
    ('psy', 'روان پزشکی', '🧘'),
    ('dental', 'دندان پزشکی', '🦷'),
    ('gp', 'پزشک عمومی', '🩺'),
)

DOCTORS = (
    ('09121110001', 'سارا', 'محمدی', 'sara', 'cardio', 'تهران', 'بیمارستان دی', 12, 4.9, 318, 250000, 'approved', 'متخصص قلب و عروق با تخصص در اکوکاردیوگرافی و فشار خون.', (('شنبه', '08:00', '14:00'), ('دوشنبه', '08:00', '14:00'))),
    ('09121110002', 'علی', 'رضایی', 'ali', 'neuro', 'تهران', 'بیمارستان میلاد', 9, 4.7, 142, 300000, 'approved', 'نورولوژیست با تخصص در میگرن و اختلالات خواب.', (('یکشنبه', '09:00', '15:00'),)),
    ('09121110003', 'مریم', 'حسینی', 'maryam', 'derma', 'اصفهان', 'کلینیک پوست بهار', 7, 4.8, 205, 200000, 'approved', 'متخصص پوست، مو و زیبایی. درمان جوش و لک.', (('سه‌شنبه', '16:00', '20:00'),)),
    ('09121110004', 'حسین', 'کریمی', 'hossein', 'ortho', 'شیراز', 'بیمارستان نمازی', 15, 4.6, 289, 280000, 'approved', 'ارتوپد و جراح زانو با سابقه بین‌المللی.', (('چهارشنبه', '08:00', '12:00'),)),
    ('09121110005', 'نگار', 'اکبری', 'negar', 'ped', 'تهران', 'بیمارستان کودکان مفید', 11, 5.0, 412, 220000, 'approved', 'پزشک متخصص اطفال و نوزادان.', (('شنبه', '10:00', '16:00'),)),
    ('09121110006', 'رضا', 'قاسمی', 'reza', 'ent', 'مشهد', 'بیمارستان امام رضا', 8, 4.5, 96, 190000, 'pending', 'متخصص گوش، حلق و بینی در انتظار تأیید پروفایل.', (('یکشنبه', '08:00', '13:00'),)),
    ('09121110007', 'پارسا', 'نوری', 'parsa', 'eye', 'تبریز', 'بیمارستان میلاد', 14, 4.8, 175, 260000, 'suspended', 'چشم پزشک و جراح لیزیک.', (('سه‌شنبه', '09:00', '14:00'),)),
    ('09121110008', 'لیلا', 'صادقی', 'leila', 'psy', 'تهران', 'کلینیک آرامش', 10, 4.9, 233, 350000, 'approved', 'روان پزشک متخصص اضطراب و افسردگی.', (('شنبه', '14:00', '20:00'),)),
)

PATIENTS = (
    ('09330001111', 'محمد', 'رحیمی', 'mohammad', '0012345678', 34, 'male', 'تهران', ['فشار خون بالا (مرحله ۱)', 'چربی خون'], ['پنی‌سیلین'], ['آتورواستاتین ۲۰', 'آسپرین ۸۰'], 'سابقه خانوادگی بیماری قلبی'),
    ('09330002222', 'فاطمه', 'ابراهیمی', 'fatemeh', '0023456789', 28, 'female', 'اصفهان', [], [], [], ''),
    ('09330003333', 'زهرا', 'موسوی', 'zahra', '0034567890', 41, 'female', 'شیراز', ['دیابت نوع ۲', 'فشار خون بالا'], ['سولفونامید'], ['متفورمین ۵۰۰', 'لوزارتان ۵۰'], ''),
    ('09330004444', 'امیر', 'تهرانی', 'amir', '0045678901', 22, 'male', 'تهران', ['میگرن مزمن'], [], ['سوماتریپتان ۵۰'], ''),
    ('09330005555', 'نیلوفر', 'احمدی', 'niloofar', '0056789012', 36, 'female', 'مشهد', ['فشار خون بالا'], [], ['آتورواستاتین ۲۰', 'آسپرین ۸۰'], ''),
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
    'آتورواستاتین ۱۰ میلی‌گرم', 'آتورواستاتین ۲۰ میلی‌گرم',
    'آسپرین ۸۰ میلی‌گرم', 'متفورمین ۵۰۰ میلی‌گرم',
    'لوزارتان ۵۰ میلی‌گرم', 'آملودیپین ۵ میلی‌گرم',
    'امپرازول ۲۰ میلی‌گرم', 'سوماتریپتان ۵۰ میلی‌گرم',
    'فلوکستین ۲۰ میلی‌گرم', 'لوراتادین ۱۰ میلی‌گرم',
)


class Command(BaseCommand):
    help = 'Create the complete idempotent demo dataset used by the frontend.'

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.localdate()
        specialties = {}
        for key, name, icon in SPECIALTIES:
            specialties[key], _ = Specialty.objects.update_or_create(
                name=name, defaults={'icon': icon}
            )

        doctors = []
        for row in DOCTORS:
            phone, first, last, seed, specialty, city, hospital, years, rating, reviews, fee, status, bio, hours = row
            user, _ = User.objects.update_or_create(
                phone=phone,
                defaults={
                    'username': phone, 'role': 'doctor', 'first_name': first,
                    'last_name': last, 'email': f'{seed}@avaldr.ir',
                    'avatar': avatar(seed), 'is_active': status != 'suspended',
                },
            )
            user.set_unusable_password()
            user.save()
            profile, _ = DoctorProfile.objects.update_or_create(
                user=user,
                defaults={
                    'prefix': 'دکتر',
                    'specialty': specialties[specialty], 'city': city, 'hospital': hospital,
                    'experience_years': years, 'rating': rating, 'reviews_count': reviews,
                    'fee': fee, 'status': status, 'verified': status == 'approved', 'bio': bio,
                    'card_number': f'60370000000000{len(doctors) + 1:02d}',
                    'account_number': f'10000000{len(doctors) + 1:02d}',
                    'shaba': f'IR0605401026800208179{len(doctors) + 1:03d}',
                },
            )
            CommunicationSetting.objects.update_or_create(
                doctor=profile,
                defaults={
                    'chat_enabled': True, 'audio_enabled': True, 'video_enabled': True,
                    'chat_fee': 100000, 'audio_fee': 150000, 'video_fee': fee,
                },
            )
            profile.working_hours.all().delete()
            for day, start, end in hours:
                WorkingHour.objects.create(
                    doctor=profile, day=day, from_time=start, to_time=end, break_minutes=0
                )
            doctors.append(profile)

        patients = []
        for row in PATIENTS:
            phone, first, last, seed, national_id, age, gender, city, diagnoses, allergies, medications, notes = row
            user, _ = User.objects.update_or_create(
                phone=phone,
                defaults={
                    'username': phone, 'role': 'user', 'first_name': first, 'last_name': last,
                    'email': f'{seed}@email.com', 'avatar': avatar(seed), 'is_active': True,
                },
            )
            user.set_unusable_password()
            user.save()
            profile, _ = PatientProfile.objects.update_or_create(
                user=user,
                defaults={
                    'full_name': f'{first} {last}', 'national_id': national_id,
                    'birth_date': date(today.year - age, 1, 1), 'gender': gender, 'city': city,
                },
            )
            MedicalRecord.objects.update_or_create(
                patient=user,
                defaults={
                    'diagnoses': diagnoses, 'allergies': allergies,
                    'medications': medications, 'notes': notes,
                },
            )
            patients.append(profile)

        admin, _ = User.objects.update_or_create(
            phone='09123456788',
            defaults={
                'username': '09123456788', 'role': 'admin', 'first_name': 'مدیر',
                'last_name': 'سیستم', 'is_staff': True, 'is_superuser': True, 'is_active': True,
            },
        )
        admin.set_unusable_password()
        admin.save()

        Appointment.objects.all().delete()
        appointment_rows = (
            (0, 0, 0, '10:30', 'in-progress', 'تپش قلب و تنگی نفس', 'video'),
            (1, 0, 0, '12:00', 'waiting', 'کنترل فشار خون', 'chat'),
            (2, 0, 0, '14:30', 'waiting', 'درد سینه', 'video'),
            (3, 0, 2, '09:00', 'waiting', 'نشانگان فشار خون بالا', 'chat'),
            (4, 0, -5, '11:00', 'completed', 'مشاوره عمومی قلب', 'video'),
            (0, 2, 1, '17:00', 'waiting', 'جوش پوستی', 'video'),
            (1, 7, 3, '15:00', 'waiting', 'اضطراب و بی‌خوابی', 'video'),
            (2, 4, -2, '11:30', 'completed', 'واکسیناسیون کودک', 'video'),
            (3, 1, -1, '10:00', 'cancelled', 'سردرد مزمن', 'video'),
        )
        appointments = []
        for patient_idx, doctor_idx, offset, start, status, reason, consult_type in appointment_rows:
            appointment = Appointment.objects.create(
                patient=patients[patient_idx].user,
                doctor=doctors[doctor_idx],
                date=today + timedelta(days=offset),
                time=start,
                status=status,
                reason=reason,
                consult_type=consult_type,
            )
            appointments.append(appointment)
            if status in ('waiting', 'in-progress', 'completed'):
                Payment.objects.create(
                    appointment=appointment,
                    amount=getattr(doctors[doctor_idx].comm_settings, f'{consult_type}_fee'),
                    status='success',
                    tracking_code=f'DEMO{appointment.pk:06d}',
                    paid_at=timezone.now(),
                )

        for sender, text_value, minute in (
            (doctors[0].user, 'سلام جناب رحیمی، مشکل تپش قلب از چه زمانی شروع شده؟', 31),
            (patients[0].user, 'سلام دکتر. حدود دو هفته است، بیشتر موقع استراحت.', 32),
            (doctors[0].user, 'آیا تنگی نفس همراه با آن دارید؟', 33),
            (patients[0].user, 'بله گاهی تنگی نفس هم دارم.', 34),
        ):
            message = ChatMessage.objects.create(
                appointment=appointments[0], sender=sender, text=text_value, message_type='text'
            )
            ChatMessage.objects.filter(pk=message.pk).update(
                created_at=timezone.make_aware(datetime.combine(today, time(10, minute)))
            )

        prescription = Prescription.objects.create(
            appointment=appointments[4],
            doctor=doctors[0],
            patient=patients[4].user,
            notes='پیگیری فشار خون هفتگی. کاهش مصرف نمک.',
        )
        PrescriptionItem.objects.bulk_create((
            PrescriptionItem(prescription=prescription, drug='آتورواستاتین ۲۰ میلی‌گرم', usage='هر شب بعد از شام'),
            PrescriptionItem(prescription=prescription, drug='آسپرین ۸۰ میلی‌گرم', usage='روزانه بعد از صبحانه'),
        ))

        for key, label, value, setting_type, setting_options in SETTINGS:
            PlatformSetting.objects.update_or_create(
                key=key,
                defaults={
                    'label': label, 'value': value,
                    'setting_type': setting_type, 'options': setting_options,
                },
            )
        for name in DRUGS:
            DrugSuggestion.objects.get_or_create(name=name)
        for item_type, names in {
            'diagnosis': ('فشار خون بالا', 'دیابت نوع ۲', 'چربی خون', 'میگرن مزمن', 'کم‌خونی', 'آسم'),
            'allergy': ('پنی‌سیلین', 'سولفونامید', 'گلوتن', 'گرده گل', 'آسپرین'),
            'drug': DRUGS,
            'city': ('تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز', 'اهواز', 'کرج', 'قم'),
        }.items():
            for name in names:
                Definition.objects.get_or_create(type=item_type, name=name)
        for title, text_value, icon in (
            ('آب بنوشید', 'روزانه ۸ لیوان آب بنوشید تا بدنی سالم داشته باشید', '💧'),
            ('پیاده‌روی', '۳۰ دقیقه پیاده‌روی روزانه به سلامت قلب کمک می‌کند', '🚶'),
            ('تغذیه سالم', 'مصرف نمک را کاهش دهید و میوه و سبزیجات تازه مصرف کنید', '🥗'),
            ('خواب کافی', '۷ تا ۸ ساعت خواب مفید برای بازسازی بدن ضروری است', '😴'),
        ):
            HealthTip.objects.update_or_create(
                title=title, defaults={'text': text_value, 'icon': icon, 'active': True}
            )
        for key, label, body in (
            ('welcome', 'پیام خوش‌آمد کاربر', 'سلام {name}، به اول دکتر خوش آمدید.'),
            ('appointment_confirmation', 'تأیید نوبت', 'نوبت شما با {doctor} در تاریخ {date} ساعت {time} تأیید شد.'),
            ('appointment_reminder', 'یادآوری نوبت', 'نوبت شما تا یک ساعت دیگر آغاز می‌شود.'),
            ('prescription_ready', 'آماده شدن نسخه', 'نسخه شما توسط {doctor} صادر شد.'),
        ):
            SmsTemplate.objects.update_or_create(
                key=key, defaults={'label': label, 'template': body}
            )

        WithdrawalRequest.objects.all().delete()
        for doctor_idx, amount, status, days, note in (
            (0, 5000000, 'approved', -10, 'واریز شد'),
            (1, 3500000, 'pending', -2, ''),
            (4, 7200000, 'pending', -1, ''),
            (7, 4800000, 'rejected', -8, 'اطلاعات بانکی نادرست'),
            (2, 2100000, 'approved', -15, ''),
        ):
            withdrawal = WithdrawalRequest.objects.create(
                doctor=doctors[doctor_idx], amount=amount, status=status,
                bank_info=doctors[doctor_idx].shaba, admin_note=note,
                processed_at=timezone.now() if status != 'pending' else None,
            )
            WithdrawalRequest.objects.filter(pk=withdrawal.pk).update(
                created_at=timezone.now() + timedelta(days=days)
            )

        AuditLog.objects.all().delete()
        for action, actor, target, target_name, details, days in (
            ('create', patients[0].user, 'appointment', 'نوبت جدید', 'نوبت ویزیت ثبت شد', 0),
            ('verify', admin, 'doctor', doctors[0].user.display_name, 'مدارک پزشک تأیید شد', -1),
            ('delete', patients[3].user, 'appointment', 'نوبت لغوشده', 'نوبت توسط بیمار لغو شد', -1),
            ('create', doctors[0].user, 'prescription', 'نسخه پزشکی', 'نسخه صادر شد', -2),
            ('create', patients[4].user, 'user', patients[4].full_name, 'ثبت‌نام کاربر جدید', -3),
            ('approve', admin, 'withdrawal', 'درخواست برداشت', 'درخواست برداشت تأیید شد', -4),
            ('suspend', admin, 'doctor', doctors[6].user.display_name, 'حساب پزشک معلق شد', -5),
        ):
            log = AuditLog.objects.create(
                action=action, actor=actor, actor_name=actor.display_name,
                target=target, target_name=target_name, details=details,
            )
            AuditLog.objects.filter(pk=log.pk).update(
                timestamp=timezone.now() + timedelta(days=days)
            )

        self.stdout.write(self.style.SUCCESS(
            f'AvalDr demo data ready: {len(doctors)} doctors, '
            f'{len(patients)} patients, {len(appointments)} appointments.'
        ))

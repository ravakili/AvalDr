"""Seed the AvalDr database with rich sample data.

Idempotent: re-running refreshes sample appointments/payments/chat/support
data but never deletes users, doctors or profiles.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import random
from datetime import timedelta

from django.utils import timezone

from accounts.models import PatientProfile, User
from admin_panel.models import Specialty
from appointments.models import Appointment
from chat.models import ChatMessage, SupportMessage, SupportThread
from doctors.models import CommunicationSetting, DoctorProfile, WorkingHour
from medical.models import MedicalRecord
from notifications.models import Notification, NotificationPreference
from payments.models import Payment

random.seed(42)

DOCTOR_USERS = (5, 6, 7, 8, 9, 10, 11, 12)
PATIENT_USERS = (4, 13, 14, 15, 16)

DOCTOR_DETAILS = {
    5: {"specialty": 1, "city": "تهران", "hospital": "بیمارستان قلب تهران", "experience": 15, "fee": 450000, "bio": "فوق تخصص قلب و عروق، ۲۰ سال سابقه درمان و جراحی قلب.", "status": "approved", "rating": 4.8, "reviews": 34},
    6: {"specialty": 2, "city": "اصفهان", "hospital": "کلینیک پوست و مو", "experience": 8, "fee": 300000, "bio": "متخصص پوست و مو با تمرکز بر درمان‌های لیزری و زیبایی.", "status": "approved", "rating": 4.5, "reviews": 22},
    7: {"specialty": 3, "city": "تهران", "hospital": "بیمارستان امام خمینی", "experience": 12, "fee": 350000, "bio": "متخصص مغز و اعصاب، درمان سردردهای مزمن و میگرن.", "status": "approved", "rating": 4.3, "reviews": 19},
    8: {"specialty": 4, "city": "مشهد", "hospital": "مرکز تخصصی ارتوپدی", "experience": 10, "fee": 280000, "bio": "متخصص ارتوپدی و آسیب‌های ورزشی.", "status": "approved", "rating": 4.6, "reviews": 27},
    9: {"specialty": 5, "city": "شیراز", "hospital": "بیمارستان کودکان", "experience": 7, "fee": 220000, "bio": "متخصص اطفال، مراقبت از نوزادان و کودکان.", "status": "approved", "rating": 4.9, "reviews": 41},
    10: {"specialty": 6, "city": "تهران", "hospital": "کلینیک گوش و حلق و بینی", "experience": 6, "fee": 250000, "bio": "متخصص گوش، حلق و بینی.", "status": "approved", "rating": 4.2, "reviews": 15},
    11: {"specialty": 7, "city": "تبریز", "hospital": "بیمارستان چشم", "experience": 9, "fee": 320000, "bio": "جراح چشم و متخصص بیماری‌های چشم.", "status": "pending", "rating": 0, "reviews": 0},
    12: {"specialty": 8, "city": "تهران", "hospital": "مطب خصوصی", "experience": 5, "fee": 400000, "bio": "روان‌پزشک و درمانگر اختلالات روانی.", "status": "approved", "rating": 4.4, "reviews": 18},
}

PATIENT_DETAILS = {
    4: {"national_id": "0012345678", "city": "تهران", "insurance": "بیمه پایه", "supp": "ایرانیان"},
    13: {"national_id": "0012987654", "city": "اصفهان", "insurance": "بیمه پایه", "supp": "سامان"},
    14: {"national_id": "0012112233", "city": "مشهد", "insurance": "بیمه تکمیلی", "supp": "دانش"},
    15: {"national_id": "0012445566", "city": "شیراز", "insurance": "بیمه پایه", "supp": ""},
    16: {"national_id": "0012778899", "city": "تبریز", "insurance": "بیمه تکمیلی", "supp": "آتیه"},
}

APPOINTMENT_REASONS = [
    "درد قفسه سینه و تپش قلب",
    "بررسی نتایج آزمایش خون",
    "سردردهای مکرر و میگرن",
    "درد زانو پس از ورزش",
    "درد شکم و گوارش",
    "تب و علائم سرماخوردگی",
    "معاینه دوره‌ای سلامت",
    "مشکلات خواب و استرس",
    "چک‌آپ سالانه",
    "حساسیت فصلی",
]

CHAT_SAMPLES = [
    "سلام دکتر، نتیجه آزمایشم را فرستادم.",
    "درود، آزمایش‌ها را بررسی کردم؛ مشکلی نیست.",
    "آیا می‌توانم دارو را با غذا مصرف کنم؟",
    "بله، بهتر است بعد از غذا مصرف کنید.",
    "ممنون از راهنمایی‌تان.",
    "فشار خونم کمی بالا رفته، نگرانم.",
    "استراحت کافی داشته باشید و نمک را کم کنید.",
    "برای نوبت بعدی کی مراجعه کنم؟",
    "دو هفته دیگر نوبت بگیرید و آزمایش را تکرار کنید.",
    "تشکر، مراقب خودتان باشید.",
]


def now():
    return timezone.now()


def ensure_doctor_profiles():
    created = 0
    for pk in DOCTOR_USERS:
        user = User.objects.get(pk=pk)
        if hasattr(user, "doctor_profile"):
            continue
        d = DOCTOR_DETAILS[pk]
        profile = DoctorProfile.objects.create(
            user=user,
            prefix="دکتر",
            specialty_id=d["specialty"],
            city=d["city"],
            hospital=d["hospital"],
            address=f"خیابان {d['city']}، کوچه سلامت، پلاک {random.randint(1, 60)}",
            experience_years=d["experience"],
            rating=d["rating"],
            reviews_count=d["reviews"],
            fee=d["fee"],
            bio=d["bio"],
            status=d["status"],
            verified=d["status"] == "approved",
        )
        CommunicationSetting.objects.get_or_create(
            doctor=profile,
            defaults={
                "chat_enabled": True,
                "audio_enabled": True,
                "video_enabled": True,
                "chat_fee": 50000,
                "audio_fee": d["fee"] // 2,
                "video_fee": d["fee"],
                "chat_auto_close_minutes": 30,
            },
        )
        for day in ("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"):
            WorkingHour.objects.get_or_create(
                doctor=profile,
                day=day,
                from_time="09:00",
                to_time="13:00",
                defaults={"break_minutes": 30, "appointment_duration_minutes": 30},
            )
        created += 1
    return created


def ensure_patient_details():
    updated = 0
    for pk, d in PATIENT_DETAILS.items():
        user = User.objects.get(pk=pk)
        if not hasattr(user, "patient_profile"):
            continue
        profile = user.patient_profile
        changed = False
        if not profile.national_id:
            profile.national_id = d["national_id"]
            changed = True
        if not profile.city:
            profile.city = d["city"]
            changed = True
        if not profile.insurance_type:
            profile.insurance_type = d["insurance"]
            changed = True
        if not profile.supplementary_insurance:
            profile.supplementary_insurance = d["supp"]
            changed = True
        if changed:
            profile.save()
            updated += 1
        MedicalRecord.objects.get_or_create(patient=user)
    return updated


def refresh_appointments():
    """Delete sample appointments & recreate a realistic spread."""
    Appointment.objects.filter(
        patient_id__in=PATIENT_USERS, doctor__user_id__in=DOCTOR_USERS
    ).delete()

    doctors = list(DoctorProfile.objects.filter(user_id__in=DOCTOR_USERS))
    patients = list(User.objects.filter(pk__in=PATIENT_USERS))
    today = timezone.localdate()
    created = 0

    for i in range(40):
        doctor = random.choice(doctors)
        patient = random.choice(patients)
        days_offset = random.choice([-45, -30, -20, -14, -7, -3, -1, 0, 1, 2, 3, 7])
        date = today + timedelta(days=days_offset)
        time = random.choice(["09:00", "09:30", "10:30", "11:00", "12:30", "14:00", "16:30", "18:00"])
        consult_type = random.choice(["chat", "audio", "video"])
        status = random.choice(["completed", "completed", "completed", "waiting", "waiting", "in-progress", "in-progress", "pending-payment", "cancelled"])

        appt = Appointment(
            patient=patient,
            doctor=doctor,
            date=date,
            time=time,
            consult_type=consult_type,
            reason=random.choice(APPOINTMENT_REASONS),
            status=status,
            is_follow_up=random.random() < 0.25,
        )
        if status in ("completed", "in-progress", "cancelled"):
            appt.started_at = now() - timedelta(
                days=random.randint(0, 5), hours=random.randint(1, 6)
            )
        appt.save()
        created += 1
    return created


def seed_payments_and_chat():
    payments = 0
    chats = 0
    for appt in Appointment.objects.filter(patient_id__in=PATIENT_USERS, doctor__user_id__in=DOCTOR_USERS):
        status = appt.status
        if status == "completed":
            Payment.objects.get_or_create(
                appointment=appt,
                defaults={
                    "amount": appt.doctor.fee,
                    "status": random.choice(["success", "success", "refunded"]),
                    "card_number": "6219861000000000",
                    "tracking_code": str(random.randint(100000000, 999999999)),
                    "authority": "A" + str(random.randint(100000000000000000, 999999999999999999)),
                    "ref_id": str(random.randint(100000000, 999999999)),
                    "paid_at": appt.started_at or now(),
                },
            )
            payments += 1
        elif status == "in-progress":
            Payment.objects.get_or_create(
                appointment=appt,
                defaults={
                    "amount": appt.doctor.fee,
                    "status": "success",
                    "card_number": "6219861000000000",
                    "authority": "A" + str(random.randint(100000000000000000, 999999999999999999)),
                    "paid_at": now(),
                },
            )
            payments += 1
        elif status == "pending-payment":
            Payment.objects.get_or_create(
                appointment=appt,
                defaults={"amount": appt.doctor.fee, "status": "pending"},
            )

        if status in ("in-progress", "completed"):
            n = random.randint(3, 8)
            doctor_user = appt.doctor.user
            for j in range(n):
                sender = doctor_user if j % 2 == 0 else appt.patient
                ChatMessage.objects.create(
                    appointment=appt,
                    sender=sender,
                    text=random.choice(CHAT_SAMPLES),
                    message_type="text",
                )
                chats += 1
    return payments, chats


def seed_support_threads():
    SupportThread.objects.all().delete()
    admins = list(User.objects.filter(role="admin"))
    admin = admins[0] if admins else None
    created = 0
    for pk in PATIENT_USERS:
        patient = User.objects.get(pk=pk)
        thread = SupportThread.objects.create(participant=patient)
        SupportMessage.objects.create(
            thread=thread,
            sender=patient,
            text=f"سلام، من {patient.display_name} هستم. برای پرداخت نوبت به راهنمایی نیاز دارم.",
        )
        if admin:
            SupportMessage.objects.create(
                thread=thread,
                sender=admin,
                text=f"سلام {patient.display_name} عزیز، در خدمت شما هستم. لطفاً شماره نوبت را بفرمایید.",
            )
        created += 1
    return created


def seed_notifications():
    created = 0
    for user in User.objects.filter(role__in=("user", "doctor")).filter(pk__in=(*PATIENT_USERS, *DOCTOR_USERS)):
        Notification.objects.get_or_create(
            user=user,
            title="خوش آمدید 👋",
            defaults={"body": "به اول‌دکتر خوش آمدید. از پروفایل خود دیدن کنید.", "type": "system"},
        )
        created += 1
    # prefs
    for pk in PATIENT_USERS:
        user = User.objects.get(pk=pk)
        for key, label in (
            ("appointment_reminder", "یادآوری نوبت"),
            ("new_message", "پیام جدید"),
            ("prescription_ready", "نسخه آماده"),
            ("weekly_report", "گزارش هفتگی سلامت"),
        ):
            NotificationPreference.objects.get_or_create(
                patient=user, key=key, defaults={"label": label, "enabled": True}
            )
    return created


def main():
    print("=== پرشدن دیتابیس با داده‌های سمپل ===")
    n = ensure_doctor_profiles()
    print(f"پروفایل پزشک ایجاد شد: {n}  (کل: {DoctorProfile.objects.count()})")
    n = ensure_patient_details()
    print(f"پروفایل بیمار تکمیل شد: {n}  (کل: {PatientProfile.objects.count()})")
    n = refresh_appointments()
    print(f"نوبت‌ها: {Appointment.objects.count()}")
    p, c = seed_payments_and_chat()
    print(f"پرداخت‌ها: {Payment.objects.count()}  |  پیام‌های چت: {ChatMessage.objects.count()}")
    n = seed_support_threads()
    print(f"رشته‌های پشتیبانی: {SupportThread.objects.count()}  |  پیام‌های پشتیبانی: {SupportMessage.objects.count()}")
    n = seed_notifications()
    print(f"اعلان‌ها: {Notification.objects.count()}  |  تنظیمات اعلان: {NotificationPreference.objects.count()}")
    print(f"ساعات کاری: {WorkingHour.objects.count()}  |  تنظیمات ارتباطی: {CommunicationSetting.objects.count()}")
    print("=== پایان پرشدن داده‌ها ===")


if __name__ == "__main__":
    main()

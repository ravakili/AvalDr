from datetime import date, timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient

from accounts.models import PatientProfile
from admin_panel.models import Specialty
from appointments.models import Appointment
from doctors.models import CommunicationSetting, DoctorProfile, WorkingHour
from notifications.models import Notification
from payments.models import Payment

User = get_user_model()


@pytest.fixture
def specialty(db):
    return Specialty.objects.create(name='قلب و عروق', icon='🫀')


@pytest.fixture
def patient(db):
    user = User.objects.create_user(
        username='09330001111',
        phone='09330001111',
        role='user',
        first_name='محمد',
        last_name='رحیمی',
    )
    PatientProfile.objects.create(
        user=user,
        full_name='محمد رحیمی',
        national_id='0012345678',
        city='تهران',
        gender='male',
    )
    return user


@pytest.fixture
def doctor(db, specialty):
    user = User.objects.create_user(
        username='09121110001',
        phone='09121110001',
        role='doctor',
        first_name='سارا',
        last_name='محمدی',
    )
    profile = DoctorProfile.objects.create(
        user=user,
        specialty=specialty,
        city='تهران',
        hospital='بیمارستان دی',
        experience_years=12,
        rating=4.9,
        reviews_count=318,
        fee=250000,
        status='approved',
        verified=True,
    )
    CommunicationSetting.objects.create(doctor=profile)
    return profile


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='09123456788',
        phone='09123456788',
        role='admin',
        is_staff=True,
        first_name='مدیر',
        last_name='سیستم',
    )


def authenticated_client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.mark.django_db
def test_otp_and_patient_profile_completion(settings, specialty):
    settings.DEBUG = True
    settings.RETURN_OTP_IN_DEBUG = True
    cache.clear()
    client = APIClient()

    sent = client.post('/api/v1/auth/send-otp/', {'phone': '09350000001'}, format='json')
    assert sent.status_code == 200
    assert len(sent.data['debugCode']) == 6

    verified = client.post(
        '/api/v1/auth/verify-otp/',
        {'phone': '09350000001', 'code': sent.data['debugCode']},
        format='json',
    )
    assert verified.status_code == 200
    assert verified.data['isNewUser'] is True
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {verified.data['access']}")

    completed = client.post(
        '/api/v1/auth/complete-profile/',
        {
            'name': 'کاربر تازه',
            'email': 'new@example.com',
            'dateOfBirth': '1995-01-10',
            'gender': 'female',
            'bloodType': 'A+',
            'allergies': ['پنی‌سیلین'],
            'chronicConditions': ['فشار خون'],
            'emergencyContact': {'name': 'تماس ضروری', 'phone': '09120000000'},
            'isDoctor': False,
            'acceptTerms': True,
            'acceptPrivacy': True,
        },
        format='json',
    )
    assert completed.status_code == 200
    assert completed.data['role'] == 'user'
    assert completed.data['name'] == 'کاربر تازه'
    assert User.objects.get(phone='09350000001').patient_profile.blood_type == 'A+'


@pytest.mark.django_db
def test_public_doctor_contract_and_available_slots(doctor):
    target = date.today() + timedelta(days=(5 - date.today().weekday()) % 7 or 7)
    WorkingHour.objects.create(
        doctor=doctor, day='شنبه', from_time='09:00', to_time='11:00', break_minutes=0
    )
    client = APIClient()

    response = client.get('/api/v1/doctors/')
    assert response.status_code == 200
    assert response.data[0]['name'] == 'سارا محمدی'
    assert response.data[0]['specialtyId'] == str(doctor.specialty_id)
    assert response.data[0]['workingHours'][0]['from'] == '09:00'

    slots = client.get(f'/api/v1/doctors/{doctor.pk}/slots/?date={target.isoformat()}')
    assert slots.status_code == 200
    assert slots.data['slots'][0] == {'time': '09:00', 'available': True}


@pytest.mark.django_db
def test_booking_payment_consultation_chat_and_prescription(settings, patient, doctor):
    settings.ZARINPAL_MOCK = True
    target = date.today() + timedelta(days=1)
    patient_client = authenticated_client(patient)
    doctor_client = authenticated_client(doctor.user)

    booked = patient_client.post(
        '/api/v1/appointments/',
        {
            'doctorId': doctor.pk,
            'date': target.isoformat(),
            'time': '10:30',
            'reason': 'تپش قلب',
            'consultType': 'video',
        },
        format='json',
    )
    assert booked.status_code == 201
    assert booked.data['status'] == 'pending-payment'
    appointment_id = booked.data['id']

    payment = patient_client.post(f'/api/v1/appointments/{appointment_id}/payment/', {}, format='json')
    assert payment.status_code == 201
    assert payment.data['amount'] == 250000

    paid = patient_client.post(
        f"/api/v1/payments/{payment.data['id']}/verify/",
        {'authority': payment.data['authority'], 'status': 'OK'},
        format='json',
    )
    assert paid.status_code == 200
    assert Appointment.objects.get(pk=appointment_id).status == 'waiting'

    started = doctor_client.post(f'/api/v1/appointments/{appointment_id}/start/')
    assert started.status_code == 200
    assert started.data['status'] == 'in-progress'

    message = patient_client.post(
        f'/api/v1/chat/appointments/{appointment_id}/messages/',
        {'text': 'سلام دکتر', 'type': 'text'},
        format='json',
    )
    assert message.status_code == 201
    assert message.data['senderId'] == str(patient.pk)
    assert Notification.objects.filter(
        user=doctor.user,
        type='message',
        data__appointmentId=str(appointment_id),
    ).exists()

    prescription = doctor_client.post(
        '/api/v1/prescriptions/',
        {
            'appointmentId': appointment_id,
            'items': [{'drug': 'آسپرین ۸۰', 'usage': 'روزانه یک عدد'}],
            'notes': 'پیگیری فشار خون',
        },
        format='json',
    )
    assert prescription.status_code == 201
    assert prescription.data['items'][0]['drug'] == 'آسپرین ۸۰'

    completed = doctor_client.post(f'/api/v1/appointments/{appointment_id}/complete/')
    assert completed.status_code == 200
    assert completed.data['status'] == 'completed'


@pytest.mark.django_db
def test_admin_endpoints_require_admin(patient, doctor, admin_user):
    denied = authenticated_client(patient).get('/api/v1/admin/dashboard/')
    assert denied.status_code == 403

    client = authenticated_client(admin_user)
    dashboard = client.get('/api/v1/admin/dashboard/')
    assert dashboard.status_code == 200
    assert dashboard.data['totalUsers'] == 1
    assert dashboard.data['totalDoctors'] == 1

    suspended = client.post(
        f'/api/v1/admin/doctors/{doctor.pk}/status/',
        {'status': 'suspended'},
        format='json',
    )
    assert suspended.status_code == 200
    doctor.refresh_from_db()
    assert doctor.status == 'suspended'
    assert doctor.user.is_active is False


@pytest.mark.django_db
def test_paid_appointment_cancel_is_refunded_and_notifies_users(settings, patient, doctor):
    settings.ZARINPAL_MOCK = True
    patient_client = authenticated_client(patient)
    target = date.today() + timedelta(days=2)
    booked = patient_client.post(
        '/api/v1/appointments/',
        {
            'doctorId': doctor.pk,
            'date': target.isoformat(),
            'time': '12:00',
            'reason': 'پیگیری',
            'consultType': 'chat',
        },
        format='json',
    )
    payment_response = patient_client.post(
        f"/api/v1/appointments/{booked.data['id']}/payment/",
        {},
        format='json',
    )
    patient_client.post(
        f"/api/v1/payments/{payment_response.data['id']}/verify/",
        {'authority': payment_response.data['authority'], 'status': 'OK'},
        format='json',
    )

    cancelled = patient_client.post(f"/api/v1/appointments/{booked.data['id']}/cancel/")

    assert cancelled.status_code == 200
    assert cancelled.data['status'] == 'cancelled'
    assert cancelled.data['refundStatus'] == 'refunded'
    payment = Payment.objects.get(pk=payment_response.data['id'])
    assert payment.status == 'refunded'
    assert payment.refund_amount == payment.amount
    assert Notification.objects.filter(
        user=patient,
        data__appointmentId=str(booked.data['id']),
    ).exists()

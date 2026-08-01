import csv
import io

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import PatientProfile, User
from accounts.serializers import PatientProfileSerializer, UserSerializer
from appointments.models import Appointment
from config.permissions import IsPlatformAdmin
from config.serializers import EmptySerializer
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from doctors.models import DoctorProfile
from doctors.serializers import DoctorSerializer
from medical.models import MedicalRecord
from medical.serializers import MedicalRecordSerializer
from payments.models import Payment
from notifications.services import notify

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
from .serializers import (
    AuditLogSerializer,
    DefinitionSerializer,
    DrugSuggestionSerializer,
    HealthTipSerializer,
    PlatformSettingSerializer,
    SmsTemplateSerializer,
    SpecialtySerializer,
    WithdrawalSerializer,
)


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = (IsPlatformAdmin,)
    pagination_class = None


class SpecialtyViewSet(AdminModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer


class DefinitionViewSet(AdminModelViewSet):
    serializer_class = DefinitionSerializer

    def get_queryset(self):
        queryset = Definition.objects.all()
        item_type = self.request.query_params.get('type')
        return queryset.filter(type=item_type) if item_type else queryset


class HealthTipViewSet(AdminModelViewSet):
    queryset = HealthTip.objects.all()
    serializer_class = HealthTipSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('actor')
    serializer_class = AuditLogSerializer
    permission_classes = (IsPlatformAdmin,)


class WithdrawalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WithdrawalRequest.objects.select_related('doctor__user')
    serializer_class = WithdrawalSerializer
    permission_classes = (IsPlatformAdmin,)

    @action(detail=True, methods=('post',))
    def decide(self, request, pk=None):
        withdrawal = self.get_object()
        decision = request.data.get('status')
        if decision not in ('approved', 'rejected'):
            return Response({'detail': 'وضعیت باید approved یا rejected باشد.'}, status=400)
        if withdrawal.status != 'pending':
            return Response({'detail': 'این درخواست قبلاً بررسی شده است.'}, status=409)
        withdrawal.status = decision
        withdrawal.admin_note = request.data.get('adminNote', '')
        withdrawal.processed_at = timezone.now()
        withdrawal.save()
        self._audit(
            request, f'withdrawal.{decision}', 'withdrawal', str(withdrawal.pk),
            f'{withdrawal.amount} تومان',
        )
        notify(
            withdrawal.doctor.user,
            'نتیجه درخواست برداشت',
            'درخواست برداشت شما تأیید شد.' if decision == 'approved' else 'درخواست برداشت شما رد شد.',
            'withdrawal',
            {'withdrawalId': str(withdrawal.pk), 'status': decision},
        )
        return Response(self.get_serializer(withdrawal).data)

    def _audit(self, request, action, target, target_name, details):
        AuditLog.objects.create(
            action='approve' if action.endswith('approved') else 'reject',
            actor=request.user,
            actor_name=request.user.display_name,
            target=target,
            target_name=target_name,
            details=details,
        )


class PlatformSettingViewSet(AdminModelViewSet):
    queryset = PlatformSetting.objects.all()
    serializer_class = PlatformSettingSerializer
    lookup_field = 'key'


class SmsTemplateViewSet(AdminModelViewSet):
    queryset = SmsTemplate.objects.all()
    serializer_class = SmsTemplateSerializer
    lookup_field = 'key'


class DrugSuggestionViewSet(AdminModelViewSet):
    queryset = DrugSuggestion.objects.all()
    serializer_class = DrugSuggestionSerializer


class UserManageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsPlatformAdmin,)
    pagination_class = None
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(role='user').select_related('patient_profile')
        query = self.request.query_params.get('q')
        if query:
            queryset = queryset.filter(phone__icontains=query)
        return queryset

    def list(self, request):
        data = []
        for user in self.get_queryset():
            profile, _ = PatientProfile.objects.get_or_create(
                user=user, defaults={'full_name': user.display_name}
            )
            patient_data = PatientProfileSerializer(profile).data
            record, _ = MedicalRecord.objects.get_or_create(patient=user)
            patient_data['medicalHistory'] = MedicalRecordSerializer(record).data
            data.append(patient_data)
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        profile, _ = PatientProfile.objects.get_or_create(
            user=user, defaults={'full_name': user.display_name}
        )
        data = PatientProfileSerializer(profile).data
        record, _ = MedicalRecord.objects.get_or_create(patient=user)
        data['medicalHistory'] = MedicalRecordSerializer(record).data
        return Response(data)

    @action(detail=True, methods=('post',))
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.patient_profile.suspended = True
        user.patient_profile.save(update_fields=('suspended',))
        user.save(update_fields=('is_active',))
        notify(
            user,
            'حساب کاربری تعلیق شد',
            'حساب شما توسط مدیر سیستم تعلیق شده است.',
            'account',
            {'status': 'suspended'},
        )
        return Response({'status': 'suspended'})

    @action(detail=True, methods=('post',))
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.patient_profile.suspended = False
        user.patient_profile.save(update_fields=('suspended',))
        user.save(update_fields=('is_active',))
        notify(
            user,
            'حساب کاربری فعال شد',
            'حساب شما دوباره فعال شده است.',
            'account',
            {'status': 'active'},
        )
        return Response({'status': 'active'})


class DoctorManageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = (IsPlatformAdmin,)
    pagination_class = None

    def get_queryset(self):
        queryset = DoctorProfile.objects.select_related('user', 'specialty').prefetch_related(
            'working_hours'
        )
        status_filter = self.request.query_params.get('status')
        return queryset.filter(status=status_filter) if status_filter else queryset

    @action(detail=True, methods=('post',))
    def status(self, request, pk=None):
        doctor = self.get_object()
        next_status = request.data.get('status')
        if next_status not in ('approved', 'pending', 'suspended'):
            return Response({'detail': 'وضعیت پزشک نامعتبر است.'}, status=400)
        doctor.status = next_status
        doctor.verified = next_status == 'approved'
        doctor.user.is_active = next_status != 'suspended'
        doctor.user.save(update_fields=('is_active',))
        doctor.save(update_fields=('status', 'verified'))
        AuditLog.objects.create(
            action='approve' if next_status == 'approved' else 'suspend',
            actor=request.user,
            actor_name=request.user.display_name,
            target='doctor',
            target_name=doctor.user.display_name,
            details=f'Doctor status changed to {next_status}',
        )
        notify(
            doctor.user,
            'وضعیت حساب پزشک تغییر کرد',
            {
                'approved': 'حساب پزشک شما تأیید شد.',
                'pending': 'حساب پزشک شما در انتظار بررسی قرار گرفت.',
                'suspended': 'حساب پزشک شما تعلیق شد.',
            }[next_status],
            'account',
            {'doctorId': str(doctor.pk), 'status': next_status},
        )
        return Response(self.get_serializer(doctor).data)


class AdminMeViewSet(viewsets.GenericViewSet):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = EmptySerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def _save_avatar(self, user, avatar, request=None):
        if hasattr(avatar, 'read'):
            import uuid
            from django.conf import settings
            from django.core.files.storage import default_storage
            ext = avatar.name.rsplit('.', 1)[-1] if '.' in avatar.name else 'jpg'
            path = default_storage.save(f'avatars/{uuid.uuid4().hex}.{ext}', avatar)
            url = settings.MEDIA_URL + path
            user.avatar = request.build_absolute_uri(url) if request else url
            user.save(update_fields=['avatar'])

    def list(self, request):
        return Response({
            'name': request.user.display_name,
            'phone': request.user.phone,
            'avatar': request.user.avatar,
        })

    def partial_update(self, request):
        user = request.user
        avatar_file = request.FILES.get('avatar')
        name = request.data.get('name')
        if name:
            parts = name.strip().split(maxsplit=1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
        if avatar_file:
            self._save_avatar(user, avatar_file, request)
        user.save()
        return Response({
            'name': user.display_name,
            'phone': user.phone,
            'avatar': user.avatar,
        })


class AdminDashboardView(viewsets.GenericViewSet):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = EmptySerializer

    def list(self, request):
        successful_payments = Payment.objects.filter(status='success')
        return Response({
            'totalUsers': User.objects.filter(role='user').count(),
            'totalDoctors': DoctorProfile.objects.count(),
            'approvedDoctors': DoctorProfile.objects.filter(status='approved').count(),
            'pendingDoctors': DoctorProfile.objects.filter(status='pending').count(),
            'totalAppointments': Appointment.objects.count(),
            'completedAppointments': Appointment.objects.filter(status='completed').count(),
            'pendingWithdrawals': WithdrawalRequest.objects.filter(status='pending').count(),
            'revenue': sum(successful_payments.values_list('amount', flat=True)),
        })


class UserExportView(viewsets.GenericViewSet):
    permission_classes = (IsPlatformAdmin,)
    serializer_class = EmptySerializer

    def list(self, request):
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(('id', 'name', 'phone', 'role', 'active'))
        for user in User.objects.all():
            writer.writerow((user.pk, user.display_name, user.phone, user.role, user.is_active))
        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="avaldr-users.csv"'
        return response

from datetime import date, datetime, timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from admin_panel.models import Specialty, WithdrawalRequest
from admin_panel.serializers import SpecialtySerializer, WithdrawalSerializer
from appointments.models import Appointment
from appointments.services import expire_stale_pending_payments
from config.permissions import IsDoctor

from .models import CommunicationSetting, DoctorDocument, DoctorProfile, WorkingHour
from .serializers import (
    CommunicationSettingSerializer,
    DoctorDocumentSerializer,
    DoctorProfileUpdateSerializer,
    DoctorSerializer,
    PublicDoctorSerializer,
    WorkingHourSerializer,
)


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicDoctorSerializer
    permission_classes = (AllowAny,)
    pagination_class = None

    def get_queryset(self):
        queryset = DoctorProfile.objects.select_related('user', 'specialty').prefetch_related(
            'working_hours'
        )
        if self.action in ('list', 'retrieve'):
            queryset = queryset.filter(status='approved')
        specialty = self.request.query_params.get('specialtyId')
        city = self.request.query_params.get('city')
        search = self.request.query_params.get('q')
        if specialty:
            queryset = queryset.filter(specialty_id=specialty)
        if city:
            queryset = queryset.filter(city=city)
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(specialty__name__icontains=search)
            )
        return queryset

    @action(detail=True, methods=('get',), url_path='slots')
    def slots(self, request, pk=None):
        expire_stale_pending_payments()
        doctor = self.get_object()
        try:
            target = date.fromisoformat(request.query_params.get('date', str(date.today())))
        except ValueError:
            return Response({'detail': 'فرمت تاریخ باید YYYY-MM-DD باشد.'}, status=400)
        if target < date.today():
            return Response({'detail': 'تاریخ نمی‌تواند در گذشته باشد.'}, status=400)

        day_names = {
            0: 'دوشنبه',
            1: 'سه‌شنبه',
            2: 'چهارشنبه',
            3: 'پنجشنبه',
            4: 'جمعه',
            5: 'شنبه',
            6: 'یکشنبه',
        }
        working_hours = doctor.working_hours.filter(day=day_names[target.weekday()])
        occupied = set(
            Appointment.objects.filter(
                doctor=doctor,
                date=target,
                status__in=('pending-payment', 'pending-approval', 'waiting', 'in-progress'),
            ).values_list('time', flat=True)
        )
        now = datetime.now()
        slots = []
        for working_hour in working_hours:
            current = datetime.combine(target, working_hour.from_time)
            end = datetime.combine(target, working_hour.to_time)
            while current + timedelta(minutes=30) <= end:
                current_time = current.time()
                past_slot = target == date.today() and current <= now
                slots.append({
                    'time': current_time.strftime('%H:%M'),
                    'available': current_time not in occupied and not past_slot,
                })
                current += timedelta(minutes=30 + working_hour.break_minutes)
        return Response({'date': target.isoformat(), 'slots': slots})


class DoctorMeViewSet(viewsets.GenericViewSet):
    permission_classes = (IsDoctor,)
    serializer_class = DoctorSerializer
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

    def _profile(self, request):
        return get_object_or_404(
            DoctorProfile.objects.select_related('user', 'specialty'),
            user=request.user,
        )

    def list(self, request):
        return Response(DoctorSerializer(self._profile(request)).data)

    def partial_update(self, request):
        profile = self._profile(request)
        avatar_file = request.FILES.get('avatar')
        if avatar_file or request.FILES:
            data = {k: request.data[k] for k in request.data if k not in request.FILES}
        else:
            data = request.data
        serializer = DoctorProfileUpdateSerializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if avatar_file:
            self._save_avatar(profile.user, avatar_file, request)
        return Response(DoctorSerializer(profile).data)

    @action(detail=False, methods=('get', 'put'), url_path='communication')
    def communication(self, request):
        profile = self._profile(request)
        settings_obj, _ = CommunicationSetting.objects.get_or_create(doctor=profile)
        if request.method == 'PUT':
            serializer = CommunicationSettingSerializer(
                settings_obj, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(CommunicationSettingSerializer(settings_obj).data)

    @action(detail=False, methods=('get', 'post', 'put'), url_path='working-hours')
    def working_hours(self, request):
        profile = self._profile(request)
        if request.method == 'POST':
            serializer = WorkingHourSerializer(data=request.data, context={'doctor': profile})
            serializer.is_valid(raise_exception=True)
            working_hour = serializer.save(doctor=profile)
            return Response(WorkingHourSerializer(working_hour).data, status=201)
        if request.method == 'PUT':
            profile.working_hours.all().delete()
            serializer = WorkingHourSerializer(data=request.data, many=True, context={'doctor': profile})
            serializer.is_valid(raise_exception=True)
            serializer.save(doctor=profile)
            return Response(WorkingHourSerializer(profile.working_hours.all(), many=True).data)
        return Response(WorkingHourSerializer(profile.working_hours.all(), many=True).data)

    @action(
        detail=False,
        methods=('patch', 'delete'),
        url_path=r'working-hours/(?P<hour_id>\d+)',
    )
    def working_hour_detail(self, request, hour_id=None):
        profile = self._profile(request)
        working_hour = get_object_or_404(profile.working_hours, pk=hour_id)
        if request.method == 'DELETE':
            working_hour.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = WorkingHourSerializer(
            working_hour, data=request.data, partial=True, context={'doctor': profile}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=('get', 'post'), url_path='documents')
    def documents(self, request):
        profile = self._profile(request)
        if request.method == 'POST':
            serializer = DoctorDocumentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            document = serializer.save(doctor=profile)
            return Response(DoctorDocumentSerializer(document).data, status=201)
        return Response(DoctorDocumentSerializer(profile.documents.all(), many=True).data)

    @action(detail=False, methods=('get',), url_path='earnings')
    def earnings(self, request):
        profile = self._profile(request)
        completed = profile.appointments.filter(
            status='completed', payment_record__status='success'
        )
        total = sum(a.payment_record.amount for a in completed)
        withdrawn = sum(
            profile.withdrawals.filter(status='approved').values_list('amount', flat=True)
        )
        return Response({
            'thisMonth': total,
            'lastMonth': 0,
            'pending': max(total - withdrawn, 0),
            'withdrawn': withdrawn,
            'weekly': [],
        })

    @action(detail=False, methods=('get', 'post'), url_path='withdrawals')
    def withdrawals(self, request):
        profile = self._profile(request)
        if request.method == 'POST':
            amount = int(request.data.get('amount', 0))
            if amount <= 0:
                return Response({'detail': 'مبلغ باید بیشتر از صفر باشد.'}, status=400)
            withdrawal = WithdrawalRequest.objects.create(
                doctor=profile,
                amount=amount,
                bank_info=request.data.get('bankInfo') or profile.shaba,
            )
            return Response(WithdrawalSerializer(withdrawal).data, status=201)
        return Response(WithdrawalSerializer(profile.withdrawals.all(), many=True).data)


class SpecialtyListView(viewsets.GenericViewSet):
    permission_classes = (AllowAny,)
    serializer_class = SpecialtySerializer

    def list(self, request):
        return Response(SpecialtySerializer(Specialty.objects.all(), many=True).data)

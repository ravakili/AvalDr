import random
import string

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from config.permissions import IsPatient

from .models import PatientProfile
from .serializers import (
    CompleteProfileSerializer,
    PatientProfileSerializer,
    SendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)

User = get_user_model()


def token_payload(user, is_new_user=False):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
        'isNewUser': is_new_user,
    }


class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = (AllowAny,)
    serializer_class = SendOTPSerializer

    def create(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        resend_key = f'otp_resends:{phone}'
        resend_count = cache.get(resend_key, 0)
        if resend_count >= settings.OTP_MAX_RESENDS:
            return Response(
                {'detail': 'تعداد درخواست‌های مجاز به پایان رسیده است.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        code = ''.join(random.choices(string.digits, k=6))
        cache.set(f'otp:{phone}', code, settings.OTP_TTL_SECONDS)
        cache.set(resend_key, resend_count + 1, settings.OTP_TTL_SECONDS)
        payload = {'message': 'کد تأیید ارسال شد.', 'expiresIn': settings.OTP_TTL_SECONDS}
        if settings.DEBUG and settings.RETURN_OTP_IN_DEBUG:
            payload['debugCode'] = code
        return Response(payload)

    @action(detail=False, methods=('post',), url_path='verify')
    def verify(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']
        if cache.get(f'otp:{phone}') != code:
            return Response({'detail': 'کد تأیید نامعتبر یا منقضی است.'}, status=400)
        cache.delete(f'otp:{phone}')
        cache.delete(f'otp_resends:{phone}')
        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={'username': phone, 'role': 'user'},
        )
        if not user.is_active:
            return Response({'detail': 'حساب کاربری غیرفعال است.'}, status=403)
        return Response(token_payload(user, is_new_user=created))


class AccountViewSet(viewsets.GenericViewSet):
    permission_classes = (IsAuthenticated,)
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    serializer_class = UserSerializer

    @action(detail=False, methods=('get', 'patch'), url_path='me')
    def me(self, request):
        if request.method == 'PATCH':
            user = request.user
            for field in ('email', 'avatar'):
                if field in request.data:
                    setattr(user, field, request.data[field])
            if 'name' in request.data:
                parts = request.data['name'].strip().split(maxsplit=1)
                user.first_name = parts[0]
                user.last_name = parts[1] if len(parts) > 1 else ''
            user.save()
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=('post',), url_path='complete-profile')
    def complete_profile(self, request):
        serializer = CompleteProfileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)


class PatientViewSet(viewsets.GenericViewSet):
    permission_classes = (IsPatient,)
    serializer_class = PatientProfileSerializer

    def list(self, request):
        profile, _ = PatientProfile.objects.get_or_create(
            user=request.user, defaults={'full_name': request.user.display_name}
        )
        return Response(PatientProfileSerializer(profile).data)

    def partial_update(self, request, pk=None):
        profile = request.user.patient_profile
        serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

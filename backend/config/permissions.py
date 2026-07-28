from rest_framework.permissions import BasePermission


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class IsPatient(IsActiveUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'user'


class IsDoctor(IsActiveUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'doctor'


class IsPlatformAdmin(IsActiveUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and (
            request.user.role == 'admin' or request.user.is_staff
        )

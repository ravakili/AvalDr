from django.core.management.base import BaseCommand

from notifications.services import cleanup_expired_notifications


class Command(BaseCommand):
    help = 'حذف نوتیف‌های خوانده‌شده قدیمی‌تر از ۳ روز'

    def handle(self, *args, **options):
        deleted, _ = cleanup_expired_notifications()
        self.stdout.write(self.style.SUCCESS(f'{deleted} نوتیف خوانده‌شده قدیمی حذف شد.'))

import secrets

import requests
from django.conf import settings


class ZarinpalError(Exception):
    pass


class ZarinpalClient:
    def __init__(self):
        sandbox = getattr(settings, 'ZARINPAL_SANDBOX', True)
        self.api_base = (
            'https://sandbox.zarinpal.com/pg/v4/payment'
            if sandbox
            else 'https://payment.zarinpal.com/pg/v4/payment'
        )
        self.gateway_base = (
            'https://sandbox.zarinpal.com/pg/StartPay'
            if sandbox
            else 'https://payment.zarinpal.com/pg/StartPay'
        )
        self.merchant_id = settings.ZARINPAL_MERCHANT_ID
        self.timeout = getattr(settings, 'ZARINPAL_TIMEOUT_SECONDS', 15)

    def _post(self, path, payload):
        try:
            response = requests.post(
                f'{self.api_base}/{path}.json',
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise ZarinpalError('ارتباط با درگاه زرین‌پال برقرار نشد.') from exc

        data = body.get('data') or {}
        errors = body.get('errors') or {}
        if errors or not data:
            message = errors.get('message') if isinstance(errors, dict) else None
            raise ZarinpalError(message or 'پاسخ نامعتبر از زرین‌پال دریافت شد.')
        return data

    def request_payment(self, payment, callback_url):
        if getattr(settings, 'ZARINPAL_MOCK', False):
            authority = f'A{secrets.token_hex(17)}'[:36]
            return {
                'authority': authority,
                'gateway_url': f'{callback_url}&Authority={authority}&Status=OK',
            }
        data = self._post('request', {
            'merchant_id': self.merchant_id,
            'amount': payment.amount,
            'currency': 'IRT',
            'description': f'پرداخت نوبت شماره {payment.appointment_id}',
            'callback_url': callback_url,
            'metadata': {
                'mobile': payment.appointment.patient.phone,
            },
        })
        authority = data.get('authority')
        if not authority:
            raise ZarinpalError('کد Authority از زرین‌پال دریافت نشد.')
        return {
            'authority': authority,
            'gateway_url': f'{self.gateway_base}/{authority}',
        }

    def verify_payment(self, payment):
        if getattr(settings, 'ZARINPAL_MOCK', False):
            return {
                'code': 100,
                'ref_id': secrets.randbelow(9_000_000_000) + 1_000_000_000,
                'card_pan': '603799******5678',
                'card_hash': secrets.token_hex(16),
            }
        return self._post('verify', {
            'merchant_id': self.merchant_id,
            'amount': payment.amount,
            'authority': payment.authority,
        })

    def refund_payment(self, payment):
        if getattr(settings, 'ZARINPAL_MOCK', False):
            return {'code': 100, 'refund_id': f'R-{secrets.token_hex(8)}'}
        return self._post('reverse', {
            'merchant_id': self.merchant_id,
            'authority': payment.authority,
        })

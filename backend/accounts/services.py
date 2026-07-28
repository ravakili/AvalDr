import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

SMS_IR_VERIFY_URL = 'https://api.sms.ir/v1/send/verify'


def send_otp_sms(phone: str, code: str) -> bool:
    if not settings.SMS_API_KEY:
        logger.warning('SMS_API_KEY not set; skipping SMS send.')
        return False

    mobile = phone.lstrip('0')

    payload = {
        'mobile': mobile,
        'templateId': settings.SMS_TEMPLATE_ID,
        'parameters': [
            {'name': 'Code', 'value': code},
        ],
    }
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'x-api-key': settings.SMS_API_KEY,
    }

    try:
        resp = requests.post(
            SMS_IR_VERIFY_URL,
            json=payload,
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get('status') == 1:
            logger.info('SMS sent successfully to %s (messageId=%s)', phone, data.get('data', {}).get('messageId'))
            return True
        else:
            logger.error('SMS API error for %s: %s', phone, data.get('message', resp.text))
            return False
    except requests.RequestException as e:
        logger.error('SMS API request failed for %s: %s', phone, str(e))
        return False

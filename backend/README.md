# AvalDr Backend

Django REST Framework backend for the patient, doctor, and admin screens in the
AvalDr frontend. API payloads use the frontend's camelCase field names.

## Local setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/api/v1/` and Swagger UI at
`http://127.0.0.1:8000/api/v1/schema/swagger/`.

Without `DB_HOST` and `REDIS_URL`, local development uses SQLite and an
in-memory Channels layer. Docker Compose supplies PostgreSQL and Redis.

For ZarinPal sandbox payments, set:

```text
ZARINPAL_SANDBOX=True
ZARINPAL_MERCHANT_ID=<sandbox merchant id>
ZARINPAL_CALLBACK_URL=http://localhost:5173/payment/callback
```

`ZARINPAL_MOCK=True` is reserved for automated tests and must not be enabled
when testing the real sandbox redirect and verification flow.

For the containerized stack:

```powershell
docker compose up --build
docker compose exec backend python manage.py seed_demo
```

## Authentication

1. `POST /api/v1/auth/send-otp/` with `{ "phone": "09330001111" }`
2. In debug mode, read `debugCode` from the response.
3. `POST /api/v1/auth/verify-otp/` with the phone and six-digit code.
4. Send `Authorization: Bearer <access>` on protected endpoints.
5. New accounts complete onboarding at `POST /api/v1/auth/complete-profile/`.

Demo phones created by `seed_demo`:

- Patient: `09330001111`
- Doctor: `09121110001`
- Admin: `09123456788`

## Main resources

- `/api/v1/doctors/` and `/api/v1/doctors/{id}/slots/`
- `/api/v1/appointments/`
- `/api/v1/payments/`
- `/api/v1/chat/appointments/{id}/messages/`
- `/api/v1/prescriptions/`
- `/api/v1/medical/record/` and `/api/v1/medical/reports/`
- `/api/v1/notifications/`
- `/api/v1/admin/`

## Verification

```powershell
pytest -q
python manage.py check
python manage.py makemigrations --check --dry-run
```

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user_from_token(token):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        access = AccessToken(token)
        return User.objects.filter(pk=access['user_id'], is_active=True).first()
    except Exception:
        return None


class JWTAuthMiddleware:
    """Authenticates WebSocket connections using a JWT access token passed as a
    `token` query parameter (the REST API authenticates via Authorization header,
    which the browser WebSocket API cannot set). Failure to authenticate simply
    leaves scope['user'] as None so consumers can reject the connection."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get('query_string', b'').decode())
        token = (query.get('token') or [''])[0]
        user = await _get_user_from_token(token) if token else None
        scope['user'] = user
        return await self.inner(scope, receive, send)
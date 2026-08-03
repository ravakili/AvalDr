from django.conf import settings


def absolute_media(value, request=None, request_host=None):
    if not value:
        return None
    base = getattr(settings, 'SITE_BASE_URL', '').rstrip('/')
    v = str(value).strip()
    if not v:
        return None
    if '://' in v:
        scheme, rest = v.split('://', 1)
        slash = rest.find('/')
        host = rest[:slash] if slash >= 0 else rest
        path = rest[slash:] if slash >= 0 else '/'
        known = request_host or (request.get_host() if request else '')
        if known and host == known:
            if base:
                return f'{base}{path}' if path.startswith('/') else f'{base}/{path}'
            return v
        return v
    if base:
        return f'{base}{v}' if v.startswith('/') else f'{base}/{v}'
    if request:
        return request.build_absolute_uri(v)
    return v

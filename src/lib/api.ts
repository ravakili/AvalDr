const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'
const TOKEN_KEY = 'AvalDr-api-tokens'

export interface ApiTokens {
  access: string
  refresh: string
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(
      typeof data === 'object' && data && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : `API request failed (${status})`,
    )
    this.status = status
    this.data = data
  }
}

export function getApiTokens(): ApiTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setApiTokens(tokens: ApiTokens | null) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  else localStorage.removeItem(TOKEN_KEY)
}

async function parseResponse(response: Response) {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  return response.text()
}

async function refreshAccessToken() {
  const tokens = getApiTokens()
  if (!tokens?.refresh) return null
  const response = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
  if (!response.ok) {
    setApiTokens(null)
    return null
  }
  const data = await response.json()
  const next = { access: data.access, refresh: data.refresh || tokens.refresh }
  setApiTokens(next)
  return next.access
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...requestOptions } = options
  const buildHeaders = (access?: string) => {
    const result = new Headers(headers)
    if (!(requestOptions.body instanceof FormData) && !result.has('Content-Type')) {
      result.set('Content-Type', 'application/json')
    }
    if (auth && access) result.set('Authorization', `Bearer ${access}`)
    return result
  }

  let access = getApiTokens()?.access
  let response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: buildHeaders(access),
  })
  if (response.status === 401 && auth) {
    access = await refreshAccessToken() || undefined
    if (access) {
      response = await fetch(`${API_BASE}${path}`, {
        ...requestOptions,
        headers: buildHeaders(access),
      })
    }
  }
  const data = await parseResponse(response)
  if (!response.ok) throw new ApiError(response.status, data)
  return data as T
}

export const api = {
  get: <T>(path: string, auth = true) => apiRequest<T>(path, { auth }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}

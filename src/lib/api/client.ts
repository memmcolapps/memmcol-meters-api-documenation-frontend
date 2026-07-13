export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  json?: unknown
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const isMockApiEnabled =
  (import.meta.env.VITE_USE_MOCK_API ?? String(!apiBaseUrl)) === 'true'

function getAccessToken() {
  if (typeof localStorage === 'undefined') return null

  for (const key of ['momas.admin.session', 'momas.session']) {
    try {
      const session = JSON.parse(localStorage.getItem(key) ?? 'null') as {
        accessToken?: string
      } | null
      if (session?.accessToken) return session.accessToken
    } catch {
      // A malformed session should not prevent public requests from being made.
    }
  }

  return null
}

function getErrorMessage(payload: unknown, statusText: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    const value = payload as { message?: unknown; error?: unknown }
    if (typeof value.message === 'string') return value.message
    if (typeof value.error === 'string') return value.error
  }
  return statusText || 'The request could not be completed.'
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: string | undefined
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload: unknown = response.status === 204
    ? undefined
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text()

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, response.statusText),
      response.status,
      payload,
    )
  }

  return payload as T
}

export function getApiErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

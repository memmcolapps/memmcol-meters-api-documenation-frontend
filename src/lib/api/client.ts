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
  formData?: FormData
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const apiBaseUrl = (configuredApiBaseUrl ?? '/powerhub/v1/api').replace(/\/$/, '')

export const isMockApiEnabled =
  (import.meta.env.VITE_USE_MOCK_API ?? String(!configuredApiBaseUrl)) === 'true'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getCookie(name: string) {
  if (typeof document === 'undefined') return null

  const prefix = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split('; ')
    .find((value) => value.startsWith(prefix))

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

async function isCsrfAccessDenied(response: Response) {
  if (response.status !== 403) return false

  try {
    const payload = await response.clone().json() as {
      error?: { code?: string; message?: string }
    }
    return payload.error?.code === 'ACCESS_DENIED' &&
      payload.error.message?.toLowerCase().includes('csrf') === true
  } catch {
    return false
  }
}

export function getErrorMessage(payload: unknown, statusText: string) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    const value = payload as {
      message?: unknown
      error?: unknown
    }
    if (typeof value.message === 'string') return value.message
    if (typeof value.error === 'string') return value.error
    const nestedError = value.error
    if (
      nestedError &&
      typeof nestedError === 'object' &&
      'message' in nestedError &&
      typeof nestedError.message === 'string'
    ) {
      return nestedError.message
    }
  }
  return statusText || 'The request could not be completed.'
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const method = (options.method ?? 'GET').toUpperCase()
  const isUnsafeRequest = unsafeMethods.has(method)
  const csrfToken = isUnsafeRequest ? getCookie('XSRF-TOKEN') : null
  if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken)

  let body: BodyInit | undefined
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  } else if (options.formData !== undefined) {
    body = options.formData
  }

  const { json: _json, formData: _formData, ...requestOptions } = options
  const request: RequestInit = {
    ...requestOptions,
    credentials: options.credentials ?? 'include',
    headers,
    body,
  }

  let response = await fetch(`${apiBaseUrl}${path}`, request)

  if (isUnsafeRequest && await isCsrfAccessDenied(response)) {
    const refreshedToken = getCookie('XSRF-TOKEN')
    if (refreshedToken && refreshedToken !== csrfToken) {
      headers.set('X-XSRF-TOKEN', refreshedToken)
      response = await fetch(`${apiBaseUrl}${path}`, request)
    }
  }

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

export async function apiDownload(path: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      Accept: 'text/csv, application/octet-stream',
    },
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    const payload: unknown = contentType.includes('application/json')
      ? await response.json()
      : await response.text()
    throw new ApiError(
      getErrorMessage(payload, response.statusText),
      response.status,
      payload,
    )
  }

  const disposition = response.headers.get('content-disposition') ?? ''
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plainFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  let filename: string | undefined

  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename)
    } catch {
      filename = encodedFilename
    }
  } else {
    filename = plainFilename
  }

  return {
    blob: await response.blob(),
    filename,
  }
}

export function getApiErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

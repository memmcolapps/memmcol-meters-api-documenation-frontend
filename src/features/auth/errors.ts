import { ApiError, getApiErrorMessage } from '../../lib/api/client'

type AuthErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export function getAuthError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as AuthErrorPayload | undefined
    : undefined

  return {
    message: payload?.error?.message ?? getApiErrorMessage(error),
    fields: payload?.error?.fields ?? {},
  }
}

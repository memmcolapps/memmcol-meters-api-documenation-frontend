import { useMutation } from '@tanstack/react-query'
import { ApiError, apiRequest, getApiErrorMessage } from '../../lib/api/client'

export type AdminForgotPasswordInput = {
  email: string
}

export type AdminForgotPasswordResponse = {
  message: string
}

export function adminForgotPassword(input: AdminForgotPasswordInput) {
  return apiRequest<AdminForgotPasswordResponse>('/admin/auth/forgot-password', {
    method: 'POST',
    json: input,
  })
}

export function useAdminForgotPassword() {
  return useMutation({
    mutationFn: adminForgotPassword,
  })
}

export type AdminResetPasswordInput = {
  resetToken: string
  password: string
}

export type AdminResetPasswordResponse = {
  message: string
}

export function adminResetPassword(input: AdminResetPasswordInput) {
  return apiRequest<AdminResetPasswordResponse>('/admin/auth/reset-password', {
    method: 'POST',
    json: input,
  })
}

type AdminResetPasswordErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export type AdminResetPasswordError = {
  status: number | undefined
  code: string | undefined
  message: string
  fields: Record<string, string>
  requestId: string | undefined
}

export function getAdminResetPasswordError(error: unknown): AdminResetPasswordError {
  const payload = error instanceof ApiError
    ? error.details as AdminResetPasswordErrorPayload | undefined
    : undefined

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message: payload?.error?.message ?? getApiErrorMessage(error),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: adminResetPassword,
  })
}

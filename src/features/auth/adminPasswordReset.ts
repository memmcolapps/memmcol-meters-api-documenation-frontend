import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

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

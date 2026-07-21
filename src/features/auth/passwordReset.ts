import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type ForgotPasswordInput = {
  email: string
}

export type ForgotPasswordResponse = {
  message: string
  expiresIn: number
  resendAfter: number
}

export type VerifyOtpInput = {
  email: string
  otp: string
}

export type VerifyOtpResponse = {
  resetToken: string
  expiresIn: number
}

export type ResetPasswordInput = {
  resetToken: string
  password: string
}

export type ResetPasswordResponse = {
  message: string
}

export type ResendOtpInput = {
  email: string
}

export type ResendOtpResponse = {
  message: string
  expiresIn: number
  resendAfter: number
}

export function requestPasswordOtp(input: ForgotPasswordInput) {
  return apiRequest<ForgotPasswordResponse>('/auth/password/forgot', {
    method: 'POST',
    json: input,
  })
}

export function verifyPasswordOtp(input: VerifyOtpInput) {
  return apiRequest<VerifyOtpResponse>('/auth/password/verify-otp', {
    method: 'POST',
    json: input,
  })
}

export function resetPassword(input: ResetPasswordInput) {
  return apiRequest<ResetPasswordResponse>('/auth/password/reset', {
    method: 'POST',
    json: input,
  })
}

export function resendPasswordOtp(input: ResendOtpInput) {
  return apiRequest<ResendOtpResponse>('/auth/password/resend-otp', {
    method: 'POST',
    json: input,
  })
}

export function useRequestPasswordOtp() {
  return useMutation({
    mutationFn: requestPasswordOtp,
  })
}

export function useVerifyPasswordOtp() {
  return useMutation({
    mutationFn: verifyPasswordOtp,
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  })
}

export function useResendPasswordOtp() {
  return useMutation({
    mutationFn: resendPasswordOtp,
  })
}

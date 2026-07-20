import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'
import { getAuthError } from './errors'
import type { AuthenticatedAccount, AuthenticatedUser } from './types'

export type RegisterBusinessInput = {
  businessName: string
  firstName: string
  lastName: string
  email: string
  dialCode: string
  phone: string
  password: string
}

export type RegisteredUser = AuthenticatedUser & {
  dialCode: string
  phone: string
}

export type RegisterBusinessResponse = AuthenticatedAccount & {
  user: RegisteredUser
}

export function registerBusinessAccount(input: RegisterBusinessInput) {
  return apiRequest<RegisterBusinessResponse>('/auth/register', {
    method: 'POST',
    json: input,
  })
}

export function useRegisterBusinessAccount() {
  return useMutation({
    mutationFn: registerBusinessAccount,
  })
}

export function getRegistrationError(error: unknown) {
  return getAuthError(error)
}

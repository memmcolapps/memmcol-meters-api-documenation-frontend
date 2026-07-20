import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'
import type { AuthenticatedAccount } from './types'

export type LoginInput = {
  email: string
  password: string
}

export type LoginResponse = AuthenticatedAccount

export function login(input: LoginInput) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    json: input,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: login,
  })
}

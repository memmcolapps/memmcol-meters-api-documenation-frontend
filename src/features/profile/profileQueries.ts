import { useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type CurrentProfile = {
  id: string
  firstName: string
  lastName: string
  businessName: string
  email: string
  dialCode: string
  phone: string
  role: string
}

export type UpdateProfileInput = {
  firstName: string
  lastName: string
  businessName: string
  dialCode: string
  phone: string
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordResponse = {
  message: string
}

export const profileKeys = {
  all: ['profile'] as const,
  current: () => ['profile', 'current'] as const,
}

export function getCurrentProfile() {
  return apiRequest<CurrentProfile>('/profile')
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: getCurrentProfile,
  })
}

export function changePassword(input: ChangePasswordInput) {
  return apiRequest<ChangePasswordResponse>('/profile/change-password', {
    method: 'POST',
    json: input,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  })
}

export function updateProfile(input: UpdateProfileInput) {
  return apiRequest<CurrentProfile>('/profile', {
    method: 'PATCH',
    json: input,
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfile,
  })
}

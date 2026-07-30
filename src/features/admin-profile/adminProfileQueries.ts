import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'
import type { AdminIdentity } from '../auth/adminLogin'

export type UpdateAdminProfileInput = {
  firstName: string
  lastName: string
}

export type UpdateAdminProfileResponse = {
  admin: AdminIdentity & { updatedAt: string }
}

export function updateAdminProfile(input: UpdateAdminProfileInput) {
  return apiRequest<UpdateAdminProfileResponse>('/admin/profile', {
    method: 'PATCH',
    json: input,
  })
}

export function useUpdateAdminProfile() {
  return useMutation({
    mutationFn: updateAdminProfile,
  })
}

export type ChangeAdminPasswordInput = {
  currentPassword: string
  newPassword: string
}

export type ChangeAdminPasswordResponse = {
  message: string
}

export function changeAdminPassword(input: ChangeAdminPasswordInput) {
  return apiRequest<ChangeAdminPasswordResponse>('/admin/profile/change-password', {
    method: 'POST',
    json: input,
  })
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: changeAdminPassword,
  })
}

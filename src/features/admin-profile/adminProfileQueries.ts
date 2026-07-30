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

import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type CompleteAdminInviteInput = {
  inviteToken: string
  password: string
}

export type CompleteAdminInviteResponse = {
  message: string
}

export function completeAdminInvite(input: CompleteAdminInviteInput) {
  return apiRequest<CompleteAdminInviteResponse>('/admin/auth/complete-invite?token=${encodeURIComponent(token)}', {
    method: 'POST',
    json: input,
  })
}

export function useCompleteAdminInvite() {
  return useMutation({
    mutationFn: completeAdminInvite,
  })
}

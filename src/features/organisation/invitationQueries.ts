import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type VerifyInvitationResponse = {
  message: string
  email: string
  role: string
  organisationName: string
}

export type AcceptInvitationInput = {
  email: string
  firstName: string
  lastName: string
  password: string
}

export type AcceptInvitationResponse = {
  message: string
  email: string
  role: string
  organisationName: string
}

export function verifyInvitation(token: string) {
  return apiRequest<VerifyInvitationResponse>(
    `/organisation/invitations/verify?token=${encodeURIComponent(token)}`,
  )
}

export function acceptInvitation(input: AcceptInvitationInput) {
  return apiRequest<AcceptInvitationResponse>('/organisation/invitations/accept', {
    method: 'POST',
    json: input,
  })
}

export function useVerifyInvitation() {
  return useMutation({
    mutationFn: verifyInvitation,
  })
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: acceptInvitation,
  })
}

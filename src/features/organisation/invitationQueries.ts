import { useMutation } from '@tanstack/react-query'
import { ApiError, apiRequest, getErrorMessage } from '../../lib/api/client'

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

export async function verifyInvitation(token: string) {
  const response = await fetch(
    `https://sbctest.memmserve.com/powerhub/v1/api/invitation/setup?token=${encodeURIComponent(token)}`,
    { credentials: 'include', headers: { Accept: 'application/json' } },
  )
  const payload: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : await response.text()
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.statusText), response.status, payload)
  }
  return payload as VerifyInvitationResponse
}

export function acceptInvitation(input: AcceptInvitationInput) {
  return apiRequest<AcceptInvitationResponse>('https://sbctest.memmserve.com/powerhub/v1/api/organisation/invitations/accept', {
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

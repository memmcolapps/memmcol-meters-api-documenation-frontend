import { useMutation } from '@tanstack/react-query'
import { ApiError, getErrorMessage } from '../../lib/api/client'

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
    `https://sbctest.memmserve.com/powerhub/v1/api/organisation/invitations/verify?token=${encodeURIComponent(token)}`,
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

export async function acceptInvitation(input: AcceptInvitationInput) {
  const response = await fetch(
    'https://sbctest.memmserve.com/powerhub/v1/api/organisation/invitations/accept',
    {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  const payload: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : await response.text()
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.statusText), response.status, payload)
  }
  return payload as AcceptInvitationResponse
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

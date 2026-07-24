import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, getErrorMessage } from '../../lib/api/client'

const API_BASE = 'https://sbctest.memmserve.com/powerhub/v1/api'

export type OrganisationMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type OrganisationMemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED'

export type OrganisationMember = {
  id: string
  firstName: string | null
  lastName: string | null
  displayName: string
  email: string
  role: OrganisationMemberRole
  status: OrganisationMemberStatus
  isCurrentUser: boolean
}

export type OrganisationMembersResponse = {
  items: OrganisationMember[]
}

export type InvitationRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type InviteOrganisationMemberInput = {
  email: string
  role: InvitationRole
}

export type OrganisationInvitation = {
  id: string
  email: string
  role: InvitationRole
  status: 'INVITED'
  expiresAt: string
  createdAt: string
}

export const organisationMemberKeys = {
  all: ['organisation-members'] as const,
  list: () => ['organisation-members', 'list'] as const,
}

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...options,
  })
  const payload: unknown = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : await response.text()
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.statusText), response.status, payload)
  }
  return payload as T
}

export function getOrganisationMembers() {
  return apiFetch<OrganisationMembersResponse>('/organisation/members')
}

export function useOrganisationMembers() {
  return useQuery({
    queryKey: organisationMemberKeys.list(),
    queryFn: getOrganisationMembers,
  })
}

export function inviteOrganisationMember(input: InviteOrganisationMemberInput) {
  return apiFetch<OrganisationInvitation>('/organisation/invitations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function useInviteOrganisationMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: inviteOrganisationMember,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: organisationMemberKeys.all,
    }),
  })
}

export function removeOrganisationMember(memberId: string) {
  return apiFetch<void>(`/organisation/members/${memberId}`, {
    method: 'DELETE',
  })
}

export function useRemoveOrganisationMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeOrganisationMember,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: organisationMemberKeys.all,
    }),
  })
}

export function leaveOrganisation() {
  return apiFetch<void>('/organisation/leave', {
    method: 'POST',
    body: JSON.stringify({ confirmation: true }),
  })
}

export function useLeaveOrganisation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveOrganisation,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: organisationMemberKeys.all,
    }),
  })
}

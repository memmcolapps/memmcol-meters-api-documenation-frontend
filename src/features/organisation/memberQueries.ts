import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type OrganisationMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type OrganisationMemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED'

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

export function getOrganisationMembers() {
  return apiRequest<OrganisationMembersResponse>('/organisation/members')
}

export function useOrganisationMembers() {
  return useQuery({
    queryKey: organisationMemberKeys.list(),
    queryFn: getOrganisationMembers,
  })
}

export function inviteOrganisationMember(input: InviteOrganisationMemberInput) {
  return apiRequest<OrganisationInvitation>('/organisation/invitations', {
    method: 'POST',
    json: input,
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
  return apiRequest<void>(`/organisation/members/${memberId}`, {
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
  return apiRequest<void>('/organisation/leave', {
    method: 'POST',
    json: { confirmation: true },
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

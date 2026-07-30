import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type AdminRole = 'ADMIN' | 'DEVELOPER'

export type CreateAdminUserInput = {
  firstName: string
  lastName: string
  email: string
  role: AdminRole
}

export type AdminUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: AdminRole
  status: string
  invitedAt: string
}

export type AdminTeamMemberStatus =
  | 'ACTIVE'
  | 'INVITED'
  | 'SUSPENDED'
  | 'DISABLED'

export type AdminTeamMember = {
  id: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  role: AdminRole
  status: AdminTeamMemberStatus
  isCurrentUser: boolean
  isOwner: boolean
}

type CreateAdminUserResponse = {
  admin: AdminUser
}

type AdminTeamMembersResponse = {
  items: AdminTeamMember[]
}

type AdminUserErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

async function createAdminUser(input: CreateAdminUserInput) {
  const response = await apiRequest<CreateAdminUserResponse>('/admin/users', {
    method: 'POST',
    json: input,
  })
  return response.admin
}

function listAdminTeamMembers() {
  return apiRequest<AdminTeamMembersResponse>('/admin/team/members')
}

export const adminTeamKeys = {
  all: ['admin-team'] as const,
  members: () => ['admin-team', 'members'] as const,
}

export function useAdminTeamMembers() {
  return useQuery({
    queryKey: adminTeamKeys.members(),
    queryFn: listAdminTeamMembers,
  })
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminTeamKeys.members() })
    },
  })
}

export function leaveAdminTeam() {
  return apiRequest<void>('/admin/team/leave', {
    method: 'POST',
    json: { confirmation: true },
  })
}

export function useLeaveAdminTeam() {
  return useMutation({
    mutationFn: leaveAdminTeam,
  })
}

export function getCreateAdminUserError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as AdminUserErrorPayload | undefined
    : undefined

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The admin user could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

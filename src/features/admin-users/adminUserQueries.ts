import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER'

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
  isSuperAdmin: boolean
}

type CreateAdminUserResponse = {
  admin: AdminUser
}

type AdminTeamMembersResponse = {
  items: AdminTeamMember[]
}

type UpdateAdminTeamMemberRoleResponse = {
  member: {
    id: string
    email: string
    role: AdminRole
    status: string
    updatedAt: string
  }
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

export function removeAdminTeamMember(memberId: string) {
  return apiRequest<void>(`/admin/team/members/${memberId}`, {
    method: 'DELETE',
  })
}

export function useRemoveAdminTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeAdminTeamMember,
    onSuccess: async (_data, memberId) => {
      queryClient.setQueryData<AdminTeamMembersResponse>(
        adminTeamKeys.members(),
        (current) => {
          if (!current) return current
          return {
            ...current,
            items: current.items.filter((member) => member.id !== memberId),
          }
        },
      )
      await queryClient.invalidateQueries({ queryKey: adminTeamKeys.members() })
    },
  })
}

export function updateAdminTeamMemberRole(memberId: string, role: AdminRole) {
  return apiRequest<UpdateAdminTeamMemberRoleResponse>(
    `/admin/team/members/${memberId}`,
    {
      method: 'PATCH',
      json: { role },
    },
  )
}

export function useUpdateAdminTeamMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: AdminRole }) =>
      updateAdminTeamMemberRole(memberId, role),
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

const teamMemberErrorMessages: Record<string, string> = {
  CANNOT_SUPER_ADMIN: 'A super admin cannot be removed.',
  CANNOT_REMOVE_SELF: 'You cannot remove your own account.',
  LAST_ADMIN: 'At least one admin must remain in the team.',
  OWNER_ROLE_LOCKED: 'The owner role cannot be changed.',
  CANNOT_EDIT_SELF: 'You cannot change your own role.',
  MEMBER_NOT_FOUND: 'This team member no longer exists.',
  VALIDATION_ERROR: 'Please review the provided values and try again.',
}

export function getAdminTeamMemberError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as AdminUserErrorPayload | undefined
    : undefined

  const code = payload?.error?.code
  return {
    status: error instanceof ApiError ? error.status : undefined,
    code,
    message: payload?.error?.message ?? (
      (code && teamMemberErrorMessages[code]) ??
      (error instanceof Error ? error.message : 'The team member could not be updated.')
    ),
    requestId: payload?.error?.requestId,
  }
}

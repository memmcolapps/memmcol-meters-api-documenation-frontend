import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type AdminLoginInput = {
  email: string
  password: string
}

export type AdminIdentity = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'ADMIN'
}

export type AdminLoginResponse = {
  admin: AdminIdentity
}

export type AdminLogoutResponse = {
  message: string
}

export const adminAuthKeys = {
  current: () => ['admin-auth', 'current'] as const,
}

export function adminLogin(input: AdminLoginInput) {
  return apiRequest<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    json: input,
  })
}

export function adminLogout() {
  return apiRequest<AdminLogoutResponse>('/admin/auth/logout', {
    method: 'POST',
  })
}

export async function getCurrentAdmin() {
  const response = await apiRequest<AdminLoginResponse>('/admin/auth/me')
  return response.admin
}

export function currentAdminQueryOptions() {
  return queryOptions({
    queryKey: adminAuthKeys.current(),
    queryFn: getCurrentAdmin,
    retry: false,
  })
}

export function useAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminLogin,
    onSuccess: ({ admin }) => {
      queryClient.setQueryData(adminAuthKeys.current(), admin)
    },
  })
}

export function useAdminLogout() {
  return useMutation({
    mutationFn: adminLogout,
  })
}

export function useAdminIdentity() {
  return useSuspenseQuery(currentAdminQueryOptions())
}

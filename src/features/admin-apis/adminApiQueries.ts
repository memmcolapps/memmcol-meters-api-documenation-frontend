import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type AdminApiStatus = 'ACTIVE' | 'DEPRECATED'
export type AdminApiPublication = 'PUBLISHED' | 'UNPUBLISHED'

export type AdminApiAddedBy = {
  id: string
  name: string
}

export type AdminApi = {
  id: string
  name: string
  route: string
  cost: number
  samplePayload: string
  sampleRequest: string
  documentation: string
  status: AdminApiStatus
  publication: AdminApiPublication
  addedBy: AdminApiAddedBy
  createdAt: string
  updatedAt: string
}

export type CreateAdminApiInput = {
  name: string
  route: string
  cost: number
  samplePayload: string
  sampleRequest: string
  documentation: string
}

export type UpdateAdminApiInput = Partial<CreateAdminApiInput> & {
  status?: AdminApiStatus
  publication?: AdminApiPublication
}

type AdminApiResponse = {
  api: AdminApi
}

type AdminApiListResponse = {
  apis: AdminApi[]
}

export const adminApiKeys = {
  all: ['admin-apis'] as const,
  list: () => ['admin-apis', 'list'] as const,
  detail: (id: string) => ['admin-apis', 'detail', id] as const,
}

function listAdminApis() {
  return apiRequest<AdminApiListResponse>('/admin/apis')
}

function getAdminApi(id: string) {
  return apiRequest<AdminApiResponse>(`/admin/apis/${encodeURIComponent(id)}`)
}

function createAdminApi(input: CreateAdminApiInput) {
  return apiRequest<AdminApiResponse>('/admin/apis', {
    method: 'POST',
    json: input,
  })
}

function updateAdminApi(id: string, input: UpdateAdminApiInput) {
  return apiRequest<AdminApiResponse>(`/admin/apis/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    json: input,
  })
}

function deleteAdminApi(id: string) {
  return apiRequest<void>(`/admin/apis/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function useAdminApis() {
  return useQuery({
    queryKey: adminApiKeys.list(),
    queryFn: async () => {
      const res = await listAdminApis()
      return res.apis
    },
  })
}

export function useAdminApi(id: string) {
  return useQuery({
    queryKey: adminApiKeys.detail(id),
    queryFn: async () => {
      const res = await getAdminApi(id)
      return res.api
    },
  })
}

export function useCreateAdminApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAdminApiInput) => {
      const res = await createAdminApi(input)
      return res.api
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.all })
    },
  })
}

export function useUpdateAdminApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAdminApiInput }) => {
      const res = await updateAdminApi(id, input)
      return res.api
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.all })
      queryClient.invalidateQueries({ queryKey: adminApiKeys.detail(variables.id) })
    },
  })
}

export function useDeleteAdminApi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAdminApi(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.all })
    },
  })
}

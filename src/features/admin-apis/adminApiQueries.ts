import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCrudQueryKeys,
  createMemoryCrudService,
  createRestCrudService,
  type CrudService,
} from '../../lib/api/crud'
import { isMockApiEnabled } from '../../lib/api/client'
import { seededAdminApis, type AdminApi } from '../../app/adminApis'

export type CreateAdminApiInput = Omit<AdminApi, 'id'>
export type UpdateAdminApiInput = Partial<Omit<AdminApi, 'id'>>

const service: CrudService<AdminApi, CreateAdminApiInput, UpdateAdminApiInput> =
  isMockApiEnabled
    ? createMemoryCrudService<AdminApi, CreateAdminApiInput, UpdateAdminApiInput>(
        seededAdminApis,
      )
    : createRestCrudService<AdminApi, CreateAdminApiInput, UpdateAdminApiInput>(
        '/admin/apis',
      )

export const adminApiKeys = createCrudQueryKeys('admin-apis')

function useStoreAdminApi() {
  const queryClient = useQueryClient()

  return (api: AdminApi) => {
    queryClient.setQueryData<AdminApi[]>(adminApiKeys.list(), (current) => {
      if (!current) return [api]
      return current.some((item) => item.id === api.id)
        ? current.map((item) => (item.id === api.id ? api : item))
        : [...current, api]
    })
    queryClient.setQueryData(adminApiKeys.detail(api.id), api)
  }
}

export function useAdminApis() {
  return useQuery({
    queryKey: adminApiKeys.list(),
    queryFn: service.list,
  })
}

export function useAdminApi(id: string) {
  return useQuery({
    queryKey: adminApiKeys.detail(id),
    queryFn: () => service.get(id),
  })
}

export function useCreateAdminApi() {
  const store = useStoreAdminApi()
  return useMutation({
    mutationFn: service.create,
    onSuccess: store,
  })
}

export function useUpdateAdminApi() {
  const store = useStoreAdminApi()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminApiInput }) =>
      service.update(id, data),
    onSuccess: store,
  })
}

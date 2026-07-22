import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type CreateMeterIntegrationInput = {
  manufacturer: string
  model: string
  class: string
  category: string
  protocol: string
  authenticationType: string
  password: string
  description?: string
}

export type MeterIntegrationStatus = 'ACTIVE' | 'DEPRECATED'

export type MeterIntegrationSummary = {
  id: string
  manufacturer: string
  model: string
  protocol: string
  authenticationType: string
  status: MeterIntegrationStatus
  obisCodeCount: number
  addedBy: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export type MeterIntegration = MeterIntegrationSummary & {
  class: string
  category: string
  description: string
}

export type MeterIntegrationListParams = {
  search?: string
  status?: MeterIntegrationStatus
  manufacturer?: string
  page: number
  limit: number
}

export type MeterIntegrationListResponse = {
  items: MeterIntegrationSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreateObisCodeInput = {
  action: string
  code: string
  description?: string
}

export type ObisCode = {
  id: string
  meterIntegrationId: string
  action: string
  code: string
  description: string
  status: 'ACTIVE' | 'DEPRECATED'
  createdAt: string
  updatedAt: string
}

export type ObisUploadMode = 'append' | 'replace'

export type ObisUploadError = {
  row: number
  field: string
  message: string
}

export type ObisUpload = {
  id: string
  status: string
  mode: ObisUploadMode
  totalRows: number
  created: number
  updated: number
  failed: number
  errors: ObisUploadError[]
  uploadedAt: string
}

export type UploadObisCodesInput = {
  file: File
  mode: ObisUploadMode
}

type CreateMeterIntegrationResponse = {
  meterIntegration: MeterIntegration
}

type CreateObisCodeResponse = {
  obisCode: ObisCode
}

type UploadObisCodesResponse = {
  upload: ObisUpload
}

type MeterIntegrationErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

async function createMeterIntegration(input: CreateMeterIntegrationInput) {
  const response = await apiRequest<CreateMeterIntegrationResponse>(
    '/admin/meter-integrations',
    {
      method: 'POST',
      json: input,
    },
  )
  return response.meterIntegration
}

async function listMeterIntegrations(params: MeterIntegrationListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.manufacturer) query.set('manufacturer', params.manufacturer)

  return apiRequest<MeterIntegrationListResponse>(
    `/admin/meter-integrations?${query.toString()}`,
  )
}

async function createObisCode(
  meterIntegrationId: string,
  input: CreateObisCodeInput,
) {
  const response = await apiRequest<CreateObisCodeResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes`,
    {
      method: 'POST',
      json: input,
    },
  )
  return response.obisCode
}

async function uploadObisCodes(
  meterIntegrationId: string,
  input: UploadObisCodesInput,
) {
  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('mode', input.mode)

  const response = await apiRequest<UploadObisCodesResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes/upload`,
    {
      method: 'POST',
      formData,
    },
  )
  return response.upload
}

export const meterIntegrationKeys = {
  all: ['admin-meter-integrations'] as const,
  lists: () => ['admin-meter-integrations', 'list'] as const,
  options: () => ['admin-meter-integrations', 'options'] as const,
  list: (params: MeterIntegrationListParams) =>
    ['admin-meter-integrations', 'list', params] as const,
  detail: (id: string) => ['admin-meter-integrations', 'detail', id] as const,
  obisCodes: (id: string) => ['admin-meter-integrations', 'detail', id, 'obis-codes'] as const,
}

export function useCreateMeterIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeterIntegration,
    onSuccess: async (integration) => {
      queryClient.setQueryData(
        meterIntegrationKeys.detail(integration.id),
        integration,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.options() }),
      ])
    },
  })
}

export function useMeterIntegrations(params: MeterIntegrationListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: meterIntegrationKeys.list(params),
    queryFn: async () => {
      const response = await listMeterIntegrations(params)
      response.items.forEach((integration) => {
        queryClient.setQueryData(
          meterIntegrationKeys.detail(integration.id),
          integration,
        )
      })
      return response
    },
    placeholderData: keepPreviousData,
  })
}

export function useActiveMeterIntegrationOptions() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: meterIntegrationKeys.options(),
    queryFn: async () => {
      const firstPage = await listMeterIntegrations({
        status: 'ACTIVE',
        page: 1,
        limit: 100,
      })
      const remainingPages = firstPage.pagination.totalPages > 1
        ? await Promise.all(
            Array.from(
              { length: firstPage.pagination.totalPages - 1 },
              (_, index) => listMeterIntegrations({
                status: 'ACTIVE',
                page: index + 2,
                limit: 100,
              }),
            ),
          )
        : []
      const integrations = [
        ...firstPage.items,
        ...remainingPages.flatMap((page) => page.items),
      ]
      integrations.forEach((integration) => {
        queryClient.setQueryData(
          meterIntegrationKeys.detail(integration.id),
          integration,
        )
      })
      return integrations
    },
  })
}

export function useCreateObisCode(meterIntegrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateObisCodeInput) =>
      createObisCode(meterIntegrationId, input),
    onSuccess: (obisCode) => {
      queryClient.setQueryData<ObisCode[]>(
        meterIntegrationKeys.obisCodes(meterIntegrationId),
        (current = []) => [...current, obisCode],
      )
    },
  })
}

export function useUploadObisCodes(meterIntegrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UploadObisCodesInput) =>
      uploadObisCodes(meterIntegrationId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: meterIntegrationKeys.obisCodes(meterIntegrationId),
        }),
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() }),
      ])
    },
  })
}

export function getCachedMeterIntegration(
  queryClient: QueryClient,
  id: string,
) {
  return queryClient.getQueryData<MeterIntegrationSummary>(
    meterIntegrationKeys.detail(id),
  )
}

export function getCachedObisCodes(
  queryClient: QueryClient,
  meterIntegrationId: string,
) {
  return queryClient.getQueryData<ObisCode[]>(
    meterIntegrationKeys.obisCodes(meterIntegrationId),
  ) ?? []
}

export function getMeterIntegrationError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The meter integration could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getObisCodeError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The OBIS code could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getObisUploadError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The OBIS codes could not be uploaded.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

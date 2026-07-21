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
  password?: string
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

type CreateMeterIntegrationResponse = {
  meterIntegration: MeterIntegration
}

type CreateObisCodeResponse = {
  obisCode: ObisCode
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

export const meterIntegrationKeys = {
  all: ['admin-meter-integrations'] as const,
  lists: () => ['admin-meter-integrations', 'list'] as const,
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
      await queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() })
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

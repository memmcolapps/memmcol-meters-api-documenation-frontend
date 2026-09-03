import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type PublicMeterIntegration = {
  id: string
  manufacturer: string
  model: string
  class: string
  category: string
  protocol: string
  hesStatus: string
  updatedAt: string
}

export type PublicMeterIntegrationListParams = {
  search?: string
  manufacturer?: string
  page?: number
  limit?: number
}

type PublicMeterIntegrationListResponse = {
  items: PublicMeterIntegration[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const publicMeterIntegrationKeys = {
  all: ['public-meter-integrations'] as const,
  list: (params: PublicMeterIntegrationListParams) =>
    ['public-meter-integrations', 'list', params] as const,
}

function listPublicMeterIntegrations(
  params: PublicMeterIntegrationListParams,
) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
  })
  if (params.search) query.set('search', params.search)
  if (params.manufacturer) query.set('manufacturer', params.manufacturer)

  return apiRequest<PublicMeterIntegrationListResponse>(
    `/public/meter-integrations?${query.toString()}`,
    { auth: 'none', cache: 'no-cache' },
  )
}

export function usePublicMeterIntegrations(
  params: PublicMeterIntegrationListParams = {},
) {
  return useQuery({
    queryKey: publicMeterIntegrationKeys.list(params),
    queryFn: () => listPublicMeterIntegrations(params),
    placeholderData: keepPreviousData,
  })
}

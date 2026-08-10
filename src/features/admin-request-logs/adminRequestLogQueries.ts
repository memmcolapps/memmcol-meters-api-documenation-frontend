import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type AdminRequestLogOutcome = 'SUCCESS' | 'FAILURE'
export type AdminRequestLogSortOrder = 'asc' | 'desc'

export type AdminRequestLogOrganisation = {
  id: string
  name?: string | null
}

export type AdminRequestLogApi = {
  id: string
  name?: string | null
}

export type AdminRequestLog = {
  id: string
  requestId?: string | null
  organisation?: AdminRequestLogOrganisation | null
  requestTime?: string | null
  api?: AdminRequestLogApi | null
  code?: number | null
  response?: string | null
  creditsCharged?: number | null
  latencyMs?: number | null
}

export type AdminRequestLogListParams = {
  search?: string
  organisationId?: string
  apiId?: string
  code?: number
  outcome?: AdminRequestLogOutcome
  from?: string
  to?: string
  page: number
  limit: number
  sortOrder?: AdminRequestLogSortOrder
}

export type AdminRequestLogListResponse = {
  items: AdminRequestLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const adminRequestLogKeys = {
  all: ['admin-request-logs'] as const,
  lists: () => ['admin-request-logs', 'list'] as const,
  list: (params: AdminRequestLogListParams) =>
    ['admin-request-logs', 'list', params] as const,
}

function listAdminRequestLogs(params: AdminRequestLogListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search) query.set('search', params.search)
  if (params.organisationId) query.set('organisationId', params.organisationId)
  if (params.apiId) query.set('apiId', params.apiId)
  if (params.code !== undefined) query.set('code', String(params.code))
  if (params.outcome) query.set('outcome', params.outcome)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  return apiRequest<AdminRequestLogListResponse>(
    `/admin/request-logs?${query.toString()}`,
  )
}

export function useAdminRequestLogs(params: AdminRequestLogListParams) {
  return useQuery({
    queryKey: adminRequestLogKeys.list(params),
    queryFn: () => listAdminRequestLogs(params),
    placeholderData: keepPreviousData,
  })
}

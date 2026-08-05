import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { apiDownload, apiRequest } from '../../lib/api/client'

export type RequestLogOutcome = 'SUCCESS' | 'CLIENT_ERROR' | 'SERVER_ERROR'
export type RequestLogSortOrder = 'asc' | 'desc'

export type RequestLog = {
  id: string
  requestId: string
  requestTime: string
  api: {
    id: string
    name: string
  }
  code: number
  response: string
  creditsCharged: number
}

export type RequestLogListParams = {
  search?: string
  from?: string
  to?: string
  code?: number
  outcome?: RequestLogOutcome
  apiId?: string
  page: number
  limit: number
  sortOrder?: RequestLogSortOrder
}

export type RequestLogListResponse = {
  summary: {
    totalApiCalls: number
    successfulApiCalls: number
    failedApiCalls: number
    creditBalance: number
  }
  items: RequestLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type RequestLogExportParams = {
  date?: string
  statusCode?: number
}

export const requestLogKeys = {
  all: ['request-logs'] as const,
  list: (params: RequestLogListParams) =>
    ['request-logs', 'list', params] as const,
}

function listRequestLogs(params: RequestLogListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search) query.set('search', params.search)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.code !== undefined) query.set('code', String(params.code))
  if (params.outcome) query.set('outcome', params.outcome)
  if (params.apiId) query.set('apiId', params.apiId)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  return apiRequest<RequestLogListResponse>(
    `/request-logs?${query.toString()}`,
  )
}

function exportRequestLogs(params: RequestLogExportParams) {
  const query = new URLSearchParams({ format: 'csv' })
  if (params.date) query.set('date', params.date)
  if (params.statusCode !== undefined) {
    query.set('statusCode', String(params.statusCode))
  }
  return apiDownload(`/logs/export?${query.toString()}`)
}

export function useRequestLogs(params: RequestLogListParams) {
  return useQuery({
    queryKey: requestLogKeys.list(params),
    queryFn: () => listRequestLogs(params),
    placeholderData: keepPreviousData,
  })
}

export function useExportRequestLogs() {
  return useMutation({
    mutationFn: exportRequestLogs,
  })
}

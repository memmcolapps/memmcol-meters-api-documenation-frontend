import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type UsageByService = {
  apiId: string
  name: string
  calls: number
  creditsUsed: number
}

export type UsageRecentLog = {
  id: string
  requestId: string
  requestTime: string
  apiName: string
  code: number
  response: string
  creditsCharged: number
}

export type UsageSummary = {
    from: string
    to: string
    totalApiCalls: number
    successfulApiCalls: number
    failedApiCalls: number
    successRate: number
    creditsUsed: number
    creditBalance: number
    usageByService: UsageByService[]
    recentLogs: UsageRecentLog[]
}

export type UsageSummaryResponse = {
  summary: UsageSummary
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type UsageSummaryParams = {
  from?: string
  to?: string
  page?: number
  limit?: number
}

export const usageSummaryKeys = {
  all: ['usage-summary'] as const,
  get: (params: UsageSummaryParams) => ['usage-summary', params] as const,
}

function getUsageSummary(params: UsageSummaryParams) {
  const query = new URLSearchParams()
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return apiRequest<UsageSummaryResponse>(
    `/usage/summary${qs ? `?${qs}` : ''}`,
  )
}

export function useUsageSummary(params: UsageSummaryParams) {
  return useQuery({
    queryKey: usageSummaryKeys.get(params),
    queryFn: () => getUsageSummary(params),
    placeholderData: keepPreviousData,
  })
}

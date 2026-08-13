import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type UsageByService = {
  apiId: string
  name: string
  calls: number
  creditsUsed: number
}

export type RecentLog = {
  id: string
  requestId: string
  requestTime: string
  apiName: string
  code: number
  response: string
  creditsCharged: number
}

export type DashboardSummary = {
  from: string | null
  to: string | null
  totalApiCalls: number
  successfulApiCalls: number
  failedApiCalls: number
  successRate: number
  creditsUsed: number
  creditBalance: number
  usageByService: UsageByService[]
  recentLogs: RecentLog[]
}

type DashboardSummaryResponse = {
  summary: DashboardSummary
}

export type DashboardSummaryParams = {
  from?: string
  to?: string
}

async function getDashboardSummary(params: DashboardSummaryParams) {
  const query = new URLSearchParams()
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)

  const qs = query.toString()
  const { summary } = await apiRequest<DashboardSummaryResponse>(
    `/dashboard/summary${qs ? `?${qs}` : ''}`,
  )
  return summary
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (params: DashboardSummaryParams) =>
    ['dashboard', 'summary', params] as const,
}

export function useDashboardSummary(params: DashboardSummaryParams) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => getDashboardSummary(params),
    placeholderData: keepPreviousData,
  })
}

export function toMonthRange(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { from: toDateParam(first), to: toDateParam(last) }
}

function toDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
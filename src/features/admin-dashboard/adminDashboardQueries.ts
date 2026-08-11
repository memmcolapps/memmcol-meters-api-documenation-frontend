import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type AdminDashboardRecentLog = {
  id: string
  organisationName?: string | null
  organisation?: { id: string; name?: string | null } | null
  organization?: { id: string; name?: string | null } | null
  requestTime?: string | null
  apiName?: string | null
  api?: { id: string; name?: string | null } | null
  code?: number | null
  response?: string | null
}

export type AdminDashboardSummary = {
  totalOrganisations: number
  totalMeters: number
  totalActivePlans: number
  totalRevenue: number
  currency: string
  meterCountByIntegration: Array<{
    meterIntegrationId: string
    label: string
    count: number
  }>
  apiUsageBreakdown: Array<{
    apiId: string
    name: string
    calls: number
    percentage: number
  }>
  recentLogs: AdminDashboardRecentLog[]
  serviceHealth: {
    uptimePercentage: number
    averageResponseTimeMs: number
    points: Array<{
      timestamp: string
      uptimePercentage: number
      averageResponseTimeMs: number
    }>
  }
}

type AdminDashboardSummaryResponse = {
  summary: AdminDashboardSummary
}

export type AdminDashboardSummaryParams = {
  from: string
  to: string
}

export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
  summary: (params: AdminDashboardSummaryParams) =>
    ['admin-dashboard', 'summary', params] as const,
}

function getAdminDashboardSummary(params: AdminDashboardSummaryParams) {
  const query = new URLSearchParams({ from: params.from, to: params.to })
  return apiRequest<AdminDashboardSummaryResponse>(
    `/admin/dashboard/summary?${query.toString()}`,
  )
}

export function useAdminDashboardSummary(
  params: AdminDashboardSummaryParams,
) {
  return useQuery({
    queryKey: adminDashboardKeys.summary(params),
    queryFn: async () => (await getAdminDashboardSummary(params)).summary,
  })
}

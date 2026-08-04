import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type AdminAuditLogSortOrder = 'asc' | 'desc'

export type AdminAuditLogActor = {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

export type AdminAuditLogTarget = {
  type?: string | null
  id?: string | null
}

export type AdminAuditLog = {
  id: string
  actor?: AdminAuditLogActor | null
  action?: string | null
  activity?: string | null
  target?: AdminAuditLogTarget | null
  userAgent?: string | null
  ipAddress?: string | null
  requestId?: string | null
  createdAt?: string | null
}

export type AdminAuditLogListParams = {
  search?: string
  actorId?: string
  role?: string
  action?: string
  from?: string
  to?: string
  page: number
  limit: number
  sortOrder?: AdminAuditLogSortOrder
}

export type AdminAuditLogListResponse = {
  items: AdminAuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const adminAuditLogKeys = {
  all: ['admin-audit-logs'] as const,
  lists: () => ['admin-audit-logs', 'list'] as const,
  list: (params: AdminAuditLogListParams) =>
    ['admin-audit-logs', 'list', params] as const,
}

function listAdminAuditLogs(params: AdminAuditLogListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search) query.set('search', params.search)
  if (params.actorId) query.set('actorId', params.actorId)
  if (params.role) query.set('role', params.role)
  if (params.action) query.set('action', params.action)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  return apiRequest<AdminAuditLogListResponse>(
    `/admin/audit-logs?${query.toString()}`,
  )
}

export function useAdminAuditLogs(params: AdminAuditLogListParams) {
  return useQuery({
    queryKey: adminAuditLogKeys.list(params),
    queryFn: () => listAdminAuditLogs(params),
    placeholderData: keepPreviousData,
  })
}

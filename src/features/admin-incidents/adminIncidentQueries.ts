import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type ResolvedIncident = {
  id: string
  status: 'RESOLVED'
  resolution: string
  resolvedBy: {
    id: string
    name: string
  }
  resolvedAt: string
  updatedAt: string
}

export type ResolveIncidentInput = {
  incidentId: string
  resolution: string
}

export type AdminIncidentStatus = 'UNRESOLVED' | 'RESOLVED'
export type AdminIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AdminIncidentSortOrder = 'asc' | 'desc'

export type AdminIncidentOrganisation = {
  id?: string | null
  name?: string | null
  businessName?: string | null
}

/**
 * Incident list payloads are external input. Fields that are not required to
 * perform an action stay optional so one incomplete row can render with
 * placeholders instead of taking down the entire route.
 */
export type AdminIncident = {
  id: string
  title?: string | null
  organisation?: AdminIncidentOrganisation | null
  organization?: AdminIncidentOrganisation | null
  organisationName?: string | null
  organizationName?: string | null
  company?: string | null
  severity?: AdminIncidentSeverity | null
  status?: AdminIncidentStatus | null
  requestId?: string | null
  detectedAt?: string | null
  resolvedAt?: string | null
  resolvedBy?: {
    id?: string | null
    name?: string | null
  } | null
}

export type AdminIncidentListParams = {
  search?: string
  organisationId?: string
  status?: AdminIncidentStatus
  severity?: AdminIncidentSeverity
  from?: string
  to?: string
  page: number
  limit: number
  sortOrder?: AdminIncidentSortOrder
}

export type AdminIncidentListResponse = {
  items: AdminIncident[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type ResolveIncidentResponse = {
  incident: ResolvedIncident
}

type IncidentErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export const adminIncidentKeys = {
  all: ['admin-incidents'] as const,
  lists: () => ['admin-incidents', 'list'] as const,
  list: (params: AdminIncidentListParams) =>
    ['admin-incidents', 'list', params] as const,
}

function listAdminIncidents(params: AdminIncidentListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) query.set('search', params.search)
  if (params.organisationId) query.set('organisationId', params.organisationId)
  if (params.status) query.set('status', params.status)
  if (params.severity) query.set('severity', params.severity)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  return apiRequest<AdminIncidentListResponse>(
    `/admin/incidents?${query.toString()}`,
  )
}

async function resolveIncident(input: ResolveIncidentInput) {
  const response = await apiRequest<ResolveIncidentResponse>(
    `/admin/incidents/${encodeURIComponent(input.incidentId)}/resolve`,
    {
      method: 'PATCH',
      json: { resolution: input.resolution },
    },
  )
  return response.incident
}

export function useResolveIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resolveIncident,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminIncidentKeys.all })
    },
  })
}

export function useAdminIncidents(params: AdminIncidentListParams) {
  return useQuery({
    queryKey: adminIncidentKeys.list(params),
    queryFn: () => listAdminIncidents(params),
    placeholderData: keepPreviousData,
  })
}

export function getResolveIncidentError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as IncidentErrorPayload | undefined
    : undefined

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The incident could not be resolved.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

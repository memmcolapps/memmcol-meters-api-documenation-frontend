import { useMutation, useQueryClient } from '@tanstack/react-query'
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

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
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

export type MeterIntegration = {
  id: string
  manufacturer: string
  model: string
  class: string
  category: string
  protocol: string
  authenticationType: string
  description: string
  status: 'ACTIVE' | 'DEPRECATED'
  obisCodeCount: number
  addedBy: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

type CreateMeterIntegrationResponse = {
  meterIntegration: MeterIntegration
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

export const meterIntegrationKeys = {
  detail: (id: string) => ['admin-meter-integrations', 'detail', id] as const,
}

export function useCreateMeterIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeterIntegration,
    onSuccess: (integration) => {
      queryClient.setQueryData(
        meterIntegrationKeys.detail(integration.id),
        integration,
      )
    },
  })
}

export function getCachedMeterIntegration(
  queryClient: QueryClient,
  id: string,
) {
  return queryClient.getQueryData<MeterIntegration>(
    meterIntegrationKeys.detail(id),
  )
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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type MeterKeyChange = {
  oldSgc: number
  newSgc: number
  oldKrn: number
  newKrn: number
  oldTariffIndex: number
  newTariffIndex: number
}

export type CreateMeterInput = {
  meterNumber: string
  simNumber: string
  meterTypeId: string
  keyChange: MeterKeyChange
}

export type CreatedMeter = {
  id: string
  meterNumber: string
  simNumber: string
  manufacturer: string
  model: string
  meterClass: string
  status: 'ACTIVE' | 'DEACTIVATED'
  keyChange: MeterKeyChange
  createdAt: string
  updatedAt: string
}

type MeterErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export const meterKeys = {
  all: ['meters'] as const,
  lists: () => ['meters', 'list'] as const,
}

async function createMeter(input: CreateMeterInput) {
  return apiRequest<CreatedMeter>('/meters', {
    method: 'POST',
    json: input,
  })
}

export function useCreateMeter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meterKeys.lists() })
    },
  })
}

export function getCreateMeterError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterErrorPayload | undefined
    : undefined

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The meter could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

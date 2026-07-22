import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type MeterStatus = 'ACTIVE' | 'DEACTIVATED'

export type Meter = {
  id: string
  meterNumber: string
  simNumber: string
  manufacturer: string
  model: string
  meterClass: string
  status: MeterStatus
  createdAt: string
  updatedAt: string
}

export type MeterPagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type MeterListResponse = {
  items: Meter[]
  pagination: MeterPagination
}

export type MeterListParams = {
  page: number
  pageSize: number
  status?: MeterStatus
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  date?: string
}

export type UpdateMeterStatusInput = {
  status: MeterStatus
}

export type UpdateMeterStatusResponse = {
  id: string
  status: MeterStatus
  updatedAt: string
}

async function listMeters(params: MeterListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)
  if (params.date) query.set('date', params.date)

  return apiRequest<MeterListResponse>(`/meters?${query.toString()}`)
}

async function deleteMeter(id: string) {
  await apiRequest<void>(`/meters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function updateMeterStatus(id: string, input: UpdateMeterStatusInput) {
  return apiRequest<UpdateMeterStatusResponse>(
    `/meters/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      json: input,
    },
  )
}

export const meterKeys = {
  all: ['meters'] as const,
  lists: () => ['meters', 'list'] as const,
  list: (params: MeterListParams) => ['meters', 'list', params] as const,
}

export function useMeters(params: MeterListParams) {
  return useQuery({
    queryKey: meterKeys.list(params),
    queryFn: () => listMeters(params),
    placeholderData: keepPreviousData,
  })
}

export function useDeleteMeter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMeter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meterKeys.lists() })
    },
  })
}

export function useUpdateMeterStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MeterStatus }) =>
      updateMeterStatus(id, { status }),
    onSuccess: (response) => {
      queryClient.setQueryData<MeterListResponse | undefined>(
        meterKeys.lists(),
        (current) => {
          if (!current) return current
          return {
            ...current,
            items: current.items.map((meter) =>
              meter.id === response.id
                ? { ...meter, status: response.status, updatedAt: response.updatedAt }
                : meter,
            ),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: meterKeys.lists() })
    },
  })
}

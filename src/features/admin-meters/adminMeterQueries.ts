import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type CreateMeterIntegrationInput = {
  manufacturer: string
  model: string
  class: string
  category: string
  protocol: string
  authenticationType: string
  password: string
  description?: string
}

export type UpdateMeterIntegrationInput = CreateMeterIntegrationInput & {
  meterIntegrationId: string
}

export type ChangeMeterIntegrationStatusInput = {
  meterIntegrationId: string
  status: MeterIntegrationStatus
  reason?: string
}

export type MeterIntegrationStatus = 'ACTIVE' | 'DEPRECATED'

export type MeterIntegrationSummary = {
  id: string
  manufacturer: string
  model: string
  category?: string
  protocol: string
  authenticationType: string
  status: MeterIntegrationStatus
  statusReason?: string
  obisCodeCount: number
  addedBy: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export type MeterIntegration = MeterIntegrationSummary & {
  class: string
  category: string
  description: string
}

export type MeterIntegrationListParams = {
  search?: string
  status?: MeterIntegrationStatus
  manufacturer?: string
  page: number
  limit: number
}

export type MeterIntegrationListResponse = {
  items: MeterIntegrationSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreateObisCodeInput = {
  action: string
  code: string
  description?: string
}

export type UpdateObisCodeInput = CreateObisCodeInput & {
  obisCodeId: string
}

export type ObisCodeStatus = 'ACTIVE' | 'DEPRECATED'

export type ObisCode = {
  id: string
  meterIntegrationId?: string
  action: string
  code: string
  description: string
  status: ObisCodeStatus
  statusReason?: string
  addedBy?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export type ChangeObisCodeStatusInput = {
  obisCodeId: string
  status: ObisCodeStatus
  reason?: string
}

export type ObisCodeListParams = {
  search?: string
  status?: ObisCodeStatus
  page: number
  limit: number
}

export type ObisCodeListResponse = {
  items: ObisCode[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ObisUploadMode = 'append' | 'replace'

export type ObisUploadError = {
  row: number
  field: string
  message: string
}

export type ObisUpload = {
  id: string
  status: string
  mode: ObisUploadMode
  totalRows: number
  created: number
  updated: number
  failed: number
  errors: ObisUploadError[]
  uploadedAt: string
}

export type UploadObisCodesInput = {
  file: File
  mode: ObisUploadMode
}

type MeterIntegrationResponse = {
  meterIntegration: MeterIntegration
}

type MeterIntegrationUpdate = Pick<
  MeterIntegration,
  | 'id'
  | 'manufacturer'
  | 'model'
  | 'class'
  | 'category'
  | 'protocol'
  | 'authenticationType'
  | 'description'
  | 'status'
  | 'updatedAt'
>

type UpdateMeterIntegrationResponse = {
  meterIntegration: MeterIntegrationUpdate
}

type ChangeMeterIntegrationStatusResponse = {
  meterIntegration: Pick<
    MeterIntegration,
    'id' | 'status' | 'statusReason' | 'updatedAt'
  >
}

type CreateObisCodeResponse = {
  obisCode: ObisCode
}

type UpdateObisCodeResponse = {
  obisCode: Pick<
    ObisCode,
    | 'id'
    | 'meterIntegrationId'
    | 'action'
    | 'code'
    | 'description'
    | 'status'
    | 'updatedAt'
  >
}

type ChangeObisCodeStatusResponse = {
  obisCode: Pick<ObisCode, 'id' | 'status' | 'statusReason' | 'updatedAt'>
}

type UploadObisCodesResponse = {
  upload: ObisUpload
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
  const response = await apiRequest<MeterIntegrationResponse>(
    '/admin/meter-integrations',
    {
      method: 'POST',
      json: input,
    },
  )
  return response.meterIntegration
}

async function listMeterIntegrations(params: MeterIntegrationListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.manufacturer) query.set('manufacturer', params.manufacturer)

  return apiRequest<MeterIntegrationListResponse>(
    `/admin/meter-integrations?${query.toString()}`,
  )
}

async function getMeterIntegration(meterIntegrationId: string) {
  const response = await apiRequest<MeterIntegrationResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}`,
  )
  const integration = response.meterIntegration as MeterIntegration &
    Record<string, unknown>

  return {
    ...integration,
    class: typeof integration.class === 'string'
      ? integration.class
      : typeof integration.meterClass === 'string'
        ? integration.meterClass
        : '',
    category: typeof integration.category === 'string'
      ? integration.category
      : typeof integration.meterCategory === 'string'
        ? integration.meterCategory
        : '',
  }
}

async function updateMeterIntegration(input: UpdateMeterIntegrationInput) {
  const { meterIntegrationId, ...updates } = input
  const response = await apiRequest<UpdateMeterIntegrationResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}`,
    {
      method: 'PATCH',
      json: updates,
    },
  )
  return response.meterIntegration
}

async function changeMeterIntegrationStatus(
  input: ChangeMeterIntegrationStatusInput,
) {
  const { meterIntegrationId, status, reason } = input
  const response = await apiRequest<ChangeMeterIntegrationStatusResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/status`,
    {
      method: 'PATCH',
      json: {
        status,
        ...(reason ? { reason } : {}),
      },
    },
  )
  return response.meterIntegration
}

async function listOrganisationMeterIntegrations() {
  const response = await apiRequest<unknown>(
    '/organisation/meter-integration',
  )
  const payload = (
    response &&
    typeof response === 'object' &&
    'data' in response
  )
    ? response.data
    : response

  if (Array.isArray(payload)) {
    return payload as MeterIntegrationSummary[]
  }

  if (payload && typeof payload === 'object') {
    for (const key of ['items', 'meterIntegrations', 'meterIntegration', 'content']) {
      const integrations = (payload as Record<string, unknown>)[key]
      if (Array.isArray(integrations)) {
        return integrations as MeterIntegrationSummary[]
      }
    }
  }

  throw new Error('The meter integrations response has an invalid format.')
}

async function createObisCode(
  meterIntegrationId: string,
  input: CreateObisCodeInput,
) {
  const response = await apiRequest<CreateObisCodeResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes`,
    {
      method: 'POST',
      json: input,
    },
  )
  return response.obisCode
}

async function listObisCodes(
  meterIntegrationId: string,
  params: ObisCodeListParams,
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)

  return apiRequest<ObisCodeListResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes?${query.toString()}`,
  )
}

async function updateObisCode(
  meterIntegrationId: string,
  input: UpdateObisCodeInput,
) {
  const response = await apiRequest<UpdateObisCodeResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes/${encodeURIComponent(input.obisCodeId)}`,
    {
      method: 'PATCH',
      json: {
        action: input.action,
        code: input.code,
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
      },
    },
  )
  return response.obisCode
}

async function changeObisCodeStatus(
  meterIntegrationId: string,
  input: ChangeObisCodeStatusInput,
) {
  const response = await apiRequest<ChangeObisCodeStatusResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes/${encodeURIComponent(input.obisCodeId)}/status`,
    {
      method: 'PATCH',
      json: {
        status: input.status,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    },
  )
  return response.obisCode
}

async function uploadObisCodes(
  meterIntegrationId: string,
  input: UploadObisCodesInput,
) {
  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('mode', input.mode)

  const response = await apiRequest<UploadObisCodesResponse>(
    `/admin/meter-integrations/${encodeURIComponent(meterIntegrationId)}/obis-codes/upload`,
    {
      method: 'POST',
      formData,
    },
  )
  return response.upload
}

export const meterIntegrationKeys = {
  all: ['admin-meter-integrations'] as const,
  lists: () => ['admin-meter-integrations', 'list'] as const,
  options: () => ['admin-meter-integrations', 'options'] as const,
  list: (params: MeterIntegrationListParams) =>
    ['admin-meter-integrations', 'list', params] as const,
  detail: (id: string) => ['admin-meter-integrations', 'detail', id] as const,
  obisCodes: (id: string) => ['admin-meter-integrations', 'detail', id, 'obis-codes'] as const,
  obisCodeList: (id: string, params: ObisCodeListParams) =>
    [...meterIntegrationKeys.obisCodes(id), params] as const,
}

export function useCreateMeterIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeterIntegration,
    onSuccess: async (integration) => {
      queryClient.setQueryData(
        meterIntegrationKeys.detail(integration.id),
        integration,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.options() }),
      ])
    },
  })
}

export function useMeterIntegrations(params: MeterIntegrationListParams) {
  return useQuery({
    queryKey: meterIntegrationKeys.list(params),
    queryFn: () => listMeterIntegrations(params),
    placeholderData: keepPreviousData,
  })
}

export function useMeterIntegration(meterIntegrationId: string) {
  return useQuery({
    queryKey: meterIntegrationKeys.detail(meterIntegrationId),
    queryFn: () => getMeterIntegration(meterIntegrationId),
    refetchOnMount: 'always',
  })
}

export function useUpdateMeterIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMeterIntegration,
    onSuccess: async (integration) => {
      queryClient.setQueryData<MeterIntegration | undefined>(
        meterIntegrationKeys.detail(integration.id),
        (current) => current ? { ...current, ...integration } : current,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.options() }),
      ])
    },
  })
}

export function useChangeMeterIntegrationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: changeMeterIntegrationStatus,
    onSuccess: async (integration) => {
      queryClient.setQueryData<MeterIntegration | undefined>(
        meterIntegrationKeys.detail(integration.id),
        (current) => current ? { ...current, ...integration } : current,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.options() }),
      ])
    },
  })
}

export function useActiveMeterIntegrationOptions() {
  return useQuery({
    queryKey: meterIntegrationKeys.options(),
    queryFn: async () => {
      const integrations = await listOrganisationMeterIntegrations()
      return integrations.filter((integration) => integration.status === 'ACTIVE')
    },
  })
}

export function useCreateObisCode(meterIntegrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateObisCodeInput) =>
      createObisCode(meterIntegrationId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: meterIntegrationKeys.obisCodes(meterIntegrationId),
      })
    },
  })
}

export function useObisCodes(
  meterIntegrationId: string,
  params: ObisCodeListParams,
) {
  return useQuery({
    queryKey: meterIntegrationKeys.obisCodeList(meterIntegrationId, params),
    queryFn: () => listObisCodes(meterIntegrationId, params),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateObisCode(meterIntegrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateObisCodeInput) =>
      updateObisCode(meterIntegrationId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: meterIntegrationKeys.obisCodes(meterIntegrationId),
      })
    },
  })
}

export function useChangeObisCodeStatus(meterIntegrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ChangeObisCodeStatusInput) =>
      changeObisCodeStatus(meterIntegrationId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: meterIntegrationKeys.obisCodes(meterIntegrationId),
      })
    },
  })
}

export function useUploadObisCodes(meterIntegrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UploadObisCodesInput) =>
      uploadObisCodes(meterIntegrationId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: meterIntegrationKeys.obisCodes(meterIntegrationId),
        }),
        queryClient.invalidateQueries({ queryKey: meterIntegrationKeys.lists() }),
      ])
    },
  })
}

export function getMeterIntegrationError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The meter integration could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getObisCodeError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The OBIS code could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getObisCodeStatusError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The OBIS code status could not be changed.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getObisCodeUpdateError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The OBIS code could not be updated.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getObisUploadError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as MeterIntegrationErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The OBIS codes could not be uploaded.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

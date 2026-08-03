import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type AdminOrganisationStatus = 'ACTIVE' | 'SUSPENDED'
export type AdminOrganisationSortBy =
  | 'businessName'
  | 'creditBalance'
  | 'createdAt'
export type AdminOrganisationSortOrder = 'asc' | 'desc'

/**
 * The API has been observed omitting `owner` (and fields within it) for
 * organizations whose owner record is missing, so every display field is
 * treated as optional. Rendering must degrade to a placeholder rather than
 * throw — a single malformed row must not take the whole route down.
 */
export type AdminOrganisationOwner = {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  dialCode?: string | null
  phone?: string | null
}

export type AdminOrganisation = {
  id: string
  businessName?: string | null
  owner?: AdminOrganisationOwner | null
  creditBalance?: number | null
  status?: AdminOrganisationStatus | null
  createdAt?: string | null
}

export type AdminOrganisationListParams = {
  search?: string
  status?: AdminOrganisationStatus
  page: number
  limit: number
  sortBy?: AdminOrganisationSortBy
  sortOrder?: AdminOrganisationSortOrder
}

export type AdminOrganisationListResponse = {
  items: AdminOrganisation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ChangeAdminOrganisationStatusInput = {
  organisationId: string
  status: AdminOrganisationStatus
  reason?: string
}

export type AdminOrganisationStatusUpdate = {
  id: string
  status: AdminOrganisationStatus
  statusReason?: string
  updatedAt: string
}

type ChangeAdminOrganisationStatusResponse = {
  organisation: AdminOrganisationStatusUpdate
}

type AdminOrganisationErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export const adminOrganisationKeys = {
  all: ['admin-organisations'] as const,
  lists: () => ['admin-organisations', 'list'] as const,
  list: (params: AdminOrganisationListParams) =>
    ['admin-organisations', 'list', params] as const,
}

function listAdminOrganisations(params: AdminOrganisationListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  return apiRequest<AdminOrganisationListResponse>(
    `/admin/organisations?${query.toString()}`,
  )
}

async function changeAdminOrganisationStatus(
  input: ChangeAdminOrganisationStatusInput,
) {
  const response = await apiRequest<ChangeAdminOrganisationStatusResponse>(
    `/admin/organisations/${encodeURIComponent(input.organisationId)}/status`,
    {
      method: 'PATCH',
      json: {
        status: input.status,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    },
  )

  return response.organisation
}

export function useAdminOrganisations(params: AdminOrganisationListParams) {
  return useQuery({
    queryKey: adminOrganisationKeys.list(params),
    queryFn: () => listAdminOrganisations(params),
    placeholderData: keepPreviousData,
  })
}

export function useChangeAdminOrganisationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: changeAdminOrganisationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminOrganisationKeys.lists(),
      })
    },
  })
}

export function getAdminOrganisationStatusError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as AdminOrganisationErrorPayload | undefined
    : undefined

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message:
      payload?.error?.message ??
      (error instanceof Error
        ? error.message
        : 'The organization status could not be changed.'),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'

export type BillingPlanStatus = 'ACTIVE' | 'INACTIVE'

export type BillingPlan = {
  id: string
  name: string
  description: string
  amount: number
  credits: number
  features: string[]
  cta: string
  status: BillingPlanStatus
  createdBy?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export type CreateBillingPlanInput = Pick<
  BillingPlan,
  'name' | 'description' | 'amount' | 'credits' | 'features' | 'cta' | 'status'
>

export type ChangeBillingPlanStatusInput = {
  planId: string
  status: BillingPlanStatus
  reason?: string
}

export type UpdateBillingPlanInput = CreateBillingPlanInput & {
  planId: string
}

export type BillingPlanUpdate = CreateBillingPlanInput & Pick<
  BillingPlan,
  'id' | 'updatedAt'
>

export type BillingPlanStatusUpdate = Pick<
  BillingPlan,
  'id' | 'status' | 'updatedAt'
> & {
  statusReason?: string
}

type CreateBillingPlanResponse = {
  plan: BillingPlan
}

type ChangeBillingPlanStatusResponse = {
  plan: BillingPlanStatusUpdate
}

type UpdateBillingPlanResponse = {
  plan: BillingPlanUpdate
}

type BillingPlanListResponse =
  | BillingPlan[]
  | { plans: BillingPlan[] }
  | { items: BillingPlan[] }

export type AdminBillingPlanListParams = {
  search?: string
  status?: BillingPlanStatus
  page: number
  limit: number
}

export type AdminBillingPlanListResponse = {
  items: BillingPlan[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type BillingPlanErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export const billingPlanKeys = {
  all: ['billing-plans'] as const,
  adminLists: () => ['billing-plans', 'admin-list'] as const,
  adminList: (params: AdminBillingPlanListParams) =>
    ['billing-plans', 'admin-list', params] as const,
  detail: (id: string) => ['billing-plans', 'detail', id] as const,
  active: () => ['billing-plans', 'active'] as const,
}

async function createBillingPlan(input: CreateBillingPlanInput) {
  const response = await apiRequest<CreateBillingPlanResponse>(
    '/admin/billing/plans',
    {
      method: 'POST',
      json: input,
    },
  )
  return response.plan
}

async function listAdminBillingPlans(params: AdminBillingPlanListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)

  return apiRequest<AdminBillingPlanListResponse>(
    `/admin/billing/plans?${query.toString()}`,
  )
}

async function updateBillingPlan(input: UpdateBillingPlanInput) {
  const { planId, ...plan } = input
  const response = await apiRequest<UpdateBillingPlanResponse>(
    `/admin/billing/plans/${encodeURIComponent(planId)}`,
    {
      method: 'PATCH',
      json: plan,
    },
  )
  return response.plan
}

async function listActiveBillingPlans() {
  const response = await apiRequest<BillingPlanListResponse>('/billing/plans')
  const plans = Array.isArray(response)
    ? response
    : 'plans' in response
      ? response.plans
      : response.items
  return plans.filter((plan) => plan.status === 'ACTIVE')
}

async function changeBillingPlanStatus(input: ChangeBillingPlanStatusInput) {
  const response = await apiRequest<ChangeBillingPlanStatusResponse>(
    `/admin/billing/plans/${encodeURIComponent(input.planId)}/status`,
    {
      method: 'PATCH',
      json: {
        status: input.status,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    },
  )
  return response.plan
}

export function useCreateBillingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBillingPlan,
    onSuccess: async (plan) => {
      queryClient.setQueryData(billingPlanKeys.detail(plan.id), plan)
      queryClient.setQueryData<BillingPlan[]>(
        billingPlanKeys.active(),
        (current) => {
          if (!current) return current
          return plan.status === 'ACTIVE'
            ? [...current.filter((item) => item.id !== plan.id), plan]
            : current.filter((item) => item.id !== plan.id)
        },
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingPlanKeys.adminLists() }),
        queryClient.invalidateQueries({ queryKey: billingPlanKeys.active() }),
      ])
    },
  })
}

export function useAdminBillingPlans(params: AdminBillingPlanListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: billingPlanKeys.adminList(params),
    queryFn: async () => {
      const response = await listAdminBillingPlans(params)
      response.items.forEach((plan) => {
        queryClient.setQueryData(billingPlanKeys.detail(plan.id), plan)
      })
      return response
    },
    placeholderData: keepPreviousData,
  })
}

export function useUpdateBillingPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateBillingPlan,
    onSuccess: async (plan) => {
      queryClient.setQueryData<BillingPlan>(
        billingPlanKeys.detail(plan.id),
        (current) => current ? { ...current, ...plan } : current,
      )
      queryClient.setQueryData<BillingPlan[]>(
        billingPlanKeys.active(),
        (current) => {
          if (!current) return current
          if (plan.status === 'INACTIVE') {
            return current.filter((item) => item.id !== plan.id)
          }
          return current.map((item) => item.id === plan.id
            ? { ...item, ...plan }
            : item)
        },
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingPlanKeys.adminLists() }),
        queryClient.invalidateQueries({ queryKey: billingPlanKeys.active() }),
      ])
    },
  })
}

export function useActiveBillingPlans() {
  return useQuery({
    queryKey: billingPlanKeys.active(),
    queryFn: listActiveBillingPlans,
  })
}

export function useChangeBillingPlanStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: changeBillingPlanStatus,
    onSuccess: async (plan) => {
      queryClient.setQueryData<BillingPlan>(
        billingPlanKeys.detail(plan.id),
        (current) => current ? { ...current, ...plan } : current,
      )
      if (plan.status === 'INACTIVE') {
        queryClient.setQueryData<BillingPlan[]>(
          billingPlanKeys.active(),
          (current) => current?.filter((item) => item.id !== plan.id),
        )
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billingPlanKeys.adminLists() }),
        queryClient.invalidateQueries({ queryKey: billingPlanKeys.active() }),
      ])
    },
  })
}

export function getBillingPlanError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as BillingPlanErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The billing plan could not be created.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getBillingPlanStatusError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as BillingPlanErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The plan status could not be changed.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getBillingPlanUpdateError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as BillingPlanErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'The billing plan could not be updated.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

export function getCachedBillingPlan(queryClient: QueryClient, id: string) {
  return queryClient.getQueryData<BillingPlan>(billingPlanKeys.detail(id))
}

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ApiError, apiRequest } from '../../lib/api/client'
import { billingPlanKeys } from './billingPlanQueries'

/**
 * A purchase opens as PENDING and becomes PAID once the provider confirms
 * payment. Widen this if failure/cancellation statuses become observable.
 */
export type BillingPurchaseStatus = 'PENDING' | 'PAID'

export type CreditMovementSource =
  | 'CUSTOMER_PURCHASE'
  | 'ADMIN_ADJUSTMENT'
  | 'ENTERPRISE_AGREEMENT'

export type StartBillingPurchaseInput = {
  planId: string
}

/** Plan name, amount, and credits are snapshotted at time of purchase. */
export type BillingPurchase = {
  id: string
  planId: string
  planName: string
  credits: number
  amount: number
  status: BillingPurchaseStatus
  createdAt: string
}

export type BillingCheckout = {
  provider: string
  checkoutUrl: string
  reference: string
}

export type StartBillingPurchaseResponse = {
  purchase: BillingPurchase
  checkout: BillingCheckout
}

export type CreditMovement = {
  id: string
  source: CreditMovementSource
  label: string
  credits: number
  /** Absent for movements with no money attached, such as admin adjustments. */
  amount?: number | null
  createdAt: string
}

export type BillingAccountSnapshot = {
  creditBalance: number
  hasCreditHistory: boolean
  lastCreditMovement: CreditMovement | null
}

export type BillingPurchaseDetail = BillingPurchase & {
  paymentReference: string
  /** Null until the payment is confirmed. */
  paidAt: string | null
}

export type BillingPurchaseStatusResponse = {
  purchase: BillingPurchaseDetail
  account: BillingAccountSnapshot
}

export type AdminBillingPurchase = {
  id: string
  organisation: {
    id: string
    name: string
  }
  plan: {
    id: string
    name: string
  }
  credits: number
  amount: number
  status: BillingPurchaseStatus
  paymentReference: string
  createdAt: string
  paidAt: string | null
}

export type AdminBillingPurchaseListParams = {
  organisationId?: string
  status?: BillingPurchaseStatus
  from?: string
  to?: string
  page: number
  limit: number
}

export type AdminBillingPurchaseListResponse = {
  items: AdminBillingPurchase[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type BillingPurchaseErrorPayload = {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
    requestId?: string
  }
}

export const billingPurchaseKeys = {
  all: ['billing-purchases'] as const,
  adminLists: () => ['billing-purchases', 'admin-list'] as const,
  adminList: (params: AdminBillingPurchaseListParams) =>
    ['billing-purchases', 'admin-list', params] as const,
  detail: (id: string) => ['billing-purchases', 'detail', id] as const,
}

/** Codes that mean the cached plan list is stale and should be refetched. */
const stalePlanErrorCodes = new Set(['PLAN_INACTIVE', 'PLAN_NOT_FOUND'])

/** How often a still-pending purchase is re-checked while the page is open. */
const PURCHASE_POLL_INTERVAL = 5_000

function getBillingPurchase(purchaseId: string) {
  return apiRequest<BillingPurchaseStatusResponse>(
    `/billing/purchases/${encodeURIComponent(purchaseId)}`,
  )
}

function listAdminBillingPurchases(params: AdminBillingPurchaseListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.organisationId) {
    query.set('organisationId', params.organisationId)
  }
  if (params.status) query.set('status', params.status)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)

  return apiRequest<AdminBillingPurchaseListResponse>(
    `/admin/billing/purchases?${query.toString()}`,
  )
}

/**
 * Reads a purchase after the customer returns from checkout. Payment is
 * confirmed out of band, so a pending purchase is polled until it settles.
 * The API scopes purchases to the caller's organisation and 404s anything
 * else, so an unknown id is a dead end rather than something to retry.
 */
export function useBillingPurchase(purchaseId: string | undefined) {
  return useQuery({
    queryKey: billingPurchaseKeys.detail(purchaseId ?? ''),
    queryFn: () => getBillingPurchase(purchaseId as string),
    enabled: Boolean(purchaseId),
    refetchInterval: (query) =>
      query.state.data?.purchase.status === 'PENDING'
        ? PURCHASE_POLL_INTERVAL
        : false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 3
    },
  })
}

export function useAdminBillingPurchases(
  params: AdminBillingPurchaseListParams,
) {
  return useQuery({
    queryKey: billingPurchaseKeys.adminList(params),
    queryFn: () => listAdminBillingPurchases(params),
    placeholderData: keepPreviousData,
  })
}

async function startBillingPurchase(input: StartBillingPurchaseInput) {
  return apiRequest<StartBillingPurchaseResponse>('/billing/purchases', {
    method: 'POST',
    json: { planId: input.planId },
  })
}

export function useStartBillingPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startBillingPurchase,
    onError: async (error) => {
      // A rejected plan means our cached list no longer matches the server.
      if (stalePlanErrorCodes.has(getBillingPurchaseError(error).code ?? '')) {
        await queryClient.invalidateQueries({ queryKey: billingPlanKeys.active() })
      }
    },
  })
}

export function getBillingPurchaseError(error: unknown) {
  const payload = error instanceof ApiError
    ? error.details as BillingPurchaseErrorPayload | undefined
    : undefined

  return {
    code: payload?.error?.code,
    message: payload?.error?.message ?? (
      error instanceof Error ? error.message : 'This purchase could not be processed.'
    ),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  }
}

/**
 * The checkout URL comes from the API and is handed to `window.location`, so
 * only allow the http(s) schemes a payment provider can legitimately use.
 */
export function isSafeCheckoutUrl(checkoutUrl: string) {
  try {
    const { protocol } = new URL(checkoutUrl)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type CreditMovementSource =
  | 'CUSTOMER_PURCHASE'
  | 'ADMIN_ADJUSTMENT'
  | 'ENTERPRISE_AGREEMENT'

export type BillingOverviewMovement = {
  id: string
  source: CreditMovementSource
  label: string
  credits: number
  amount?: number | null
  createdAt: string
}

export type BillingCreditHistoryEntry = BillingOverviewMovement & {
  balanceAfter: number
}

export type BillingOverviewPlan = {
  id: string
  name: string
  description: string
  amount: number
  credits: number
  features: string[]
  cta: string
  status: 'ACTIVE'
}

export type BillingOverview = {
  account: {
    creditBalance: number
    creditsUsedThisMonth: number
    lowBalanceThreshold: number
    hasCreditHistory: boolean
    lastCreditMovement: BillingOverviewMovement | null
  }
  plans: BillingOverviewPlan[]
  creditHistory: BillingCreditHistoryEntry[]
}

export const billingOverviewKeys = {
  all: ['billing-overview'] as const,
  overview: () => ['billing-overview', 'detail'] as const,
}

function getBillingOverview() {
  // Organisation scope comes exclusively from the authenticated session.
  return apiRequest<BillingOverview>('/billing')
}

export function useBillingOverview() {
  return useQuery({
    queryKey: billingOverviewKeys.overview(),
    queryFn: getBillingOverview,
  })
}

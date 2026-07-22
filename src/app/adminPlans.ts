import type { BillingPlanStatus } from '../features/billing/billingPlanQueries'

export type PlanStatus = BillingPlanStatus

export type Plan = {
  id: string
  name: string
  description: string
  credits: number
  amount: number
  features: string[]
  status: PlanStatus
  cta: string
  addedDate: string
}

export type PlanFormValues = Omit<Plan, 'id' | 'addedDate'>
export type PlanFormField = keyof PlanFormValues

export const ctaOptions = ['Buy Plan', 'Get Started', 'Contact Sales', 'Subscribe']

const defaultFeatures = [
  '₦5 per call',
  '100,000 request calls',
  'Prioritized support on tickets',
  'API key access integrations',
  'Volume discounts',
]

function makePlan(
  overrides: Partial<Plan> & Pick<Plan, 'id' | 'name' | 'credits' | 'amount'>,
): Plan {
  return {
    description: 'Great for small businesses',
    features: defaultFeatures,
    status: 'ACTIVE',
    cta: 'Buy Plan',
    addedDate: '17-02-2026',
    ...overrides,
  }
}

/**
 * Seed catalog for the admin subscription screens.
 * Fed by the API later; shared so the list and detail pages agree.
 */
export const seededPlans: Plan[] = [
  makePlan({ id: 'plan-1', name: 'Basic', credits: 25_000, amount: 250_000 }),
  makePlan({ id: 'plan-2', name: 'Standard', credits: 50_000, amount: 500_000 }),
  makePlan({
    id: 'plan-3',
    name: 'Pay as you go',
    credits: 100_000,
    amount: 1_000_000,
    status: 'INACTIVE',
  }),
  makePlan({
    id: 'plan-4',
    name: 'Enterprise',
    credits: 500_000,
    amount: 5_000_000,
  }),
]

export type PlanStatus = 'Active' | 'Inactive'

export type Plan = {
  id: string
  name: string
  description: string
  credits: string
  amount: string
  features: string[]
  status: PlanStatus
  cta: string
  addedDate: string
}

export type PlanFormValues = Omit<Plan, 'id' | 'addedDate'>

export const ctaOptions = ['Get Started', 'Contact Sales', 'Subscribe']

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
    status: 'Active',
    cta: 'Get Started',
    addedDate: '17-02-2026',
    ...overrides,
  }
}

/**
 * Seed catalog for the admin subscription screens.
 * Fed by the API later; shared so the list and detail pages agree.
 */
export const seededPlans: Plan[] = [
  makePlan({ id: 'plan-1', name: 'Basic', credits: '25,000', amount: '250,000' }),
  makePlan({ id: 'plan-2', name: 'Standard', credits: '50,000', amount: '500,000' }),
  makePlan({
    id: 'plan-3',
    name: 'Pay as you go',
    credits: '100,000',
    amount: '1,000,000',
    status: 'Inactive',
  }),
  makePlan({
    id: 'plan-4',
    name: 'Enterprise',
    credits: '500,000',
    amount: '5,000,000',
  }),
]

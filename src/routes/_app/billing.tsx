import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../app/useDismiss'
import { useAnchoredMenu } from '../../app/useAnchoredMenu'

export const Route = createFileRoute('/_app/billing')({
  component: BillingPage,
})

type Plan = {
  name: string
  description: string
  price?: string
  features: string[]
  cta: string
}

const plans: Plan[] = [
  {
    name: 'Basic Plan',
    description: 'Great for small enterprise looking to manage their facility',
    price: '₦ 300,000',
    features: [
      '500 API calls',
      '600/ API calls',
      '3 day support on tickets',
      'API key access for integrations',
    ],
    cta: 'Get started',
  },
  {
    name: 'Standard Plan',
    description: 'Great for medium enterprise looking to manage their facility',
    price: '₦ 500,000',
    features: [
      '1000 API calls',
      '500/ API calls',
      '3 day support on tickets',
      'API key access for integrations',
    ],
    cta: 'Get started',
  },
  {
    name: 'Enterprise Plan',
    description: 'Great for big enterprise looking to manage their facility',
    features: [
      'Flexible API calls',
      'API integration assistance',
      'Prioritized support on tickets',
      'Volume Discounts',
    ],
    cta: 'Contact us',
  },
]

type ActivePlan = {
  plan: string
  startDate: string
  quota: string
}

// Starts with an active Basic subscription. Set to `null` to see the Plans view.
const initialActivePlan: ActivePlan = {
  plan: 'Basic',
  startDate: '12/05/2026',
  quota: '200/1000 Calls',
}

const formatToday = () =>
  new Date().toLocaleDateString('en-GB').replace(/\//g, '/')

function BillingPage() {
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(initialActivePlan)

  const subscribe = (plan: Plan) => {
    setActivePlan({
      plan: plan.name.replace(/ Plan$/, ''),
      startDate: formatToday(),
      quota: '0/1000 Calls',
    })
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Billing</h1>
        <p className="dash-subtitle">
          Manage your API subscriptions and choose the plan that best fits your
          needs.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          {activePlan ? 'Active Plan' : 'Plans'}
        </button>
      </div>

      {activePlan ? (
        <section className="table-wrap">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" aria-label="Select all rows" />
                  </th>
                  <th>S/N</th>
                  <th>Plan</th>
                  <th>Start Date</th>
                  <th>Quota Usage</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="col-check">
                    <input type="checkbox" aria-label="Select plan" />
                  </td>
                  <td>01</td>
                  <td>{activePlan.plan}</td>
                  <td>{activePlan.startDate}</td>
                  <td>{activePlan.quota}</td>
                  <td className="col-actions">
                    <PlanActions onUpgrade={() => setActivePlan(null)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="plans-grid">
          {plans.map((plan) => (
            <article className="plan-card" key={plan.name}>
              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-desc">{plan.description}</p>
              {plan.price ? (
                <p className="plan-price">{plan.price}</p>
              ) : (
                <div className="plan-price-spacer" />
              )}
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li className="plan-feature" key={feature}>
                    <CheckIcon /> {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn-primary btn-block plan-cta"
                onClick={() => subscribe(plan)}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

function PlanActions({ onUpgrade }: { onUpgrade: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)
  const { anchorRef, menuStyle } = useAnchoredMenu(open)

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="row-kebab"
        aria-label="Plan actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <KebabIcon />
      </button>
      {open ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <RenewIcon /> Renew Plan
          </button>
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onUpgrade}
          >
            <UpgradeIcon /> Upgrade Plan
          </button>
        </div>
      ) : null}
    </div>
  )
}

function RenewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

function UpgradeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19" />
      <path d="M12 16v-6m0 0-2.5 2.5M12 10l2.5 2.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="plan-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  )
}

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seededPlans, type Plan } from '../../app/adminPlans'

export const Route = createFileRoute('/_app/billing')({
  component: BillingPage,
})

type CreditLedgerEntry = {
  id: string
  source: 'customer_purchase' | 'admin_adjustment' | 'enterprise_agreement'
  label: string
  date: string
  credits: number
  amount?: number
}

type BillingAccount = {
  balance: number
  usedThisMonth: number
  ledger: CreditLedgerEntry[]
}

const LOW_BALANCE_THRESHOLD = 5_000

const initialAccount: BillingAccount = {
  balance: 3_250,
  usedThisMonth: 8_940,
  ledger: [
    {
      id: 'ledger-1',
      source: 'customer_purchase',
      label: 'Basic plan',
      date: '12/05/2026',
      credits: 25_000,
      amount: 250_000,
    },
  ],
}

const naira = (value: number) => `₦ ${value.toLocaleString('en-NG')}`

const formatToday = () => new Date().toLocaleDateString('en-GB')

const parsePlanNumber = (value: string) => Number(value.replaceAll(',', ''))

const activePlans = seededPlans.filter((plan) => plan.status === 'Active')

const sourceLabel = (source: CreditLedgerEntry['source']) => {
  switch (source) {
    case 'customer_purchase':
      return 'Customer purchase'
    case 'admin_adjustment':
      return 'Admin adjustment'
    case 'enterprise_agreement':
      return 'Enterprise agreement'
  }
}

function BillingPage() {
  const [account, setAccount] = useState(initialAccount)
  const [purchaseFlow, setPurchaseFlow] = useState<'idle' | 'selecting-plan'>(
    initialAccount.ledger.length > 0 ? 'idle' : 'selecting-plan',
  )

  const isBuying = purchaseFlow === 'selecting-plan'
  const hasCreditHistory = account.ledger.length > 0
  const lastCreditMovement = account.ledger[account.ledger.length - 1]

  const buy = (plan: Plan) => {
    const credits = parsePlanNumber(plan.credits)
    const amount = parsePlanNumber(plan.amount)
    if (!credits || !amount) return

    setAccount((value) => ({
      ...value,
      balance: value.balance + credits,
      ledger: [
        ...value.ledger,
        {
          id: `ledger-${Date.now()}`,
          source: 'customer_purchase',
          label: `${plan.name} plan`,
          date: formatToday(),
          credits,
          amount,
        },
      ],
    }))
    setPurchaseFlow('idle')
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Billing</h1>
          <p className="dash-subtitle">
            {isBuying
              ? 'Choose a credit plan for your organization.'
              : 'Track your organization credit balance, usage, and credit history.'}
          </p>
        </div>
        {!isBuying ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setPurchaseFlow('selecting-plan')}
          >
            Top up <PlusIcon />
          </button>
        ) : hasCreditHistory ? (
          <button
            type="button"
            className="filter-btn"
            onClick={() => setPurchaseFlow('idle')}
          >
            Back to Credits
          </button>
        ) : null}
      </header>

      {!isBuying ? (
        <section className="dash-stats">
          <article className="stat-card">
            <div className="stat-text">
              <p className="stat-label">Credit Balance</p>
              <p className="stat-value">
                {account.balance.toLocaleString()} <span className="stat-unit">credits</span>
                {account.balance < LOW_BALANCE_THRESHOLD ? (
                  <span className="balance-pill">Low balance</span>
                ) : null}
              </p>
            </div>
            <span className="stat-icon" aria-hidden="true">
              <WalletIcon />
            </span>
          </article>
          <article className="stat-card">
            <div className="stat-text">
              <p className="stat-label">Used This Month</p>
              <p className="stat-value">
                {account.usedThisMonth.toLocaleString()}{' '}
                <span className="stat-unit">credits</span>
              </p>
            </div>
            <span className="stat-icon" aria-hidden="true">
              <GaugeIcon />
            </span>
          </article>
          <article className="stat-card">
            <div className="stat-text">
              <p className="stat-label">Last Credit Movement</p>
              <p className="stat-value">
                {lastCreditMovement?.amount ? naira(lastCreditMovement.amount) : 'Manual'}{' '}
                <span className="stat-unit">on {lastCreditMovement?.date}</span>
              </p>
            </div>
            <span className="stat-icon" aria-hidden="true">
              <ReceiptIcon />
            </span>
          </article>
        </section>
      ) : null}

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          {isBuying ? 'Buy Credits' : 'Credits'}
        </button>
      </div>

      {isBuying ? (
        <section className="plans-grid plans-grid--bundles">
          {activePlans.map((plan, index) => (
            <article
              className={`plan-card${index === 1 ? ' plan-card--featured' : ''}`}
              key={plan.id}
            >
              <div className="plan-head">
                <h2 className="plan-name">{plan.name}</h2>
                {index === 1 ? (
                  <span className="plan-badge">Most popular</span>
                ) : null}
              </div>
              <p className="plan-desc">{plan.description}</p>
              <div className="plan-pricing">
                <p className="plan-price">{naira(parsePlanNumber(plan.amount))}</p>
                <p className="plan-rate">{plan.credits} credits</p>
              </div>
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
                onClick={() => buy(plan)}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </section>
      ) : (
        <section className="dash-panel">
          <h2 className="panel-title">Credit History</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Credits Added</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {account.ledger.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{entry.label}</td>
                    <td>{sourceLabel(entry.source)}</td>
                    <td>{entry.date}</td>
                    <td>{entry.credits.toLocaleString()}</td>
                    <td>{entry.amount ? naira(entry.amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
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

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H3" />
      <path d="M16.5 13.5h.01" />
    </svg>
  )
}

function GaugeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 19a9.5 9.5 0 1 1 15 0" />
      <path d="m12 13 3.5-4.5" />
      <circle cx="12" cy="13.5" r="1.4" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

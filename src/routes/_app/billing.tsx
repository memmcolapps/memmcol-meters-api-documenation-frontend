import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AsyncState } from '../../app/AsyncState'
import { useToast } from '../../app/toastContext'
import {
  useActiveBillingPlans,
  type BillingPlan,
} from '../../features/billing/billingPlanQueries'
import {
  getBillingPurchaseError,
  isSafeCheckoutUrl,
  useBillingPurchase,
  useStartBillingPurchase,
} from '../../features/billing/billingPurchaseQueries'

// Checkout returns the customer here with the purchase to report on.
const billingSearchSchema = z.object({
  purchase: z.string().optional(),
})

export const Route = createFileRoute('/_app/billing')({
  component: BillingPage,
  validateSearch: billingSearchSchema,
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

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB')
}

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
  const plansQuery = useActiveBillingPlans()
  const activePlans = plansQuery.data ?? []
  const startPurchase = useStartBillingPurchase()
  const { showToast } = useToast()
  const { purchase: purchaseId } = Route.useSearch()
  const purchaseQuery = useBillingPurchase(purchaseId)
  const account = initialAccount
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null)
  const [purchaseFlow, setPurchaseFlow] = useState<'idle' | 'selecting-plan'>(
    initialAccount.ledger.length > 0 ? 'idle' : 'selecting-plan',
  )

  const purchase = purchaseQuery.data?.purchase
  const snapshot = purchaseQuery.data?.account
  const isBuying = purchaseFlow === 'selecting-plan'

  // The account snapshot only arrives with a purchase, so the seeded values
  // still stand in everywhere else until an account endpoint exists.
  const balance = snapshot?.creditBalance ?? account.balance
  const hasCreditHistory = snapshot?.hasCreditHistory ?? account.ledger.length > 0
  const seededMovement = account.ledger[account.ledger.length - 1]
  const lastCreditMovement = snapshot?.lastCreditMovement
    ? {
        label: snapshot.lastCreditMovement.label,
        date: formatDate(snapshot.lastCreditMovement.createdAt),
        amount: snapshot.lastCreditMovement.amount ?? undefined,
      }
    : seededMovement

  const notifiedPurchase = useRef<string | null>(null)

  useEffect(() => {
    if (!purchase || purchase.status !== 'PAID') return
    if (notifiedPurchase.current === purchase.id) return
    notifiedPurchase.current = purchase.id
    showToast({
      title: 'Payment confirmed',
      message: `${purchase.credits.toLocaleString()} credits were added from your ${purchase.planName} plan.`,
      variant: 'success',
    })
  }, [purchase, showToast])

  const notifiedPurchaseError = useRef<unknown>(null)

  useEffect(() => {
    if (!purchaseQuery.error || notifiedPurchaseError.current === purchaseQuery.error) return
    notifiedPurchaseError.current = purchaseQuery.error
    const { code, message } = getBillingPurchaseError(purchaseQuery.error)
    showToast({
      title: code === 'PURCHASE_NOT_FOUND'
        ? 'Purchase not found'
        : 'Could not load your purchase',
      message,
      variant: 'error',
    })
  }, [purchaseQuery.error, showToast])

  // Credits are only granted once the provider confirms payment, so this hands
  // off to checkout rather than touching the local balance.
  const buy = async (plan: BillingPlan) => {
    setPurchasingPlanId(plan.id)
    try {
      const { checkout } = await startPurchase.mutateAsync({ planId: plan.id })

      if (!isSafeCheckoutUrl(checkout.checkoutUrl)) {
        showToast({
          title: 'Could not open checkout',
          message: 'The payment provider returned an invalid checkout link.',
          variant: 'error',
        })
        return
      }

      window.location.assign(checkout.checkoutUrl)
    } catch (error) {
      const { code, message, fields } = getBillingPurchaseError(error)
      showToast({
        title: code === 'PLAN_NOT_FOUND' || code === 'PLAN_INACTIVE'
          ? 'Plan is no longer available'
          : 'Could not start your purchase',
        message: fields.planId ?? message,
        variant: 'error',
      })
    } finally {
      setPurchasingPlanId(null)
    }
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

      {purchaseId && purchaseQuery.isPending ? (
        <div className="async-state" role="status" aria-live="polite">
          <span className="async-spinner" aria-hidden="true" />
          <p>Checking your payment…</p>
        </div>
      ) : null}

      {purchase?.status === 'PENDING' ? (
        <div className="async-state" role="status" aria-live="polite">
          <span className="async-spinner" aria-hidden="true" />
          <p>
            Waiting for {purchase.planName} payment to be confirmed. Credits are
            added as soon as it clears.
          </p>
        </div>
      ) : null}

      {purchaseQuery.error ? (
        <div className="async-state is-error" role="alert">
          <p>{getBillingPurchaseError(purchaseQuery.error).message}</p>
        </div>
      ) : null}

      {!isBuying ? (
        <section className="dash-stats">
          <article className="stat-card">
            <div className="stat-text">
              <p className="stat-label">Credit Balance</p>
              <p className="stat-value">
                {balance.toLocaleString()} <span className="stat-unit">credits</span>
                {balance < LOW_BALANCE_THRESHOLD ? (
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
        <AsyncState
          isPending={plansQuery.isPending}
          error={plansQuery.error}
          onRetry={() => void plansQuery.refetch()}
        >
          {activePlans.length > 0 ? (
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
                    <p className="plan-price">{naira(plan.amount)}</p>
                    <p className="plan-rate">{plan.credits.toLocaleString()} credits</p>
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
                    disabled={purchasingPlanId !== null}
                    onClick={() => void buy(plan)}
                  >
                    {purchasingPlanId === plan.id
                      ? 'Redirecting to checkout…'
                      : plan.cta}
                  </button>
                </article>
              ))}
            </section>
          ) : (
            <div className="meter-empty">
              <p className="meter-empty-text">No active credit plans are available.</p>
            </div>
          )}
        </AsyncState>
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

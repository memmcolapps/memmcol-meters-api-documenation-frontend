import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AsyncState } from '../../app/AsyncState'
import { useToast } from '../../app/toastContext'
import {
  billingOverviewKeys,
  useBillingOverview,
  type BillingOverviewPlan,
  type CreditMovementSource,
} from '../../features/billing/billingOverviewQueries'
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

const naira = (value: number) => `₦ ${value.toLocaleString('en-NG')}`

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB')
}

const sourceLabel = (source: CreditMovementSource) => {
  switch (source) {
    case 'CUSTOMER_PURCHASE':
      return 'Customer purchase'
    case 'ADMIN_ADJUSTMENT':
      return 'Admin adjustment'
    case 'ENTERPRISE_AGREEMENT':
      return 'Enterprise agreement'
  }
}

function BillingPage() {
  const queryClient = useQueryClient()
  const overviewQuery = useBillingOverview()
  const startPurchase = useStartBillingPurchase()
  const { showToast } = useToast()
  const { purchase: purchaseId } = Route.useSearch()
  const purchaseQuery = useBillingPurchase(purchaseId)
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'history' | 'buy' | null>(null)

  const purchase = purchaseQuery.data?.purchase
  const overview = overviewQuery.data
  const account = overview?.account
  const activePlans = (overview?.plans ?? []).filter((plan) => plan.status === 'ACTIVE')
  const creditHistory = overview?.creditHistory ?? []
  const defaultView = account?.hasCreditHistory ? 'history' : 'buy'
  const currentView = selectedView ?? defaultView
  const isBuying = currentView === 'buy'

  const notifiedPurchase = useRef<string | null>(null)

  useEffect(() => {
    if (!purchase || purchase.status !== 'PAID') return
    if (notifiedPurchase.current === purchase.id) return
    notifiedPurchase.current = purchase.id
    setSelectedView('history')
    void queryClient.invalidateQueries({ queryKey: billingOverviewKeys.all })
    showToast({
      title: 'Payment confirmed',
      message: `${purchase.credits.toLocaleString()} credits were added from your ${purchase.planName} plan.`,
      variant: 'success',
    })
  }, [purchase, queryClient, showToast])

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
  const buy = async (plan: BillingOverviewPlan) => {
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
            onClick={() => setSelectedView('buy')}
          >
            Top up <PlusIcon />
          </button>
        ) : account?.hasCreditHistory ? (
          <button
            type="button"
            className="filter-btn"
            onClick={() => setSelectedView('history')}
          >
            Back to Credit History
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

      <AsyncState
        isPending={overviewQuery.isPending}
        error={overviewQuery.error}
        onRetry={() => void overviewQuery.refetch()}
      >
        {!isBuying && account ? (
          <section className="dash-stats" aria-busy={overviewQuery.isFetching}>
            <article className="stat-card">
              <div className="stat-text">
                <p className="stat-label">Credit Balance</p>
                <p className="stat-value">
                  {account.creditBalance.toLocaleString()}{' '}
                  <span className="stat-unit">credits</span>
                  {account.creditBalance < account.lowBalanceThreshold ? (
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
                  {account.creditsUsedThisMonth.toLocaleString()}{' '}
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
                  {account.lastCreditMovement
                    ? typeof account.lastCreditMovement.amount === 'number'
                      ? naira(account.lastCreditMovement.amount)
                      : 'Manual'
                    : '—'}{' '}
                  {account.lastCreditMovement ? (
                    <span className="stat-unit">
                      {account.lastCreditMovement.label} ·{' '}
                      {formatDate(account.lastCreditMovement.createdAt)}
                    </span>
                  ) : null}
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
            {isBuying ? 'Buy Credits' : 'Credit History'}
          </button>
        </div>

        {isBuying ? (
          activePlans.length > 0 ? (
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
          )
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
                    <th>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {creditHistory.map((entry, index) => (
                    <tr key={entry.id}>
                      <td>{String(index + 1).padStart(2, '0')}</td>
                      <td>{entry.label}</td>
                      <td>{sourceLabel(entry.source)}</td>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>{entry.credits.toLocaleString()}</td>
                      <td>{typeof entry.amount === 'number' ? naira(entry.amount) : '—'}</td>
                      <td>{entry.balanceAfter.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {creditHistory.length === 0 ? (
              <div className="meter-empty">
                <p className="meter-empty-text">No credit history found.</p>
              </div>
            ) : null}
          </section>
        )}
      </AsyncState>
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

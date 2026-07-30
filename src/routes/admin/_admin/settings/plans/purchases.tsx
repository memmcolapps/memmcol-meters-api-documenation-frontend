import { useDeferredValue, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../../../app/AsyncState'
import {
  useAdminBillingPurchases,
  type BillingPurchaseStatus,
} from '../../../../../features/billing/billingPurchaseQueries'

export const Route = createFileRoute('/admin/_admin/settings/plans/purchases')({
  component: BillingPurchasesPage,
})

function BillingPurchasesPage() {
  const [organisationId, setOrganisationId] = useState('')
  const [status, setStatus] = useState<BillingPurchaseStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const deferredOrganisationId = useDeferredValue(organisationId.trim())
  const purchasesQuery = useAdminBillingPurchases({
    organisationId: deferredOrganisationId || undefined,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  })
  const purchases = purchasesQuery.data?.items ?? []
  const pagination = purchasesQuery.data?.pagination
  const isEmpty = !purchasesQuery.isPending && purchases.length === 0
  const hasFilters = Boolean(organisationId || status || from || to)

  const resetFilters = () => {
    setOrganisationId('')
    setStatus('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Billing Purchases</h1>
          <p className="dash-subtitle">
            View purchases made by every organization.
          </p>
        </div>
      </header>

      <div className="dash-tabs" role="tablist">
        <Link
          to="/admin/settings/plans"
          className="dash-tab"
          role="tab"
          aria-selected="false"
        >
          Subscription Plans
        </Link>
        <span className="dash-tab is-active" role="tab" aria-selected="true">
          Purchases
        </span>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <input
            type="search"
            className="filter-btn"
            placeholder="Organisation ID"
            aria-label="Filter purchases by organisation ID"
            value={organisationId}
            onChange={(event) => {
              setOrganisationId(event.target.value)
              setPage(1)
            }}
          />
          <select
            className="filter-btn"
            aria-label="Filter purchases by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as BillingPurchaseStatus | '')
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
          <label className="purchase-date-filter">
            <span>From</span>
            <input
              type="date"
              className="filter-btn"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="purchase-date-filter">
            <span>To</span>
            <input
              type="date"
              className="filter-btn"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value)
                setPage(1)
              }}
            />
          </label>
          {hasFilters ? (
            <button type="button" className="btn-neutral" onClick={resetFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <AsyncState
        isPending={purchasesQuery.isPending}
        error={purchasesQuery.error}
        onRetry={() => void purchasesQuery.refetch()}
      >
        {isEmpty ? (
          <div className="meter-empty">
            <p className="meter-empty-text">
              {hasFilters
                ? 'No purchases match the selected filters.'
                : 'No billing purchases found.'}
            </p>
            {hasFilters ? (
              <button type="button" className="btn-primary" onClick={resetFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="table-scroll" aria-busy={purchasesQuery.isFetching}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Organization</th>
                    <th>Plan</th>
                    <th>Credits</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Reference</th>
                    <th>Purchased At</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, index) => (
                    <tr key={purchase.id}>
                      <td>
                        {String(
                          ((pagination?.page ?? page) - 1) *
                            (pagination?.limit ?? 20) +
                            index +
                            1,
                        ).padStart(2, '0')}
                      </td>
                      <td>
                        <span title={purchase.organisation.id}>
                          {purchase.organisation.name}
                        </span>
                      </td>
                      <td>{purchase.plan.name}</td>
                      <td>{purchase.credits.toLocaleString()}</td>
                      <td>₦{purchase.amount.toLocaleString()}</td>
                      <td>
                        <span
                          className={`code-badge${
                            purchase.status === 'PAID' ? ' is-ok' : ' is-warn'
                          }`}
                        >
                          {formatStatus(purchase.status)}
                        </span>
                      </td>
                      <td>{purchase.paymentReference}</td>
                      <td>{formatDateTime(purchase.createdAt)}</td>
                      <td>
                        {purchase.paidAt ? formatDateTime(purchase.paidAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Billing purchase pagination">
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) <= 1 || purchasesQuery.isFetching
                }
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="page-gap">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                {' · '}{pagination?.total ?? purchases.length} total
              </span>
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) >= (pagination?.totalPages ?? 1) ||
                  purchasesQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </AsyncState>
    </div>
  )
}

function formatStatus(status: BillingPurchaseStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

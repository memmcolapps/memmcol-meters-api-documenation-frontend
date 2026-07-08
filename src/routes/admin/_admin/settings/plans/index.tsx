import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDismiss } from '../../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../../app/useAnchoredMenu'
import { ConfirmModal } from '../../../../../app/ConfirmModal'
import { PlanFormModal } from '../../../../../app/PlanFormModal'
import { formatAddedDate } from '../../../../../app/adminMeters'
import { seededPlans, type Plan, type PlanStatus } from '../../../../../app/adminPlans'

export const Route = createFileRoute('/admin/_admin/settings/plans/')({
  component: SubscriptionManagementPage,
})

type FormModalState = { mode: 'add' } | { mode: 'edit'; plan: Plan }

function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>(seededPlans)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [formModal, setFormModal] = useState<FormModalState | null>(null)
  const [deactivating, setDeactivating] = useState<Plan | null>(null)

  const setStatus = (id: string, status: PlanStatus) => {
    setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, status } : plan)))
    setOpenMenu(null)
  }

  const goToPlan = (id: string) => {
    navigate({
      to: '/admin/settings/plans/$planId',
      params: { planId: id },
    })
  }

  const query = search.trim().toLowerCase()
  const visiblePlans = query
    ? plans.filter((plan) =>
        `${plan.name} ${plan.description}`.toLowerCase().includes(query),
      )
    : plans

  const isEmpty = plans.length === 0

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Plans &amp; Pricing</h1>
          <p className="dash-subtitle">
            Manage customer subscriptions, plans, and API access.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setFormModal({ mode: 'add' })}
        >
          Add Subscription Plan <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Subscription Plans
        </button>
      </div>

      {isEmpty ? (
        <div className="meter-empty">
          <p className="meter-empty-text">No subscription available</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setFormModal({ mode: 'add' })}
          >
            Add Subscription Plan <PlusIcon />
          </button>
        </div>
      ) : (
        <>
          <div className="dash-toolbar">
            <div className="dash-filters">
              <div className="table-search">
                <input
                  type="search"
                  placeholder="Search Plan..."
                  aria-label="Search plans"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <SearchIcon />
              </div>
              <button type="button" className="filter-btn">
                Filter <ChevronRightIcon />
              </button>
              <button type="button" className="filter-btn">
                Sort <SortIcon />
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" aria-label="Select all rows" />
                  </th>
                  <th>S/N</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Credits</th>
                  <th>Amount(₦)</th>
                  <th>Added Date</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlans.map((plan, index) => (
                  <tr key={plan.id}>
                    <td className="col-check">
                      <input type="checkbox" aria-label={`Select plan ${index + 1}`} />
                    </td>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{plan.name}</td>
                    <td className="cell-truncate">{plan.description}</td>
                    <td>{plan.credits}</td>
                    <td>{plan.amount}</td>
                    <td>{plan.addedDate}</td>
                    <td>
                      <span
                        className={`code-badge${plan.status === 'Active' ? ' is-ok' : ' is-error'}`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="col-actions">
                      <RowActions
                        isOpen={openMenu === plan.id}
                        status={plan.status}
                        onToggle={() =>
                          setOpenMenu((prev) => (prev === plan.id ? null : plan.id))
                        }
                        onClose={() => setOpenMenu(null)}
                        onView={() => goToPlan(plan.id)}
                        onEdit={() => {
                          setOpenMenu(null)
                          setFormModal({ mode: 'edit', plan })
                        }}
                        onDeactivate={() => {
                          setOpenMenu(null)
                          setDeactivating(plan)
                        }}
                        onActivate={() => setStatus(plan.id, 'Active')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {formModal ? (
        <PlanFormModal
          title={formModal.mode === 'add' ? 'Add Subscription Plan' : 'Edit Subscription Plan'}
          submitLabel={formModal.mode === 'add' ? 'Add Plan' : 'Save Changes'}
          initial={formModal.mode === 'edit' ? formModal.plan : undefined}
          onClose={() => setFormModal(null)}
          onSubmit={(values) => {
            if (formModal.mode === 'add') {
              setPlans((prev) => [
                ...prev,
                { ...values, id: `plan-${Date.now()}`, addedDate: formatAddedDate() },
              ])
            } else {
              const editedId = formModal.plan.id
              setPlans((prev) =>
                prev.map((plan) => (plan.id === editedId ? { ...plan, ...values } : plan)),
              )
            }
            setFormModal(null)
          }}
        />
      ) : null}

      {deactivating ? (
        <ConfirmModal
          message={`Are you sure you want to deactivate ${deactivating.name}?`}
          confirmLabel="Deactivate"
          onCancel={() => setDeactivating(null)}
          onConfirm={() => {
            setStatus(deactivating.id, 'Inactive')
            setDeactivating(null)
          }}
        />
      ) : null}
    </div>
  )
}

function RowActions({
  isOpen,
  status,
  onToggle,
  onClose,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  isOpen: boolean
  status: PlanStatus
  onToggle: () => void
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onDeactivate: () => void
  onActivate: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, onClose, isOpen)
  const { anchorRef, menuStyle } = useAnchoredMenu(isOpen)

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="row-kebab"
        aria-label="Row actions"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <KebabIcon />
      </button>
      {isOpen ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button type="button" className="row-menu-item" role="menuitem" onClick={onView}>
            <ClipboardIcon /> View Plan
          </button>
          <button type="button" className="row-menu-item" role="menuitem" onClick={onEdit}>
            <PencilIcon /> Edit Plan
          </button>
          {status === 'Active' ? (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onDeactivate}>
              <LockIcon /> Deactivate
            </button>
          ) : (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onActivate}>
              <BadgeCheckIcon /> Activate
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
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

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4.5V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v1" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function BadgeCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

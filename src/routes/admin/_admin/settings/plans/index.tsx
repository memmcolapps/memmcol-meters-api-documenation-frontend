import { useDeferredValue, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDismiss } from '../../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../../app/useAnchoredMenu'
import { PlanFormModal } from '../../../../../app/PlanFormModal'
import { AsyncState } from '../../../../../app/AsyncState'
import { useToast } from '../../../../../app/toastContext'
import { formatAddedDate } from '../../../../../app/adminMeters'
import {
  type Plan,
  type PlanFormField,
  type PlanFormValues,
  type PlanStatus,
} from '../../../../../app/adminPlans'
import {
  getBillingPlanError,
  getBillingPlanStatusError,
  useAdminBillingPlans,
  useChangeBillingPlanStatus,
  useCreateBillingPlan,
  type BillingPlan,
} from '../../../../../features/billing/billingPlanQueries'

export const Route = createFileRoute('/admin/_admin/settings/plans/')({
  component: SubscriptionManagementPage,
})

type FormModalState = { mode: 'add' } | { mode: 'edit'; plan: Plan }
type StatusField = 'status' | 'reason'

function toDisplayPlan(plan: BillingPlan): Plan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    amount: plan.amount,
    credits: plan.credits,
    features: plan.features,
    cta: plan.cta,
    status: plan.status,
    addedDate: formatAddedDate(new Date(plan.createdAt)),
  }
}

function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const createPlan = useCreateBillingPlan()
  const changePlanStatus = useChangeBillingPlanStatus()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PlanStatus | ''>('')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [formModal, setFormModal] = useState<FormModalState | null>(null)
  const [deactivating, setDeactivating] = useState<Plan | null>(null)
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Partial<Record<PlanFormField, string>>
  >({})
  const [statusFieldErrors, setStatusFieldErrors] = useState<
    Partial<Record<StatusField, string>>
  >({})
  const [planEdits, setPlanEdits] = useState<Record<string, PlanFormValues>>({})
  const deferredSearch = useDeferredValue(search.trim())
  const plansQuery = useAdminBillingPlans({
    search: deferredSearch || undefined,
    status: status || undefined,
    page,
    limit: 20,
  })
  const plans = (plansQuery.data?.items ?? []).map((plan) => ({
    ...toDisplayPlan(plan),
    ...(planEdits[plan.id] ?? {}),
  }))
  const pagination = plansQuery.data?.pagination

  const openAddModal = () => {
    createPlan.reset()
    setCreateFieldErrors({})
    setFormModal({ mode: 'add' })
  }

  const submitPlan = async (values: PlanFormValues) => {
    if (formModal?.mode === 'edit') {
      const editedId = formModal.plan.id
      setPlanEdits((current) => ({ ...current, [editedId]: values }))
      setFormModal(null)
      return
    }

    setCreateFieldErrors({})
    try {
      const plan = await createPlan.mutateAsync(values)
      setFormModal(null)
      showToast({
        title: 'Credit plan created',
        message: `${plan.name} was created with ${plan.credits.toLocaleString()} credits.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getBillingPlanError(error)
      const fields = apiError.fields as Partial<Record<PlanFormField, string>>
      const fieldMessage = [...new Set(Object.values(fields))].join(' ')
      setCreateFieldErrors(fields)
      showToast({
        title: apiError.message,
        message: [
          fieldMessage,
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  const updatePlanStatus = async (
    plan: Plan,
    status: PlanStatus,
    reason?: string,
  ) => {
    if (status === 'INACTIVE' && !reason?.trim()) {
      setStatusFieldErrors({ reason: 'Reason is required when deactivating a plan.' })
      return
    }

    setStatusFieldErrors({})
    try {
      await changePlanStatus.mutateAsync({
        planId: plan.id,
        status,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      })
      setOpenMenu(null)
      setDeactivating(null)
      showToast({
        title: status === 'ACTIVE' ? 'Plan activated' : 'Plan deactivated',
        message: `${plan.name} is now ${status.toLowerCase()}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getBillingPlanStatusError(error)
      const fields = apiError.fields as Partial<Record<StatusField, string>>
      setStatusFieldErrors(fields)
      showToast({
        title: apiError.message,
        message: [
          [...new Set(Object.values(fields))].join(' '),
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  const goToPlan = (id: string) => {
    navigate({
      to: '/admin/settings/plans/$planId',
      params: { planId: id },
    })
  }

  const isEmpty = !plansQuery.isPending && plans.length === 0

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
          onClick={openAddModal}
        >
          Add Subscription Plan <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Subscription Plans
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search name or description..."
              aria-label="Search plans by name or description"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <select
            className="filter-btn"
            aria-label="Filter plans by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PlanStatus | '')
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
        </div>
      </div>

      <AsyncState
        isPending={plansQuery.isPending}
        error={plansQuery.error}
        onRetry={() => void plansQuery.refetch()}
      >
        {isEmpty ? (
          <div className="meter-empty">
            <p className="meter-empty-text">No billing plans found.</p>
            {!search && !status ? (
              <button type="button" className="btn-primary" onClick={openAddModal}>
                Add Subscription Plan <PlusIcon />
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="table-scroll" aria-busy={plansQuery.isFetching}>
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
                  {plans.map((plan, index) => (
                    <tr key={plan.id}>
                      <td className="col-check">
                        <input type="checkbox" aria-label={`Select plan ${index + 1}`} />
                      </td>
                      <td>
                        {String(
                          ((pagination?.page ?? page) - 1) *
                            (pagination?.limit ?? 20) +
                            index +
                            1,
                        ).padStart(2, '0')}
                      </td>
                      <td>{plan.name}</td>
                      <td className="cell-truncate">{plan.description}</td>
                      <td>{plan.credits.toLocaleString()}</td>
                      <td>{plan.amount.toLocaleString()}</td>
                      <td>{plan.addedDate}</td>
                      <td>
                        <span
                          className={`code-badge${plan.status === 'ACTIVE' ? ' is-ok' : ' is-error'}`}
                        >
                          {plan.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="col-actions">
                        <RowActions
                          isOpen={openMenu === plan.id}
                          status={plan.status}
                          isStatusPending={changePlanStatus.isPending}
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
                            changePlanStatus.reset()
                            setStatusFieldErrors({})
                            setDeactivating(plan)
                          }}
                          onActivate={() => void updatePlanStatus(plan, 'ACTIVE')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Billing plan pagination">
              <button
                type="button"
                className="page-nav"
                disabled={(pagination?.page ?? page) <= 1 || plansQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="page-gap">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                {' · '}{pagination?.total ?? plans.length} total
              </span>
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) >= (pagination?.totalPages ?? 1) ||
                  plansQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </AsyncState>

      {formModal ? (
        <PlanFormModal
          title={formModal.mode === 'add' ? 'Add Subscription Plan' : 'Edit Subscription Plan'}
          submitLabel={formModal.mode === 'add' ? 'Add Plan' : 'Save Changes'}
          initial={formModal.mode === 'edit' ? formModal.plan : undefined}
          isSubmitting={formModal.mode === 'add' && createPlan.isPending}
          fieldErrors={formModal.mode === 'add' ? createFieldErrors : {}}
          onFieldChange={(field) => {
            setCreateFieldErrors((current) => {
              if (!current[field]) return current
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onClose={() => {
            if (!createPlan.isPending) setFormModal(null)
          }}
          onSubmit={(values) => void submitPlan(values)}
        />
      ) : null}

      {deactivating ? (
        <DeactivatePlanModal
          plan={deactivating}
          isSubmitting={changePlanStatus.isPending}
          fieldErrors={statusFieldErrors}
          onReasonChange={() => {
            setStatusFieldErrors((current) => {
              if (!current.reason) return current
              const next = { ...current }
              delete next.reason
              return next
            })
          }}
          onCancel={() => {
            if (!changePlanStatus.isPending) setDeactivating(null)
          }}
          onConfirm={(reason) => void updatePlanStatus(deactivating, 'INACTIVE', reason)}
        />
      ) : null}
    </div>
  )
}

function DeactivatePlanModal({
  plan,
  isSubmitting,
  fieldErrors,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  plan: Plan
  isSubmitting: boolean
  fieldErrors: Partial<Record<StatusField, string>>
  onReasonChange: () => void
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onCancel)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="deactivate-plan-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="deactivate-plan-title" className="modal-title">Deactivate plan</h2>
            <p className="modal-subtitle">{plan.name} will no longer be available for new purchases.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel} disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          {fieldErrors.status ? (
            <p className="modal-field-error" role="alert">{fieldErrors.status}</p>
          ) : null}
          <div className="modal-field">
            <label htmlFor="deactivation-reason">Reason <span className="req">*</span></label>
            <textarea
              id="deactivation-reason"
              className="modal-input"
              rows={3}
              placeholder="Explain why this plan is being deactivated"
              value={reason}
              aria-invalid={Boolean(fieldErrors.reason)}
              disabled={isSubmitting}
              onChange={(event) => {
                setReason(event.target.value)
                onReasonChange()
              }}
            />
            {fieldErrors.reason ? (
              <span className="modal-field-error" role="alert">{fieldErrors.reason}</span>
            ) : null}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
            <button type="button" className="btn-danger-solid" onClick={() => onConfirm(reason)} disabled={isSubmitting}>
              {isSubmitting ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RowActions({
  isOpen,
  status,
  isStatusPending,
  onToggle,
  onClose,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  isOpen: boolean
  status: PlanStatus
  isStatusPending: boolean
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
          {status === 'ACTIVE' ? (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onDeactivate} disabled={isStatusPending}>
              <LockIcon /> Deactivate
            </button>
          ) : (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onActivate} disabled={isStatusPending}>
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
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

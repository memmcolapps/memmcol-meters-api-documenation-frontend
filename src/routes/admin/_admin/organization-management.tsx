import { useDeferredValue, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../app/AsyncState'
import { ConfirmModal } from '../../../app/ConfirmModal'
import { useAnchoredMenu } from '../../../app/useAnchoredMenu'
import { useDismiss } from '../../../app/useDismiss'
import { useToast } from '../../../app/toastContext'
import {
  formatDateTime,
  formatName,
  formatNumber,
  formatStatusLabel,
  formatText,
  toList,
} from '../../../lib/format'
import {
  getAdminOrganisationStatusError,
  getAdjustOrganisationCreditsError,
  getCreateAdminOrganisationError,
  useAdjustOrganisationCredits,
  useAdminOrganisations,
  useChangeAdminOrganisationStatus,
  useCreateAdminOrganisation,
  type AdminOrganisation,
  type AdminOrganisationSortBy,
  type AdminOrganisationSortOrder,
  type AdminOrganisationStatus,
} from '../../../features/admin-organisations/adminOrganisationQueries'

export const Route = createFileRoute('/admin/_admin/organization-management')({
  component: OrganizationManagementPage,
})

const PAGE_SIZE = 20

function OrganizationManagementPage() {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AdminOrganisationStatus | ''>('')
  const [sortBy, setSortBy] =
    useState<AdminOrganisationSortBy>('createdAt')
  const [sortOrder, setSortOrder] =
    useState<AdminOrganisationSortOrder>('desc')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOrganisationOpen, setAddOrganisationOpen] = useState(false)
  const [assigningCredits, setAssigningCredits] =
    useState<AdminOrganisation | null>(null)
  const [suspending, setSuspending] = useState<AdminOrganisation | null>(null)
  const [reactivating, setReactivating] =
    useState<AdminOrganisation | null>(null)
  const [statusFieldErrors, setStatusFieldErrors] = useState<
    Partial<Record<'status' | 'reason', string>>
  >({})
  const deferredSearch = useDeferredValue(search.trim())
  const changeStatus = useChangeAdminOrganisationStatus()
  const organisationsQuery = useAdminOrganisations({
    search: deferredSearch || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  })
  const organisations = toList<AdminOrganisation>(organisationsQuery.data?.items)
  const pagination = organisationsQuery.data?.pagination
  const isEmpty = !organisationsQuery.isPending && organisations.length === 0
  const hasFilters = Boolean(search || status)

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPage(1)
  }

  const updateStatus = async (
    organisation: AdminOrganisation,
    nextStatus: AdminOrganisationStatus,
    reason?: string,
  ) => {
    if (nextStatus === 'SUSPENDED' && !reason?.trim()) {
      setStatusFieldErrors({
        reason: 'A reason is required when suspending an organization.',
      })
      return
    }

    setStatusFieldErrors({})

    try {
      await changeStatus.mutateAsync({
        organisationId: organisation.id,
        status: nextStatus,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      })
      setOpenMenu(null)
      setSuspending(null)
      setReactivating(null)
      showToast({
        title:
          nextStatus === 'SUSPENDED'
            ? 'Organization suspended'
            : 'Organization reactivated',
        message:
          nextStatus === 'SUSPENDED'
            ? `${organisationLabel(organisation)} can no longer use live API keys.`
            : `${organisationLabel(organisation)} is active. No new API keys were generated.`,
        variant: 'success',
      })
    } catch (error) {
      const statusError = getAdminOrganisationStatusError(error)
      const fields = statusError.fields as Partial<
        Record<'status' | 'reason', string>
      >
      setStatusFieldErrors(fields)
      showToast({
        title: statusError.message,
        message: [
          [...new Set(Object.values(fields))].join(' '),
          statusError.requestId
            ? `Request ID: ${statusError.requestId}`
            : '',
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Organization Management</h1>
          <p className="dash-subtitle">
            View organizations, owners, account status, and credit balances.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setAddOrganisationOpen(true)}
        >
          Add Organization <CirclePlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <span className="dash-tab is-active" role="tab" aria-selected="true">
          Organizations
        </span>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search organizations..."
              aria-label="Search organizations"
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
            aria-label="Filter organizations by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminOrganisationStatus | '')
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            className="filter-btn"
            aria-label="Sort organizations by"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as AdminOrganisationSortBy)
              setPage(1)
            }}
          >
            <option value="createdAt">Date created</option>
            <option value="businessName">Business name</option>
            <option value="creditBalance">Credit balance</option>
          </select>
          <select
            className="filter-btn"
            aria-label="Organization sort order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as AdminOrganisationSortOrder)
              setPage(1)
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          {hasFilters ? (
            <button type="button" className="btn-neutral" onClick={resetFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <AsyncState
        isPending={organisationsQuery.isPending}
        error={organisationsQuery.error}
        onRetry={() => void organisationsQuery.refetch()}
      >
        {isEmpty ? (
          <div className="meter-empty">
            <p className="meter-empty-text">
              {hasFilters
                ? 'No organizations match the selected filters.'
                : 'No organizations found.'}
            </p>
            {hasFilters ? (
              <button type="button" className="btn-primary" onClick={resetFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div
              className="table-scroll"
              aria-busy={organisationsQuery.isFetching}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Business Name</th>
                    <th>Owner Name</th>
                    <th>Phone Number</th>
                    <th>Email Address</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organisations.map((organisation, index) => (
                    <tr key={organisation.id}>
                      <td>
                        {String(
                          ((pagination?.page ?? page) - 1) *
                            (pagination?.limit ?? PAGE_SIZE) +
                            index +
                            1,
                        ).padStart(2, '0')}
                      </td>
                      <td>{formatText(organisation.businessName)}</td>
                      <td>
                        {formatName(
                          organisation.owner?.firstName,
                          organisation.owner?.lastName,
                        )}
                      </td>
                      <td>
                        {formatName(
                          organisation.owner?.dialCode,
                          organisation.owner?.phone,
                        )}
                      </td>
                      <td>{formatText(organisation.owner?.email)}</td>
                      <td>{formatNumber(organisation.creditBalance)}</td>
                      <td>
                        <span
                          className={`code-badge${statusBadgeClass(
                            organisation.status,
                          )}`}
                        >
                          {formatStatusLabel(organisation.status)}
                        </span>
                      </td>
                      <td>{formatDateTime(organisation.createdAt)}</td>
                      <td className="col-actions">
                        <OrganisationRowActions
                          isOpen={openMenu === organisation.id}
                          organisation={organisation}
                          onToggle={() =>
                            setOpenMenu((current) =>
                              current === organisation.id
                                ? null
                                : organisation.id,
                            )
                          }
                          onClose={() => setOpenMenu(null)}
                          onAssignCredits={() => {
                            setOpenMenu(null)
                            setAssigningCredits(organisation)
                          }}
                          onSuspend={() => {
                            setStatusFieldErrors({})
                            setOpenMenu(null)
                            setSuspending(organisation)
                          }}
                          onReactivate={() => {
                            setStatusFieldErrors({})
                            setOpenMenu(null)
                            setReactivating(organisation)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Organization pagination">
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) <= 1 ||
                  organisationsQuery.isFetching
                }
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="page-gap">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                {' · '}
                {pagination?.total ?? organisations.length} total
              </span>
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) >=
                    (pagination?.totalPages ?? 1) ||
                  organisationsQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </AsyncState>

      {assigningCredits ? (
        <AssignCreditsModal
          organisation={assigningCredits}
          onClose={() => setAssigningCredits(null)}
        />
      ) : null}

      {addOrganisationOpen ? (
        <AddOrganisationModal
          onClose={() => setAddOrganisationOpen(false)}
        />
      ) : null}

      {suspending ? (
        <SuspendOrganisationModal
          organisation={suspending}
          isSubmitting={changeStatus.isPending}
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
            if (!changeStatus.isPending) setSuspending(null)
          }}
          onConfirm={(reason) =>
            void updateStatus(suspending, 'SUSPENDED', reason)
          }
        />
      ) : null}

      {reactivating ? (
        <ConfirmModal
          tone="primary"
          message={`Reactivate ${organisationLabel(reactivating)}? This will not generate new API keys.`}
          confirmLabel="Reactivate"
          isSubmitting={changeStatus.isPending}
          onCancel={() => {
            if (!changeStatus.isPending) setReactivating(null)
          }}
          onConfirm={() => void updateStatus(reactivating, 'ACTIVE')}
        />
      ) : null}
    </div>
  )
}

type AddOrganisationField = 'businessName' | 'ownerEmail'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AddOrganisationModal({ onClose }: { onClose: () => void }) {
  const [businessName, setBusinessName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AddOrganisationField, string>>
  >({})
  const createOrganisation = useCreateAdminOrganisation()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, () => {
    if (!createOrganisation.isPending) onClose()
  })

  const clearFieldError = (field: AddOrganisationField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async () => {
    const errors: Partial<Record<AddOrganisationField, string>> = {}
    if (!businessName.trim()) {
      errors.businessName = 'Business name is required.'
    }
    if (!ownerEmail.trim()) {
      errors.ownerEmail = 'Email address is required.'
    } else if (!emailPattern.test(ownerEmail.trim())) {
      errors.ownerEmail = 'Enter a valid email address.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await createOrganisation.mutateAsync({
        businessName: businessName.trim(),
        ownerEmail: ownerEmail.trim(),
      })
      onClose()
      showToast({
        title: 'Organization created',
        message: `${businessName.trim()} has been created.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getCreateAdminOrganisationError(error)
      setFieldErrors(
        apiError.fields as Partial<Record<AddOrganisationField, string>>,
      )
      showToast({
        title: apiError.message,
        message: [
          [...new Set(Object.values(apiError.fields))].join(' '),
          apiError.requestId
            ? `Request ID: ${apiError.requestId}`
            : '',
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-organisation-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="add-organisation-title" className="modal-title">
            Add Organization
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
            disabled={createOrganisation.isPending}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label htmlFor="organisation-business-name">Business Name</label>
            <input
              id="organisation-business-name"
              className="modal-input"
              type="text"
              placeholder="Enter business name"
              value={businessName}
              disabled={createOrganisation.isPending}
              aria-invalid={Boolean(fieldErrors.businessName)}
              aria-describedby={
                fieldErrors.businessName
                  ? 'organisation-business-name-error'
                  : undefined
              }
              onChange={(event) => {
                setBusinessName(event.target.value)
                clearFieldError('businessName')
              }}
            />
            {fieldErrors.businessName ? (
              <p
                id="organisation-business-name-error"
                className="modal-field-error"
                role="alert"
              >
                {fieldErrors.businessName}
              </p>
            ) : null}
          </div>

          <div className="modal-field">
            <label htmlFor="organisation-owner-email">Email Address</label>
            <input
              id="organisation-owner-email"
              className="modal-input"
              type="email"
              autoComplete="email"
              placeholder="Enter owner email address"
              value={ownerEmail}
              disabled={createOrganisation.isPending}
              aria-invalid={Boolean(fieldErrors.ownerEmail)}
              aria-describedby={
                fieldErrors.ownerEmail
                  ? 'organisation-owner-email-error'
                  : undefined
              }
              onChange={(event) => {
                setOwnerEmail(event.target.value)
                clearFieldError('ownerEmail')
              }}
            />
            {fieldErrors.ownerEmail ? (
              <p
                id="organisation-owner-email-error"
                className="modal-field-error"
                role="alert"
              >
                {fieldErrors.ownerEmail}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="btn-primary btn-block"
            disabled={createOrganisation.isPending}
            onClick={() => void handleSubmit()}
          >
            {createOrganisation.isPending
              ? 'Adding…'
              : 'Add Organization'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignCreditsModal({
  organisation,
  onClose,
}: {
  organisation: AdminOrganisation
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'credits', string>>
  >({})
  const adjustCredits = useAdjustOrganisationCredits()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, () => {
    if (!adjustCredits.isPending) onClose()
  })

  const parsedAmount = Number(amount.replace(/[^\d]/g, ''))
  const canSubmit =
    Number.isSafeInteger(parsedAmount) &&
    parsedAmount > 0 &&
    !adjustCredits.isPending

  const clearFieldError = (field: 'credits') => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async () => {
    setFieldErrors({})
    try {
      const response = await adjustCredits.mutateAsync({
        organisationId: organisation.id,
        credits: parsedAmount,
      })
      onClose()
      showToast({
        title: 'Credits adjusted',
        message: `${formatNumber(
          response.adjustment.credits,
        )} credits added to ${organisationLabel(
          organisation,
        )}. New balance: ${formatNumber(response.adjustment.balanceAfter)}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getAdjustOrganisationCreditsError(error)
      setFieldErrors(apiError.fields as Partial<Record<'credits', string>>)
      showToast({
        title: apiError.message,
        message: [
          [...new Set(Object.values(apiError.fields))].join(' '),
          apiError.requestId
            ? `Request ID: ${apiError.requestId}`
            : '',
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-credits-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="assign-credits-title" className="modal-title">
              Assign Credits
            </h2>
            <p className="modal-subtitle">
              Top up API credits for {organisationLabel(organisation)} — current
              balance: {formatNumber(organisation.creditBalance)} credits.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
            disabled={adjustCredits.isPending}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label htmlFor="organisation-credit-amount">Credits</label>
            <input
              id="organisation-credit-amount"
              className="modal-input"
              inputMode="numeric"
              placeholder="E.g. 500,000"
              value={amount}
              disabled={adjustCredits.isPending}
              aria-invalid={Boolean(fieldErrors.credits)}
              aria-describedby={
                fieldErrors.credits
                  ? 'organisation-credit-amount-error'
                  : undefined
              }
              onChange={(event) => {
                setAmount(event.target.value)
                clearFieldError('credits')
              }}
            />
            {fieldErrors.credits ? (
              <p
                id="organisation-credit-amount-error"
                className="modal-field-error"
                role="alert"
              >
                {fieldErrors.credits}
              </p>
            ) : null}
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn-neutral"
              onClick={onClose}
              disabled={adjustCredits.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {adjustCredits.isPending ? 'Assigning…' : 'Assign Credits'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SuspendOrganisationModal({
  organisation,
  isSubmitting,
  fieldErrors,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  organisation: AdminOrganisation
  isSubmitting: boolean
  fieldErrors: Partial<Record<'status' | 'reason', string>>
  onReasonChange: () => void
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, () => {
    if (!isSubmitting) onCancel()
  })

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-organisation-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="suspend-organisation-title" className="modal-title">
            Suspend Organization
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          {fieldErrors.status ? (
            <p className="modal-field-error" role="alert">
              {fieldErrors.status}
            </p>
          ) : null}
          <p className="confirm-message">
            Suspending {organisationLabel(organisation)} will prevent its live
            API keys from being used.
          </p>
          <div className="modal-field">
            <label htmlFor="organisation-suspension-reason">
              Reason <span className="req">*</span>
            </label>
            <textarea
              id="organisation-suspension-reason"
              className="modal-input"
              rows={4}
              placeholder="E.g. Compliance review."
              value={reason}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.reason)}
              aria-describedby={
                fieldErrors.reason
                  ? 'organisation-suspension-reason-error'
                  : undefined
              }
              onChange={(event) => {
                setReason(event.target.value)
                onReasonChange()
              }}
            />
            {fieldErrors.reason ? (
              <p
                id="organisation-suspension-reason-error"
                className="modal-field-error"
                role="alert"
              >
                {fieldErrors.reason}
              </p>
            ) : null}
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn-neutral"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger-solid"
              disabled={isSubmitting}
              onClick={() => onConfirm(reason)}
            >
              {isSubmitting ? 'Please wait…' : 'Suspend'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrganisationRowActions({
  isOpen,
  organisation,
  onToggle,
  onClose,
  onAssignCredits,
  onSuspend,
  onReactivate,
}: {
  isOpen: boolean
  organisation: AdminOrganisation
  onToggle: () => void
  onClose: () => void
  onAssignCredits: () => void
  onSuspend: () => void
  onReactivate: () => void
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
        aria-label={`Actions for ${organisationLabel(organisation)}`}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <KebabIcon />
      </button>
      {isOpen ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onAssignCredits}
          >
            <CoinsIcon /> Assign Credits
          </button>
          {organisation.status === 'ACTIVE' ? (
            <button
              type="button"
              className="row-menu-item"
              role="menuitem"
              onClick={onSuspend}
            >
              <BanIcon />
              Suspend Organization
            </button>
          ) : (
            <button
              type="button"
              className="row-menu-item"
              role="menuitem"
              onClick={onReactivate}
            >
                <ArrowUpCircleIcon />
              Reactivate Organization
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function statusBadgeClass(status?: AdminOrganisationStatus | null) {
  if (status === 'ACTIVE') return ' is-ok'
  if (status === 'SUSPENDED') return ' is-error'
  return ''
}

function organisationLabel(organisation: AdminOrganisation) {
  return organisation.businessName?.trim() || 'This organization'
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function KebabIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function CoinsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  )
}

function CirclePlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function ArrowUpCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8" />
      <path d="m8 12 4-4 4 4" />
    </svg>
  )
}

function BanIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  )
}

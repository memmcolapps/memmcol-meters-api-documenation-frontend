import { useDeferredValue, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../app/useAnchoredMenu'
import { AsyncState } from '../../../../app/AsyncState'
import {
  MeterFormModal,
  type MeterFormField,
  type MeterFormValues,
} from '../../../../app/MeterFormModal'
import { useToast } from '../../../../app/toastContext'
import {
  formatAddedDate,
} from '../../../../app/adminMeters'
import {
  getMeterIntegrationError,
  useChangeMeterIntegrationStatus,
  useCreateMeterIntegration,
  useMeterIntegration,
  useMeterIntegrations,
  useUpdateMeterIntegration,
  type MeterIntegrationSummary,
  type MeterIntegrationStatus,
} from '../../../../features/admin-meters/adminMeterQueries'

export const Route = createFileRoute('/admin/_admin/meter-integration/')({
  component: MeterIntegrationPage,
})

type MeterIntegrationStatusField = 'status' | 'reason'

function MeterIntegrationPage() {
  const navigate = useNavigate()
  const createMeter = useCreateMeterIntegration()
  const changeMeterStatus = useChangeMeterIntegrationStatus()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MeterIntegrationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [integrateOpen, setIntegrateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deprecating, setDeprecating] = useState<MeterIntegrationSummary | null>(null)
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Partial<Record<MeterFormField, string>>
  >({})
  const [statusFieldErrors, setStatusFieldErrors] = useState<
    Partial<Record<MeterIntegrationStatusField, string>>
  >({})
  const deferredSearch = useDeferredValue(search.trim())
  const metersQuery = useMeterIntegrations({
    search: deferredSearch || undefined,
    status: status || undefined,
    page,
    limit: 20,
  })
  const meters = metersQuery.data?.items ?? []
  const pagination = metersQuery.data?.pagination

  const openIntegrateModal = () => {
    createMeter.reset()
    setCreateFieldErrors({})
    setIntegrateOpen(true)
  }

  const integrateMeter = async (data: MeterFormValues) => {
    setCreateFieldErrors({})

    try {
      const integration = await createMeter.mutateAsync({
        manufacturer: data.manufacturer,
        model: data.model,
        class: data.meterClass.toLowerCase().replaceAll('-', ' '),
        category: data.category.toLowerCase().replace('-', ''),
        protocol: data.protocol,
        authenticationType: data.authenticationType,
        password: data.password,
        ...(data.description ? { description: data.description } : {}),
      })

      setIntegrateOpen(false)
      showToast({
        title: 'Meter integrated',
        message: `${integration.manufacturer} ${integration.model} is now active.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getMeterIntegrationError(error)
      const { class: meterClassError, ...fieldErrors } = apiError.fields
      const fieldMessage = [...new Set(Object.values(apiError.fields))].join(' ')
      setCreateFieldErrors({
        ...fieldErrors,
        ...(meterClassError ? { meterClass: meterClassError } : {}),
      })
      showToast({
        title: apiError.message,
        message: [fieldMessage, apiError.requestId ? `Request ID: ${apiError.requestId}` : '']
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    } finally {
      createMeter.reset()
    }
  }

  const goToMeter = (id: string) => {
    navigate({ to: '/admin/meter-integration/$meterId', params: { meterId: id } })
  }

  const changeIntegrationStatus = async (
    meter: MeterIntegrationSummary,
    nextStatus: MeterIntegrationStatus,
    reason?: string,
  ) => {
    if (nextStatus === 'DEPRECATED' && !reason?.trim()) {
      setStatusFieldErrors({
        reason: 'Reason is required when deprecating a meter integration.',
      })
      return
    }

    setStatusFieldErrors({})
    try {
      await changeMeterStatus.mutateAsync({
        meterIntegrationId: meter.id,
        status: nextStatus,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      })
      setOpenMenu(null)
      setDeprecating(null)
      showToast({
        title: nextStatus === 'ACTIVE'
          ? 'Meter integration activated'
          : 'Meter integration deprecated',
        message: `${meter.manufacturer} ${meter.model} is now ${nextStatus.toLowerCase()}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getMeterIntegrationError(error)
      const fields = apiError.fields as Partial<
        Record<MeterIntegrationStatusField, string>
      >
      setStatusFieldErrors(fields)
      showToast({
        title: apiError.message,
        message: [
          ...new Set(Object.values(fields)),
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  const isEmpty = !metersQuery.isPending && meters.length === 0

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Meter Integration</h1>
          <p className="dash-subtitle">
            Onboard your smart meter to enable secure remote communication and
            API integration.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openIntegrateModal}>
          Integrate Meter <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Supported Meters
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search Meter..."
              aria-label="Search meters"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <StatusFilterDropdown
            value={status}
            onChange={(nextStatus) => {
              setStatus(nextStatus)
              setPage(1)
            }}
          />
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
        </div>
      </div>

      <AsyncState
        isPending={metersQuery.isPending}
        error={metersQuery.error}
        onRetry={() => void metersQuery.refetch()}
      >
        {isEmpty ? (
          <div className="meter-empty">
            <p className="meter-empty-text">No meter integrations found.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll" aria-busy={metersQuery.isFetching}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input type="checkbox" aria-label="Select all rows" />
                    </th>
                    <th>S/N</th>
                    <th>Meter Manufacturer</th>
                    <th>Meter Category</th>
                    <th>Meter Class</th>
                    <th>Meter Model</th>
                    <th>Added By</th>
                    <th>Added Date</th>
                    <th>Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((meter, index) => (
                    <tr key={meter.id}>
                      <td className="col-check">
                        <input type="checkbox" aria-label={`Select meter ${index + 1}`} />
                      </td>
                      <td>
                        {String(
                          ((pagination?.page ?? page) - 1) *
                            (pagination?.limit ?? 20) +
                            index +
                            1,
                        ).padStart(2, '0')}
                      </td>
                      <td>{meter.manufacturer}</td>
                      <td>{formatIntegrationValue(meter.category)}</td>
                      <td>{formatIntegrationValue(meter.class)}</td>
                      <td>{meter.model}</td>
                      <td>{meter.addedBy?.name || '—'}</td>
                      <td>{formatIntegrationDate(meter.createdAt)}</td>
                      <td>
                        <span
                          className={`code-badge${meter.status === 'ACTIVE' ? ' is-ok' : ' is-error'}`}
                        >
                          {formatIntegrationValue(meter.status)}
                        </span>
                      </td>
                      <td className="col-actions">
                        <RowActions
                          isOpen={openMenu === meter.id}
                          onToggle={() =>
                            setOpenMenu((prev) => (prev === meter.id ? null : meter.id))
                          }
                          onClose={() => setOpenMenu(null)}
                          status={meter.status}
                          onView={() => goToMeter(meter.id)}
                          onEdit={() => {
                            setOpenMenu(null)
                            setEditingId(meter.id)
                          }}
                          onAddObis={() => goToMeter(meter.id)}
                          onActivate={() =>
                            void changeIntegrationStatus(meter, 'ACTIVE')
                          }
                          onDeprecate={() => {
                            setOpenMenu(null)
                            changeMeterStatus.reset()
                            setStatusFieldErrors({})
                            setDeprecating(meter)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Meter integration pagination">
              <button
                type="button"
                className="page-nav"
                disabled={(pagination?.page ?? page) <= 1 || metersQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="page-gap">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                {' · '}{pagination?.total ?? meters.length} total
              </span>
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) >= (pagination?.totalPages ?? 1) ||
                  metersQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </AsyncState>

      {integrateOpen ? (
        <MeterFormModal
          title="Integrate Meter"
          submitLabel="Integrate"
          isSubmitting={createMeter.isPending}
          fieldErrors={createFieldErrors}
          onFieldChange={(field) => {
            setCreateFieldErrors((current) => {
              if (!current[field]) return current
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onClose={() => {
            if (!createMeter.isPending) setIntegrateOpen(false)
          }}
          onSubmit={integrateMeter}
        />
      ) : null}

      {editingId ? (
        <EditMeterIntegrationModal
          meterIntegrationId={editingId}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      {deprecating ? (
        <DeprecateMeterIntegrationModal
          meter={deprecating}
          isSubmitting={changeMeterStatus.isPending}
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
            if (!changeMeterStatus.isPending) setDeprecating(null)
          }}
          onConfirm={(reason) =>
            void changeIntegrationStatus(deprecating, 'DEPRECATED', reason)
          }
        />
      ) : null}
    </div>
  )
}

function EditMeterIntegrationModal({
  meterIntegrationId,
  onClose,
}: {
  meterIntegrationId: string
  onClose: () => void
}) {
  const meterQuery = useMeterIntegration(meterIntegrationId)
  const updateMeter = useUpdateMeterIntegration()
  const { showToast } = useToast()
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<MeterFormField | 'class', string>>
  >({})
  const meter = meterQuery.data

  const updateIntegration = async (data: MeterFormValues) => {
    if (!meter) return
    setFieldErrors({})

    try {
      const integration = await updateMeter.mutateAsync({
        meterIntegrationId,
        manufacturer: data.manufacturer,
        model: data.model,
        class: data.meterClass.toLowerCase().replaceAll('-', ' '),
        category: data.category.toLowerCase().replaceAll('-', ''),
        protocol: data.protocol,
        authenticationType: data.authenticationType,
        password: data.password,
        ...(data.description ? { description: data.description } : {}),
      })
      onClose()
      showToast({
        title: 'Meter integration updated',
        message: `${integration.manufacturer} ${integration.model} was updated.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getMeterIntegrationError(error)
      const { class: meterClassError, ...serverFields } = apiError.fields
      const normalizedFields = {
        ...serverFields,
        ...(meterClassError ? { meterClass: meterClassError } : {}),
      }
      setFieldErrors(apiError.status === 409 &&
        Object.keys(normalizedFields).length === 0
        ? {
            manufacturer: 'This manufacturer and model combination already exists.',
            model: 'This manufacturer and model combination already exists.',
          }
        : normalizedFields)
      showToast({
        title: apiError.status === 409
          ? 'Meter integration already exists'
          : apiError.message,
        message: apiError.requestId ? `Request ID: ${apiError.requestId}` : undefined,
        variant: 'error',
      })
    }
  }

  if (!meter) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="modal">
          <div className="modal-head">
            <h2 className="modal-title">Edit Meter</h2>
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <AsyncState
            isPending={meterQuery.isPending}
            error={meterQuery.error}
            onRetry={() => void meterQuery.refetch()}
          >
            {null}
          </AsyncState>
        </div>
      </div>
    )
  }

  return (
    <MeterFormModal
      title="Edit Meter"
      submitLabel="Save"
      submittingLabel="Saving…"
      initial={{
        manufacturer: meter.manufacturer,
        category: formatCategoryForForm(meter.category),
        meterClass: formatClassForForm(meter.class),
        model: meter.model,
        protocol: meter.protocol,
        authenticationType: meter.authenticationType,
        description: meter.description,
      }}
      isSubmitting={updateMeter.isPending}
      fieldErrors={fieldErrors}
      onFieldChange={(field) => {
        setFieldErrors((current) => {
          if (!current[field]) return current
          const next = { ...current }
          delete next[field]
          return next
        })
      }}
      onClose={() => {
        if (!updateMeter.isPending) onClose()
      }}
      onSubmit={(values) => void updateIntegration(values)}
    />
  )
}

function DeprecateMeterIntegrationModal({
  meter,
  isSubmitting,
  fieldErrors,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  meter: MeterIntegrationSummary
  isSubmitting: boolean
  fieldErrors: Partial<Record<MeterIntegrationStatusField, string>>
  onReasonChange: () => void
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onCancel)

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deprecate-meter-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="deprecate-meter-title" className="modal-title">
              Deprecate Meter
            </h2>
            <p className="modal-subtitle">
              Are you sure you want to deprecate {meter.model}?
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {fieldErrors.status ? (
            <p className="modal-field-error" role="alert">{fieldErrors.status}</p>
          ) : null}
          <div className="modal-field">
            <label htmlFor="meter-deprecation-reason">
              Reason <span className="req">*</span>
            </label>
            <textarea
              id="meter-deprecation-reason"
              className="modal-input"
              rows={3}
              placeholder="Explain why this meter is being deprecated"
              value={reason}
              aria-invalid={Boolean(fieldErrors.reason)}
              disabled={isSubmitting}
              onChange={(event) => {
                setReason(event.target.value)
                onReasonChange()
              }}
            />
            {fieldErrors.reason ? (
              <span className="modal-field-error" role="alert">
                {fieldErrors.reason}
              </span>
            ) : null}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger-solid"
              onClick={() => onConfirm(reason)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deprecating…' : 'Deprecate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusFilterDropdown({
  value,
  onChange,
}: {
  value: MeterIntegrationStatus | ''
  onChange: (value: MeterIntegrationStatus | '') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)
  const { anchorRef, menuStyle } = useAnchoredMenu(open)

  const select = (nextStatus: MeterIntegrationStatus | '') => {
    onChange(nextStatus)
    setOpen(false)
  }

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="filter-btn"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Filter <ChevronRightIcon />
      </button>
      {open ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button
            type="button"
            className={`row-menu-item${value === '' ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => select('')}
          >
            All statuses
          </button>
          <button
            type="button"
            className={`row-menu-item${value === 'ACTIVE' ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => select('ACTIVE')}
          >
            Active
          </button>
          <button
            type="button"
            className={`row-menu-item${value === 'DEPRECATED' ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => select('DEPRECATED')}
          >
            Deprecated
          </button>
        </div>
      ) : null}
    </div>
  )
}

function formatIntegrationValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '—'
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatIntegrationDate(value: unknown) {
  if (typeof value !== 'string') return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : formatAddedDate(date)
}

function formatClassForForm(value: unknown) {
  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase().replaceAll(/[_-]+/g, ' ')
    : ''
  if (normalized === 'single phase') return 'Single-Phase'
  if (normalized === 'three phase') return 'Three-Phase'
  if (normalized === 'md') return 'MD'
  return ''
}

function formatCategoryForForm(value: unknown) {
  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase().replaceAll(/[_\s-]+/g, '')
    : ''
  if (normalized === 'prepaid') return 'Prepaid'
  if (normalized === 'postpaid') return 'Post-paid'
  return ''
}

function RowActions({
  isOpen,
  status,
  onToggle,
  onClose,
  onView,
  onEdit,
  onAddObis,
  onActivate,
  onDeprecate,
}: {
  isOpen: boolean
  status: MeterIntegrationStatus
  onToggle: () => void
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onAddObis: () => void
  onActivate: () => void
  onDeprecate: () => void
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
            <ClipboardIcon /> View Meter
          </button>
          <button type="button" className="row-menu-item" role="menuitem" onClick={onEdit}>
            <PencilIcon /> Edit Meter
          </button>
          <button type="button" className="row-menu-item" role="menuitem" onClick={onAddObis}>
            <PlusCircleIcon /> Add OBIS Code
          </button>
          {status === 'ACTIVE' ? (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onDeprecate}>
              <TrashIcon /> Deprecate Meter
            </button>
          ) : (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onActivate}>
              <BadgeCheckIcon /> Activate Meter
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

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
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

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function BadgeCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5 14 4.7l2.9-.5.5 2.9 2.2 2-2.2 2 .5 2.9-2.9.5-2 2.2-2-2.2-2.9-.5.5-2.9-2.2-2 2.2-2-.5-2.9 2.9.5Z" transform="translate(0 3)" />
      <path d="m9.5 13.5 1.8 1.8 3.4-3.6" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

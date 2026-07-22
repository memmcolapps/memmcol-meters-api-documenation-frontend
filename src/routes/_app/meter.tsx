import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useToast } from '../../app/toastContext'
import { useDismiss } from '../../app/useDismiss'
import { useAnchoredMenu } from '../../app/useAnchoredMenu'
import { DatePicker } from '../../app/DatePicker'
import { getApiErrorMessage } from '../../lib/api/client'
import {
  useMeters,
  useDeleteMeter,
  useUpdateMeterStatus,
  type Meter,
  type MeterStatus,
} from '../../features/meters/meterQueries'

export const Route = createFileRoute('/_app/meter')({
  component: MeterPage,
})

const PAGE_SIZE = 10

function generatePages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = []
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('…', total)
  } else if (current >= total - 3) {
    pages.push(1, '…')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1, '…')
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push('…', total)
  }
  return pages
}

function MeterPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<MeterStatus | ''>('')
  const search = ''
  const sortBy = 'createdAt'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [date, setDate] = useState<Date | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null)

  const params = {
    page,
    pageSize: PAGE_SIZE,
    ...(status ? { status: status as MeterStatus } : {}),
    ...(search ? { search } : {}),
    sortBy,
    sortOrder,
    ...(date ? { date: date.toISOString().split('T')[0] } : {}),
  }

  const { data, isLoading, isError } = useMeters(params)
  const updateMeterStatus = useUpdateMeterStatus()

  const meters = data?.items ?? []
  const pagination = data?.pagination
  const isEmpty = !isLoading && !isError && meters.length === 0

  const toggleStatus = (id: string, currentStatus: MeterStatus) => {
    const newStatus: MeterStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE'
    updateMeterStatus.mutate({ id, status: newStatus })
    setOpenMenu(null)
  }

  const confirmDelete = (meter: Meter) => {
    setDeleteTarget(meter)
    setOpenMenu(null)
  }

  const allPages = pagination ? generatePages(page, pagination.totalPages) : []
  const hasNext = pagination ? page < pagination.totalPages : false
  const hasPrev = page > 1

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Meters</h1>
          <p className="dash-subtitle">Add, Manage and Access meter records.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setAddOpen(true)}>
          Add Meters <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Meter list
        </button>
      </div>

      {isLoading ? (
        <div className="meter-empty">
          <p className="meter-empty-text">Loading meters...</p>
        </div>
      ) : isError ? (
        <div className="meter-empty">
          <p className="meter-empty-text">Failed to load meters. Please try again.</p>
        </div>
      ) : isEmpty ? (
        <div className="meter-empty">
          <p className="meter-empty-text">No meters Available</p>
          <button type="button" className="btn-primary" onClick={() => setAddOpen(true)}>
            Add Meters <PlusIcon />
          </button>
        </div>
      ) : (
        <>
          <div className="dash-toolbar">
            <div className="dash-filters">
              <DatePicker
                placeholder="Today"
                initialDate={date ?? undefined}
                onChange={(d) => { setDate(d); setPage(1) }}
              />
              <select
                className="filter-btn filter-select"
                value={status}
                onChange={(e) => { setStatus(e.target.value as MeterStatus | ''); setPage(1) }}
              >
                <option value="">All status</option>
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
              <SortDropdown
                value={sortOrder}
                onChange={(order) => { setSortOrder(order); setPage(1) }}
              />
            </div>
            <button type="button" className="btn-outline btn-icon">
              Download <DownloadIcon />
            </button>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" aria-label="Select all rows" />
                  </th>
                  <th>S/N</th>
                  <th>Meter no</th>
                  <th>SIM Number</th>
                  <th>Meter Manufacturer</th>
                  <th>Meter Model</th>
                  <th>Meter Class</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meters.map((meter, index) => (
                  <tr key={meter.id}>
                    <td className="col-check">
                      <input type="checkbox" aria-label={`Select meter ${(page - 1) * PAGE_SIZE + index + 1}`} />
                    </td>
                    <td>{String((page - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}</td>
                    <td>{meter.meterNumber}</td>
                    <td>{meter.simNumber}</td>
                    <td>{meter.manufacturer}</td>
                    <td>{meter.model}</td>
                    <td>{meter.meterClass}</td>
                    <td>
                      <span
                        className={`code-badge${meter.status === 'ACTIVE' ? ' is-ok' : ' is-error'}`}
                      >
                        {meter.status === 'ACTIVE' ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="col-actions">
                      <RowActions
                        isOpen={openMenu === meter.id}
                        status={meter.status}
                        onToggle={() =>
                          setOpenMenu((prev) => (prev === meter.id ? null : meter.id))
                        }
                        onClose={() => setOpenMenu(null)}
                        onToggleStatus={() => toggleStatus(meter.id, meter.status)}
                        onDelete={() => confirmDelete(meter)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="pagination" aria-label="Pagination">
            <button
              type="button"
              className="page-nav"
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon /> Previous
            </button>
            <div className="page-numbers">
              {allPages.map((p, index) =>
                p === '…' ? (
                  <span key={`gap-${index}`} className="page-gap">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={p}
                    className={`page-num${p === page ? ' is-active' : ''}`}
                    aria-current={p === page ? 'page' : undefined}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              className="page-nav"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRightIcon />
            </button>
          </nav>
        </>
      )}

      {addOpen ? (
        <AddMeterModal onClose={() => setAddOpen(false)} />
      ) : null}

      {deleteTarget ? (
        <DeleteMeterModal
          meter={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  )
}

// Meter types integrated by admins (see /admin/meter-integration).
// Fed by the API later; only Active types are selectable here.
const supportedMeters = [
  { manufacturer: 'Momas', meterClass: 'MD', model: 'MMX-313-CT', status: 'Active' },
  { manufacturer: 'Momas', meterClass: 'Single-Phase', model: 'MMX-110NG', status: 'Active' },
  { manufacturer: 'Momas', meterClass: 'Three-Phase', model: 'MMX-310-NG', status: 'Deprecated' },
  { manufacturer: 'Momas', meterClass: 'MD', model: 'MMX-312-CT', status: 'Active' },
]

const activeSupportedMeters = supportedMeters.filter((m) => m.status === 'Active')

function AddMeterModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [form, setForm] = useState({
    meterNo: '',
    sim: '',
    meterType: '',
    oldSgc: '',
    newSgc: '',
    oldKrn: '',
    newKrn: '',
    oldTariff: '',
    newTariff: '',
  })
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const selectedType = activeSupportedMeters.find((m) => m.model === form.meterType)

  const canSubmit = Boolean(form.meterNo && form.sim && selectedType)

  const handleSubmit = () => {
    if (!selectedType || !canSubmit) return
    // TODO: implement create meter API call when endpoint is available
    onClose()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-meter-title">
      <div className="modal modal--wide" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="add-meter-title" className="modal-title">
              Add new meter
            </h2>
            <p className="modal-subtitle">Basic Information</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <Field label="Meter Number" required>
              <input
                className="modal-input"
                placeholder="E.g. 04040404040"
                value={form.meterNo}
                onChange={(e) => set('meterNo', e.target.value)}
              />
            </Field>
            <Field label="Sim Card Number" required>
              <input
                className="modal-input"
                placeholder="E.g. 89006809734095874"
                value={form.sim}
                onChange={(e) => set('sim', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Meter Type" required>
            <select
              className="modal-select"
              value={form.meterType}
              onChange={(e) => set('meterType', e.target.value)}
            >
              <option value="" disabled>
                Select Meter Type
              </option>
              {activeSupportedMeters.map((m) => (
                <option key={m.model} value={m.model}>
                  {m.model} — {m.manufacturer} ({m.meterClass})
                </option>
              ))}
            </select>
          </Field>

          <div className="modal-grid">
            <Field label="Old SGC" required>
              <input className="modal-input" placeholder="Enter old sgc" value={form.oldSgc} onChange={(e) => set('oldSgc', e.target.value)} />
            </Field>
            <Field label="New SGC" required>
              <input className="modal-input" placeholder="Enter new sgc" value={form.newSgc} onChange={(e) => set('newSgc', e.target.value)} />
            </Field>
            <Field label="Old KRN" required>
              <input className="modal-input" placeholder="Enter old krn" value={form.oldKrn} onChange={(e) => set('oldKrn', e.target.value)} />
            </Field>
            <Field label="New KRN" required>
              <input className="modal-input" placeholder="Enter new krn" value={form.newKrn} onChange={(e) => set('newKrn', e.target.value)} />
            </Field>
            <Field label="Old Tariff Index" required>
              <input className="modal-input" placeholder="Enter old tariff index" value={form.oldTariff} onChange={(e) => set('oldTariff', e.target.value)} />
            </Field>
            <Field label="New Tariff Index" required>
              <input className="modal-input" placeholder="Enter new tariff index" value={form.newTariff} onChange={(e) => set('newTariff', e.target.value)} />
            </Field>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
              Add Meters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortDropdown({
  value,
  onChange,
}: {
  value: 'asc' | 'desc'
  onChange: (value: 'asc' | 'desc') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)
  const { anchorRef, menuStyle } = useAnchoredMenu(open)

  const select = (order: 'asc' | 'desc') => {
    onChange(order)
    setOpen(false)
  }

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="filter-btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Sort <SortIcon />
      </button>
      {open ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button
            type="button"
            className={`row-menu-item${value === 'desc' ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => select('desc')}
          >
            Descending
          </button>
          <button
            type="button"
            className={`row-menu-item${value === 'asc' ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => select('asc')}
          >
            Ascending
          </button>
        </div>
      ) : null}
    </div>
  )
}

function DeleteMeterModal({
  meter,
  onClose,
}: {
  meter: Meter
  onClose: () => void
}) {
  const deleteMeter = useDeleteMeter()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const handleDelete = async () => {
    try {
      await deleteMeter.mutateAsync(meter.id)
      showToast({
        title: 'Meter deleted',
        message: `${meter.meterNumber} has been deleted.`,
        variant: 'success',
      })
      onClose()
    } catch (error) {
      showToast({
        title: 'Could not delete meter',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-meter-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="delete-meter-title" className="modal-title">Confirm Action</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this meter?</p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-neutral"
              onClick={onClose}
              disabled={deleteMeter.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-remove"
              onClick={handleDelete}
              disabled={deleteMeter.isPending}
            >
              {deleteMeter.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="modal-field">
      <label>
        {label} {required ? <span className="req">*</span> : null}
      </label>
      {children}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function RowActions({
  isOpen,
  status,
  onToggle,
  onClose,
  onToggleStatus,
  onDelete,
}: {
  isOpen: boolean
  status: MeterStatus
  onToggle: () => void
  onClose: () => void
  onToggleStatus: () => void
  onDelete: () => void
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
          <button type="button" className="row-menu-item" role="menuitem">
            View details
          </button>
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onToggleStatus}
          >
            {status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className="row-menu-item is-danger"
            role="menuitem"
            onClick={onDelete}
          >
            Delete
          </button>
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

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M5 21h14" />
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

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
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

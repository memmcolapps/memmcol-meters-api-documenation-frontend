import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../app/useDismiss'
import { useAnchoredMenu } from '../../app/useAnchoredMenu'
import { DatePicker } from '../../app/DatePicker'
import { useToast } from '../../app/toastContext'
import {
  getMeterIntegrationError,
  useActiveMeterIntegrationOptions,
} from '../../features/admin-meters/adminMeterQueries'
import {
  getCreateMeterError,
  useCreateMeter,
  type CreateMeterInput,
} from '../../features/meters/meterQueries'

export const Route = createFileRoute('/_app/meter')({
  component: MeterPage,
})

type MeterStatus = 'Active' | 'Deactivated'

type Meter = {
  id: string
  meterNo: string
  sim: string
  manufacturer: string
  model: string
  meterClass: string
  status: MeterStatus
}

function makeMeter(index: number): Meter {
  return {
    id: `m-${index}`,
    meterNo: '62526000005',
    sim: '737842875239738',
    manufacturer: 'Momas',
    model: 'MMX-310-NG',
    meterClass: 'Single-phase',
    status: index === 1 ? 'Deactivated' : 'Active',
  }
}

const seededMeters: Meter[] = Array.from({ length: 10 }, (_, i) => makeMeter(i + 1))

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

type MeterFormField =
  | 'meterNumber'
  | 'simNumber'
  | 'meterTypeId'
  | 'oldSgc'
  | 'newSgc'
  | 'oldKrn'
  | 'newKrn'
  | 'oldTariffIndex'
  | 'newTariffIndex'

type MeterFormErrors = Partial<Record<MeterFormField, string>>

type MeterFormValues = Record<MeterFormField, string>

const meterFormFieldAliases: Record<string, MeterFormField> = {
  meterNumber: 'meterNumber',
  simNumber: 'simNumber',
  meterTypeId: 'meterTypeId',
  oldSgc: 'oldSgc',
  newSgc: 'newSgc',
  oldKrn: 'oldKrn',
  newKrn: 'newKrn',
  oldTariffIndex: 'oldTariffIndex',
  newTariffIndex: 'newTariffIndex',
  'keyChange.oldSgc': 'oldSgc',
  'keyChange.newSgc': 'newSgc',
  'keyChange.oldKrn': 'oldKrn',
  'keyChange.newKrn': 'newKrn',
  'keyChange.oldTariffIndex': 'oldTariffIndex',
  'keyChange.newTariffIndex': 'newTariffIndex',
}

const keyChangeFields: Array<{ field: MeterFormField; label: string }> = [
  { field: 'oldSgc', label: 'Old SGC' },
  { field: 'newSgc', label: 'New SGC' },
  { field: 'oldKrn', label: 'Old KRN' },
  { field: 'newKrn', label: 'New KRN' },
  { field: 'oldTariffIndex', label: 'Old tariff index' },
  { field: 'newTariffIndex', label: 'New tariff index' },
]

function normalizeMeterFieldErrors(fields: Record<string, string>) {
  return Object.entries(fields).reduce<MeterFormErrors>((errors, [field, message]) => {
    const formField = meterFormFieldAliases[field]
    if (formField) errors[formField] = message
    return errors
  }, {})
}

function validateMeterForm(form: MeterFormValues) {
  const errors: MeterFormErrors = {}

  if (!form.meterNumber.trim()) {
    errors.meterNumber = 'Meter number is required.'
  } else if (!/^\d+$/.test(form.meterNumber.trim())) {
    errors.meterNumber = 'Meter number must contain digits only.'
  }

  if (!form.simNumber.trim()) {
    errors.simNumber = 'SIM number is required.'
  } else if (!/^\d+$/.test(form.simNumber.trim())) {
    errors.simNumber = 'SIM number must contain digits only.'
  }

  if (!form.meterTypeId) errors.meterTypeId = 'Select a meter type.'

  keyChangeFields.forEach(({ field, label }) => {
    const value = form[field].trim()
    if (!value) {
      errors[field] = `${label} is required.`
    } else if (!/^\d+$/.test(value)) {
      errors[field] = `${label} must be a whole number.`
    } else if (!Number.isSafeInteger(Number(value))) {
      errors[field] = `${label} is too large.`
    }
  })

  return errors
}

function formatMeterClass(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-')
}

function MeterPage() {
  const [meters, setMeters] = useState<Meter[]>(seededMeters)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const createMeter = useCreateMeter()
  const { showToast } = useToast()

  const openAddModal = () => {
    createMeter.reset()
    setAddOpen(true)
  }

  const addMeter = async (input: CreateMeterInput): Promise<MeterFormErrors | null> => {
    try {
      const meter = await createMeter.mutateAsync(input)
      const addedMeter: Meter = {
        id: meter.id,
        meterNo: meter.meterNumber,
        sim: meter.simNumber,
        manufacturer: meter.manufacturer,
        model: meter.model,
        meterClass: formatMeterClass(meter.meterClass),
        status: meter.status === 'ACTIVE' ? 'Active' : 'Deactivated',
      }
      setMeters((current) => [...current, addedMeter])
      setAddOpen(false)
      showToast({
        title: 'Meter created',
        message: `${meter.meterNumber} is now ${meter.status.toLowerCase()}.`,
        variant: 'success',
      })
      return null
    } catch (error) {
      const apiError = getCreateMeterError(error)
      const normalizedFields = normalizeMeterFieldErrors(apiError.fields)
      const fields = apiError.status === 409 && Object.keys(normalizedFields).length === 0
        ? {
            meterNumber: 'Meter number or SIM number already exists.',
            simNumber: 'Meter number or SIM number already exists.',
          }
        : normalizedFields
      const fieldMessage = [...new Set(Object.values(fields))].join(' ')
      showToast({
        title: apiError.status === 409
          ? 'Meter or SIM already exists'
          : apiError.message,
        message: [
          fieldMessage || (apiError.status === 409 ? apiError.message : ''),
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · ') || undefined,
        variant: 'error',
      })
      return fields
    }
  }

  const toggleStatus = (id: string) => {
    setMeters((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'Active' ? 'Deactivated' : 'Active' }
          : m,
      ),
    )
    setOpenMenu(null)
  }

  const removeMeter = (id: string) => {
    setMeters((prev) => prev.filter((m) => m.id !== id))
    setOpenMenu(null)
  }

  const isEmpty = meters.length === 0

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Meters</h1>
          <p className="dash-subtitle">Add, Manage and Access meter records.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          Add Meters <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Meter list
        </button>
      </div>

      {isEmpty ? (
        <div className="meter-empty">
          <p className="meter-empty-text">No meters Available</p>
          <button type="button" className="btn-primary" onClick={openAddModal}>
            Add Meters <PlusIcon />
          </button>
        </div>
      ) : (
        <>
          <div className="dash-toolbar">
            <div className="dash-filters">
              <DatePicker placeholder="Today" />
              <button type="button" className="filter-btn">
                All code <ChevronRightIcon />
              </button>
              <button type="button" className="filter-btn">
                Sort <SortIcon />
              </button>
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
                      <input type="checkbox" aria-label={`Select meter ${index + 1}`} />
                    </td>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{meter.meterNo}</td>
                    <td>{meter.sim}</td>
                    <td>{meter.manufacturer}</td>
                    <td>{meter.model}</td>
                    <td>{meter.meterClass}</td>
                    <td>
                      <span
                        className={`code-badge${meter.status === 'Active' ? ' is-ok' : ' is-error'}`}
                      >
                        {meter.status}
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
                        onToggleStatus={() => toggleStatus(meter.id)}
                        onDelete={() => removeMeter(meter.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="pagination" aria-label="Pagination">
            <button type="button" className="page-nav" disabled>
              <ChevronLeftIcon /> Previous
            </button>
            <div className="page-numbers">
              {pages.map((page, index) =>
                page === '…' ? (
                  <span key={`gap-${index}`} className="page-gap">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={page}
                    className={`page-num${page === currentPage ? ' is-active' : ''}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button type="button" className="page-nav">
              Next <ChevronRightIcon />
            </button>
          </nav>
        </>
      )}

      {addOpen ? (
        <AddMeterModal
          isSubmitting={createMeter.isPending}
          onClose={() => {
            if (!createMeter.isPending) setAddOpen(false)
          }}
          onAdd={addMeter}
        />
      ) : null}
    </div>
  )
}

function AddMeterModal({
  isSubmitting,
  onClose,
  onAdd,
}: {
  isSubmitting: boolean
  onClose: () => void
  onAdd: (input: CreateMeterInput) => Promise<MeterFormErrors | null>
}) {
  const [form, setForm] = useState<MeterFormValues>({
    meterNumber: '',
    simNumber: '',
    meterTypeId: '',
    oldSgc: '',
    newSgc: '',
    oldKrn: '',
    newKrn: '',
    oldTariffIndex: '',
    newTariffIndex: '',
  })
  const [fieldErrors, setFieldErrors] = useState<MeterFormErrors>({})
  const meterTypesQuery = useActiveMeterIntegrationOptions()
  const meterTypes = meterTypesQuery.data ?? []
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: MeterFormField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async () => {
    const validationErrors = validateMeterForm(form)
    if (
      form.meterTypeId &&
      !meterTypes.some((integration) => integration.id === form.meterTypeId)
    ) {
      validationErrors.meterTypeId = 'Select a valid meter type.'
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    const serverErrors = await onAdd({
      meterNumber: form.meterNumber.trim(),
      simNumber: form.simNumber.trim(),
      meterTypeId: form.meterTypeId,
      keyChange: {
        oldSgc: Number(form.oldSgc),
        newSgc: Number(form.newSgc),
        oldKrn: Number(form.oldKrn),
        newKrn: Number(form.newKrn),
        oldTariffIndex: Number(form.oldTariffIndex),
        newTariffIndex: Number(form.newTariffIndex),
      },
    })
    if (serverErrors) setFieldErrors(serverErrors)
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
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose} disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <Field htmlFor="meter-number" label="Meter Number" required error={fieldErrors.meterNumber}>
              <input
                id="meter-number"
                className="modal-input"
                placeholder="E.g. 04040404040"
                inputMode="numeric"
                autoComplete="off"
                value={form.meterNumber}
                aria-invalid={Boolean(fieldErrors.meterNumber)}
                disabled={isSubmitting}
                onChange={(e) => set('meterNumber', e.target.value)}
              />
            </Field>
            <Field htmlFor="sim-number" label="Sim Card Number" required error={fieldErrors.simNumber}>
              <input
                id="sim-number"
                className="modal-input"
                placeholder="E.g. 89006809734095874"
                inputMode="numeric"
                autoComplete="off"
                value={form.simNumber}
                aria-invalid={Boolean(fieldErrors.simNumber)}
                disabled={isSubmitting}
                onChange={(e) => set('simNumber', e.target.value)}
              />
            </Field>
          </div>

          <Field htmlFor="meter-type" label="Meter Type" required error={fieldErrors.meterTypeId}>
            <select
              id="meter-type"
              className="modal-select"
              value={form.meterTypeId}
              aria-invalid={Boolean(fieldErrors.meterTypeId)}
              disabled={isSubmitting || meterTypesQuery.isPending || meterTypesQuery.isError}
              onChange={(e) => set('meterTypeId', e.target.value)}
            >
              <option value="" disabled>
                {meterTypesQuery.isPending ? 'Loading meter types…' : 'Select Meter Type'}
              </option>
              {meterTypes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.model} — {m.manufacturer}
                </option>
              ))}
            </select>
            {meterTypesQuery.isError ? (
              <span className="modal-field-error" role="alert">
                {getMeterIntegrationError(meterTypesQuery.error).message}{' '}
                <button type="button" className="upload-link" onClick={() => void meterTypesQuery.refetch()}>
                  Try again
                </button>
              </span>
            ) : null}
            {!meterTypesQuery.isPending && !meterTypesQuery.isError && meterTypes.length === 0 ? (
              <span className="modal-field-error" role="alert">
                No active meter integrations are available.
              </span>
            ) : null}
          </Field>

          <div className="modal-grid">
            <Field htmlFor="old-sgc" label="Old SGC" required error={fieldErrors.oldSgc}>
              <input id="old-sgc" className="modal-input" inputMode="numeric" placeholder="Enter old sgc" value={form.oldSgc} aria-invalid={Boolean(fieldErrors.oldSgc)} disabled={isSubmitting} onChange={(e) => set('oldSgc', e.target.value)} />
            </Field>
            <Field htmlFor="new-sgc" label="New SGC" required error={fieldErrors.newSgc}>
              <input id="new-sgc" className="modal-input" inputMode="numeric" placeholder="Enter new sgc" value={form.newSgc} aria-invalid={Boolean(fieldErrors.newSgc)} disabled={isSubmitting} onChange={(e) => set('newSgc', e.target.value)} />
            </Field>
            <Field htmlFor="old-krn" label="Old KRN" required error={fieldErrors.oldKrn}>
              <input id="old-krn" className="modal-input" inputMode="numeric" placeholder="Enter old krn" value={form.oldKrn} aria-invalid={Boolean(fieldErrors.oldKrn)} disabled={isSubmitting} onChange={(e) => set('oldKrn', e.target.value)} />
            </Field>
            <Field htmlFor="new-krn" label="New KRN" required error={fieldErrors.newKrn}>
              <input id="new-krn" className="modal-input" inputMode="numeric" placeholder="Enter new krn" value={form.newKrn} aria-invalid={Boolean(fieldErrors.newKrn)} disabled={isSubmitting} onChange={(e) => set('newKrn', e.target.value)} />
            </Field>
            <Field htmlFor="old-tariff-index" label="Old Tariff Index" required error={fieldErrors.oldTariffIndex}>
              <input id="old-tariff-index" className="modal-input" inputMode="numeric" placeholder="Enter old tariff index" value={form.oldTariffIndex} aria-invalid={Boolean(fieldErrors.oldTariffIndex)} disabled={isSubmitting} onChange={(e) => set('oldTariffIndex', e.target.value)} />
            </Field>
            <Field htmlFor="new-tariff-index" label="New Tariff Index" required error={fieldErrors.newTariffIndex}>
              <input id="new-tariff-index" className="modal-input" inputMode="numeric" placeholder="Enter new tariff index" value={form.newTariffIndex} aria-invalid={Boolean(fieldErrors.newTariffIndex)} disabled={isSubmitting} onChange={(e) => set('newTariffIndex', e.target.value)} />
            </Field>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={isSubmitting || meterTypesQuery.isPending || meterTypes.length === 0} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Adding…' : 'Add Meter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  htmlFor,
  label,
  required,
  error,
  children,
}: {
  htmlFor: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="modal-field">
      <label htmlFor={htmlFor}>
        {label} {required ? <span className="req">*</span> : null}
      </label>
      {children}
      {error ? <span className="modal-field-error" role="alert">{error}</span> : null}
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
            {status === 'Active' ? 'Deactivate' : 'Activate'}
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

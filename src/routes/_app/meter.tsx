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
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<MeterStatus | ''>('')
  const search = ''
  const sortBy = 'createdAt'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [date, setDate] = useState<Date | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null)
  const [detailTarget, setDetailTarget] = useState<Meter | null>(null)

  const params = {
    page,
    pageSize: PAGE_SIZE,
    ...(status ? { status: status as MeterStatus } : {}),
    ...(search ? { search } : {}),
    sortBy,
    sortOrder,
    ...(date ? { date: date.toISOString().split('T')[0] } : {}),
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
        <button type="button" className="btn-primary" onClick={openAddModal}>
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
          <button type="button" className="btn-primary" onClick={openAddModal}>
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
                        onViewDetails={() => { setDetailTarget(meter); setOpenMenu(null) }}
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

      {detailTarget ? (
        <MeterDetailsDialog
          meter={detailTarget}
          onClose={() => setDetailTarget(null)}
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

  const selectedType = activeSupportedMeters.find((m) => m.model === form.meterType)

  const canSubmit = Boolean(form.meterNo && form.sim && selectedType)

  const handleSubmit = () => {
    if (!selectedType || !canSubmit) return
    // TODO: implement create meter API call when endpoint is available
    onClose()
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

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.18)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
}

const dialogStyle: React.CSSProperties = {
  width: 500,
  background: '#fff',
  borderRadius: 16,
  padding: '20px 24px',
  boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
  fontFamily: 'Inter, sans-serif',
}

const detailHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
}

const detailTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 600,
  color: '#333',
}

const closeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 26,
  cursor: 'pointer',
  color: '#667085',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 40,
}

const itemStyle: React.CSSProperties = {
  marginBottom: 16,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#404040',
  marginBottom: 4,
}

const valueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: '#6b7280',
}

const footerStyle: React.CSSProperties = {
  marginTop: 16,
}

const cancelBtnStyle: React.CSSProperties = {
  background: 'white',
  border: '2px solid #0b6b3a',
  color: '#0b6b3a',
  padding: '12px 28px',
  borderRadius: 6,
  fontSize: 16,
  cursor: 'pointer',
}

function MeterDetailsDialog({
  meter,
  onClose,
}: {
  meter: Meter
  onClose: () => void
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle} ref={modalRef}>
        <div style={detailHeaderStyle}>
          <h2 style={detailTitleStyle}>Meter Details</h2>
          <button style={closeBtnStyle} onClick={onClose}>✕</button>
        </div>

        <div style={gridStyle}>
          <div>
            <div style={itemStyle}>
              <label style={labelStyle}>Meter Number</label>
              <p style={valueStyle}>{meter.meterNumber}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>Meter Manufacturer</label>
              <p style={valueStyle}>{meter.manufacturer}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>Meter Model</label>
              <p style={valueStyle}>{meter.model}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>Old SGC</label>
              <p style={valueStyle}>{meter.oldSgc ?? '-'}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>Old KRN</label>
              <p style={valueStyle}>{meter.oldKrn ?? '-'}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>Old Tariff Index</label>
              <p style={valueStyle}>{meter.oldTariffIndex ?? '-'}</p>
            </div>
          </div>
          <div>
            <div style={itemStyle}>
              <label style={labelStyle}>SIM Number</label>
              <p style={valueStyle}>{meter.simNumber}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>Meter Class</label>
              <p style={valueStyle}>{meter.meterClass}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>New SGC</label>
              <p style={valueStyle}>{meter.newSgc ?? '-'}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>New KRN</label>
              <p style={valueStyle}>{meter.newKrn ?? '-'}</p>
            </div>
            <div style={itemStyle}>
              <label style={labelStyle}>New Tariff Index</label>
              <p style={valueStyle}>{meter.newTariffIndex ?? '-'}</p>
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          <button
            style={cancelBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0b6b3a'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#0b6b3a'
            }}
          >
            Cancel
          </button>
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
  onViewDetails,
  onToggleStatus,
  onDelete,
}: {
  isOpen: boolean
  status: MeterStatus
  onToggle: () => void
  onClose: () => void
  onViewDetails: () => void
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
          <button type="button" className="row-menu-item" role="menuitem" onClick={onViewDetails}>
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

import { useDeferredValue, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useToast } from '../../app/toastContext'
import { useDismiss } from '../../app/useDismiss'
import { useAnchoredMenu } from '../../app/useAnchoredMenu'
import { getApiErrorMessage } from '../../lib/api/client'
import {
  getMeterIntegrationError,
  useActiveMeterIntegrationOptions,
} from '../../features/admin-meters/adminMeterQueries'
import {
  getCreateMeterError,
  useCreateMeter,
  useExportMeters,
  useMeterDetails,
  useMeters,
  useDeleteMeter,
  useUpdateMeterStatus,
  type CreateMeterInput,
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

type MeterFormValues = Record<MeterFormField, string>
type MeterFormErrors = Partial<Record<MeterFormField, string>>

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

function MeterPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<MeterStatus | ''>('')
  const [search, setSearch] = useState('')
  const sortBy = 'createdAt'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null)
  const [detailMeterId, setDetailMeterId] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search.trim())

  const params = {
    page,
    pageSize: PAGE_SIZE,
    ...(status ? { status: status as MeterStatus } : {}),
    ...(deferredSearch ? { search: deferredSearch } : {}),
    sortBy,
    sortOrder,
  }

  const { data, isLoading, isError } = useMeters(params)
  const updateMeterStatus = useUpdateMeterStatus()
  const exportMeters = useExportMeters()
  const { showToast } = useToast()

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

  const handleExport = async () => {
    try {
      const { blob, filename } = await exportMeters.mutateAsync({
        ...(status ? { status } : {}),
        ...(deferredSearch ? { search: deferredSearch } : {}),
        sortBy,
        sortOrder,
      })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || `meters-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000)
    } catch (error) {
      showToast({
        title: 'Could not export meters',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
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

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search meter or SIM number..."
              aria-label="Search by meter or SIM number"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <select
            className="filter-btn filter-select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as MeterStatus | '')
              setPage(1)
            }}
          >
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
          <SortDropdown
            value={sortOrder}
            onChange={(order) => {
              setSortOrder(order)
              setPage(1)
            }}
          />
        </div>
        <button
          type="button"
          className="btn-outline btn-icon"
          disabled={exportMeters.isPending}
          onClick={() => void handleExport()}
        >
          {exportMeters.isPending ? 'Exporting…' : 'Download'} <DownloadIcon />
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
                        onViewDetails={() => { setDetailMeterId(meter.id); setOpenMenu(null) }}
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

      {detailMeterId ? (
        <MeterDetailsDialog
          meterId={detailMeterId}
          onClose={() => setDetailMeterId(null)}
        />
      ) : null}
    </div>
  )
}

function AddMeterModal({
  onClose,
}: {
  onClose: () => void
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
  const createMeter = useCreateMeter()
  const meterTypesQuery = useActiveMeterIntegrationOptions()
  const meterTypes = meterTypesQuery.data ?? []
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  const isSubmitting = createMeter.isPending
  const requestClose = () => {
    if (!isSubmitting) onClose()
  }
  useDismiss(modalRef, requestClose)

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
      !meterTypes.some((meterType) => meterType.id === form.meterTypeId)
    ) {
      validationErrors.meterTypeId = 'Select a valid meter type.'
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    const input: CreateMeterInput = {
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
    }

    try {
      const meter = await createMeter.mutateAsync(input)
      showToast({
        title: 'Meter created',
        message: `${meter.meterNumber} was added successfully.`,
        variant: 'success',
      })
      onClose()
    } catch (error) {
      const apiError = getCreateMeterError(error)
      const normalizedFields = normalizeMeterFieldErrors(apiError.fields)
      const errors = apiError.status === 409 && Object.keys(normalizedFields).length === 0
        ? {
            meterNumber: 'Meter number or SIM number already exists.',
            simNumber: 'Meter number or SIM number already exists.',
          }
        : normalizedFields
      setFieldErrors(errors)
      showToast({
        title: apiError.status === 409
          ? 'Meter or SIM already exists'
          : 'Could not create meter',
        message: [
          apiError.message,
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · '),
        variant: 'error',
      })
    }
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
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={requestClose}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <Field label="Meter Number" required error={fieldErrors.meterNumber}>
              <input
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
            <Field label="Sim Card Number" required error={fieldErrors.simNumber}>
              <input
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

          <Field label="Meter Type" required error={fieldErrors.meterTypeId}>
            <select
              className="modal-select"
              value={form.meterTypeId}
              aria-invalid={Boolean(fieldErrors.meterTypeId)}
              disabled={isSubmitting || meterTypesQuery.isPending || meterTypesQuery.isError}
              onChange={(e) => set('meterTypeId', e.target.value)}
            >
              <option value="" disabled>
                {meterTypesQuery.isPending ? 'Loading meter types…' : 'Select Meter Type'}
              </option>
              {meterTypes.map((meterType) => (
                <option key={meterType.id} value={meterType.id}>
                  {meterType.model} — {meterType.manufacturer}
                  {meterType.category ? ` (${formatMeterCategory(meterType.category)})` : ''}
                </option>
              ))}
            </select>
            {meterTypesQuery.isError ? (
              <span className="modal-field-error" role="alert">
                {getMeterIntegrationError(meterTypesQuery.error).message}{' '}
                <button
                  type="button"
                  className="upload-link"
                  onClick={() => void meterTypesQuery.refetch()}
                >
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
            <Field label="Old SGC" required error={fieldErrors.oldSgc}>
              <input className="modal-input" inputMode="numeric" placeholder="Enter old sgc" value={form.oldSgc} aria-invalid={Boolean(fieldErrors.oldSgc)} disabled={isSubmitting} onChange={(e) => set('oldSgc', e.target.value)} />
            </Field>
            <Field label="New SGC" required error={fieldErrors.newSgc}>
              <input className="modal-input" inputMode="numeric" placeholder="Enter new sgc" value={form.newSgc} aria-invalid={Boolean(fieldErrors.newSgc)} disabled={isSubmitting} onChange={(e) => set('newSgc', e.target.value)} />
            </Field>
            <Field label="Old KRN" required error={fieldErrors.oldKrn}>
              <input className="modal-input" inputMode="numeric" placeholder="Enter old krn" value={form.oldKrn} aria-invalid={Boolean(fieldErrors.oldKrn)} disabled={isSubmitting} onChange={(e) => set('oldKrn', e.target.value)} />
            </Field>
            <Field label="New KRN" required error={fieldErrors.newKrn}>
              <input className="modal-input" inputMode="numeric" placeholder="Enter new krn" value={form.newKrn} aria-invalid={Boolean(fieldErrors.newKrn)} disabled={isSubmitting} onChange={(e) => set('newKrn', e.target.value)} />
            </Field>
            <Field label="Old Tariff Index" required error={fieldErrors.oldTariffIndex}>
              <input className="modal-input" inputMode="numeric" placeholder="Enter old tariff index" value={form.oldTariffIndex} aria-invalid={Boolean(fieldErrors.oldTariffIndex)} disabled={isSubmitting} onChange={(e) => set('oldTariffIndex', e.target.value)} />
            </Field>
            <Field label="New Tariff Index" required error={fieldErrors.newTariffIndex}>
              <input className="modal-input" inputMode="numeric" placeholder="Enter new tariff index" value={form.newTariffIndex} aria-invalid={Boolean(fieldErrors.newTariffIndex)} disabled={isSubmitting} onChange={(e) => set('newTariffIndex', e.target.value)} />
            </Field>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={requestClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={
                isSubmitting ||
                meterTypesQuery.isPending ||
                meterTypesQuery.isError ||
                meterTypes.length === 0
              }
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? 'Adding…' : 'Add Meter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatMeterCategory(category: string) {
  const normalized = category.trim().toUpperCase().replaceAll('-', '_')
  if (normalized === 'PREPAID') return 'Prepaid'
  if (normalized === 'POSTPAID' || normalized === 'POST_PAID') return 'Post-paid'

  return category
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
  maxHeight: '90vh',
  overflowY: 'auto',
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
  meterId,
  onClose,
}: {
  meterId: string
  onClose: () => void
}) {
  const meterQuery = useMeterDetails(meterId)
  const meter = meterQuery.data
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="meter-details-title">
      <div style={dialogStyle} ref={modalRef}>
        <div style={detailHeaderStyle}>
          <h2 id="meter-details-title" style={detailTitleStyle}>Meter Details</h2>
          <button type="button" style={closeBtnStyle} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        {meterQuery.isPending ? (
          <p style={valueStyle}>Loading meter details…</p>
        ) : meterQuery.isError ? (
          <div>
            <p className="modal-field-error" role="alert">
              {getApiErrorMessage(meterQuery.error)}
            </p>
            <button
              type="button"
              className="btn-outline"
              onClick={() => void meterQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : meter ? (
          <>
            <div style={gridStyle}>
              <div>
                <DetailItem label="Meter Number" value={meter.meterNumber} />
                <DetailItem label="Manufacturer" value={meter.manufacturer} />
                <DetailItem label="Model" value={meter.model} />
                <DetailItem
                  label="Category"
                  value={formatMeterCategory(meter.meterCategory)}
                />
                <DetailItem label="Status" value={formatMeterEnum(meter.status)} />
                <DetailItem label="Old SGC" value={meter.keyChange.oldSgc} />
                <DetailItem label="Old KRN" value={meter.keyChange.oldKrn} />
                <DetailItem
                  label="Old Tariff Index"
                  value={meter.keyChange.oldTariffIndex}
                />
              </div>
              <div>
                <DetailItem label="SIM Number" value={meter.simNumber} />
                <DetailItem
                  label="Meter Class"
                  value={formatMeterEnum(meter.meterClass)}
                />
                <DetailItem label="New SGC" value={meter.keyChange.newSgc} />
                <DetailItem label="New KRN" value={meter.keyChange.newKrn} />
                <DetailItem
                  label="New Tariff Index"
                  value={meter.keyChange.newTariffIndex}
                />
              </div>
            </div>

            <div style={footerStyle}>
              <button
                type="button"
                style={cancelBtnStyle}
                onClick={onClose}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = '#0b6b3a'
                  event.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = 'white'
                  event.currentTarget.style.color = '#0b6b3a'
                }}
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={itemStyle}>
      <span style={labelStyle}>{label}</span>
      <p style={valueStyle}>{value}</p>
    </div>
  )
}

function formatMeterEnum(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="modal-field">
      <label>
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

import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDismiss } from '../../../../app/useDismiss'
import { useToast } from '../../../../app/toastContext'
import { MeterFormModal, type MeterFormValues } from '../../../../app/MeterFormModal'
import {
  formatAddedDate,
  type SupportedMeter,
} from '../../../../app/adminMeters'
import {
  getCachedObisCodes,
  getCachedMeterIntegration,
  getObisCodeError,
  useCreateObisCode,
  type CreateObisCodeInput,
  type MeterIntegration,
  type ObisCode,
} from '../../../../features/admin-meters/adminMeterQueries'

export const Route = createFileRoute('/admin/_admin/meter-integration/$meterId')({
  component: MeterViewPage,
})

type ObisFormValues = Required<CreateObisCodeInput>
type ObisFormField = keyof ObisFormValues

function toSupportedMeter(integration: MeterIntegration): SupportedMeter {
  return {
    id: integration.id,
    manufacturer: integration.manufacturer,
    category: integration.category,
    meterClass: integration.class,
    model: integration.model,
    protocol: integration.protocol,
    authenticationType: integration.authenticationType,
    description: integration.description,
    addedBy: integration.addedBy.name,
    addedDate: formatAddedDate(new Date(integration.createdAt)),
    status: integration.status === 'ACTIVE' ? 'Active' : 'Deprecated',
  }
}

function MeterViewPage() {
  const { meterId } = Route.useParams()
  const queryClient = useQueryClient()
  const [meter, setMeter] = useState<SupportedMeter | undefined>(() =>
    {
      const integration = getCachedMeterIntegration(queryClient, meterId)
      return integration ? toSupportedMeter(integration) : undefined
    },
  )

  if (!meter) {
    return (
      <div className="dash">
        <header className="dash-head">
          <h1 className="dash-title">Meter View</h1>
          <p className="dash-subtitle">This meter could not be found.</p>
        </header>
      </div>
    )
  }

  return <MeterView meter={meter} onUpdate={setMeter} />
}

function MeterView({
  meter,
  onUpdate,
}: {
  meter: SupportedMeter
  onUpdate: (meter: SupportedMeter) => void
}) {
  const [editInfoOpen, setEditInfoOpen] = useState(false)

  const saveInfo = (values: MeterFormValues) => {
    const { password: _password, ...meterData } = values
    onUpdate({ ...meter, ...meterData })
    setEditInfoOpen(false)
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Meter View</h1>
        <p className="dash-subtitle">Manage other meter information</p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Summary
        </button>
      </div>

      <section className="meter-view-card">
        <div className="meter-view-id">
          <span className="meter-view-icon" aria-hidden="true">
            <GaugeIcon />
          </span>
          <div>
            <p className="meter-view-name">
              {meter.model}{' '}
              <span
                className={`code-badge${meter.status === 'Active' ? ' is-ok' : ' is-error'}`}
              >
                {meter.status}
              </span>
            </p>
            <p className="meter-view-meta">{meter.manufacturer}</p>
            <p className="meter-view-meta">Date Added {meter.addedDate}</p>
          </div>
        </div>
        <button type="button" className="btn-neutral btn-icon" onClick={() => setEditInfoOpen(true)}>
          Edit Info <PencilSquareIcon />
        </button>
      </section>

      <ObisPanel meterIntegrationId={meter.id} />

      {editInfoOpen ? (
        <MeterFormModal
          title="Edit Meter"
          submitLabel="Save"
          initial={meter}
          onClose={() => setEditInfoOpen(false)}
          onSubmit={saveInfo}
        />
      ) : null}
    </div>
  )
}

function ObisPanel({ meterIntegrationId }: { meterIntegrationId: string }) {
  const queryClient = useQueryClient()
  const createObisCode = useCreateObisCode(meterIntegrationId)
  const { showToast } = useToast()
  const [codes, setCodes] = useState<ObisCode[]>(() =>
    getCachedObisCodes(queryClient, meterIntegrationId),
  )
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ObisFormField, string>>
  >({})

  const openAddModal = () => {
    createObisCode.reset()
    setFieldErrors({})
    setAddOpen(true)
  }

  const addCode = async (values: ObisFormValues) => {
    setFieldErrors({})

    try {
      const obisCode = await createObisCode.mutateAsync({
        action: values.action,
        code: values.code,
        ...(values.description ? { description: values.description } : {}),
      })
      setCodes((current) => [...current, obisCode])
      setAddOpen(false)
      showToast({
        title: 'OBIS code added',
        message: `${obisCode.action} was added with status ${obisCode.status}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getObisCodeError(error)
      const nextFieldErrors = apiError.fields as Partial<Record<ObisFormField, string>>
      const fieldMessage = [...new Set(Object.values(apiError.fields))].join(' ')
      setFieldErrors(nextFieldErrors)
      showToast({
        title: apiError.message,
        message: [fieldMessage, apiError.requestId ? `Request ID: ${apiError.requestId}` : '']
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    } finally {
      createObisCode.reset()
    }
  }

  const query = search.trim().toLowerCase()
  const visibleCodes = query
    ? codes.filter((c) =>
        [c.action, c.code, c.description].join(' ').toLowerCase().includes(query),
      )
    : codes

  return (
    <section className="dash-panel">
      <div className="panel-head">
        <h2 className="panel-title">OBIS Code</h2>
        <div className="panel-actions">
          <button type="button" className="btn-primary" onClick={openAddModal}>
            Add OBIS Code <PlusIcon />
          </button>
        </div>
      </div>

      <div className="dash-toolbar">
        <div className="table-search">
          <input
            type="search"
            placeholder="Search OBIS Code..."
            aria-label="Search OBIS codes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <SearchIcon />
        </div>
        <button type="button" className="filter-btn">
          Sort <SortIcon />
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
              <th>OBIS Action</th>
              <th>OBIS Code</th>
              <th>Description</th>
              <th>Created Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleCodes.map((code, index) => (
              <tr key={code.id}>
                <td className="col-check">
                  <input type="checkbox" aria-label={`Select OBIS code ${index + 1}`} />
                </td>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>{code.action}</td>
                <td>{code.code}</td>
                <td>{code.description}</td>
                <td>{formatAddedDate(new Date(code.createdAt))}</td>
                <td>
                  <span
                    className={`code-badge${code.status === 'ACTIVE' ? ' is-ok' : ' is-error'}`}
                  >
                    {code.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen ? (
        <ObisFormModal
          title="Add OBIS Code"
          submitLabel="Add"
          isSubmitting={createObisCode.isPending}
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
            if (!createObisCode.isPending) setAddOpen(false)
          }}
          onSubmit={addCode}
        />
      ) : null}
    </section>
  )
}

function ObisFormModal({
  title,
  submitLabel,
  isSubmitting,
  fieldErrors,
  onFieldChange,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  isSubmitting: boolean
  fieldErrors: Partial<Record<ObisFormField, string>>
  onFieldChange: (field: ObisFormField) => void
  onClose: () => void
  onSubmit: (values: ObisFormValues) => void
}) {
  const [action, setAction] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const canSubmit = action.trim() !== '' && code.trim() !== ''

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="obis-form-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="obis-form-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>OBIS Action</label>
            <input
              className="modal-input"
              placeholder="Enter action"
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                onFieldChange('action')
              }}
              aria-invalid={Boolean(fieldErrors.action)}
              disabled={isSubmitting}
            />
            {fieldErrors.action ? (
              <span className="modal-field-error" role="alert">{fieldErrors.action}</span>
            ) : null}
          </div>
          <div className="modal-field">
            <label>OBIS Code</label>
            <input
              className="modal-input"
              placeholder="Enter OBIS code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                onFieldChange('code')
              }}
              aria-invalid={Boolean(fieldErrors.code)}
              disabled={isSubmitting}
            />
            {fieldErrors.code ? (
              <span className="modal-field-error" role="alert">{fieldErrors.code}</span>
            ) : null}
          </div>
          <div className="modal-field">
            <label>Description</label>
            <textarea
              className="modal-input"
              rows={3}
              placeholder="Describe this OBIS command"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                onFieldChange('description')
              }}
              aria-invalid={Boolean(fieldErrors.description)}
              disabled={isSubmitting}
            />
            {fieldErrors.description ? (
              <span className="modal-field-error" role="alert">{fieldErrors.description}</span>
            ) : null}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit || isSubmitting}
              onClick={() => canSubmit && onSubmit({
                action: action.trim(),
                code: code.trim(),
                description: description.trim(),
              })}
            >
              {isSubmitting ? 'Adding…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GaugeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12 16 8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function PencilSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

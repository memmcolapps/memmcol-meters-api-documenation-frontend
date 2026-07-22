import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useDismiss } from '../../../../app/useDismiss'
import { useToast } from '../../../../app/toastContext'
import { formatAddedDate } from '../../../../app/adminMeters'
import {
  getCachedObisCodes,
  getCachedMeterIntegration,
  getObisCodeError,
  getObisUploadError,
  useCreateObisCode,
  useUploadObisCodes,
  type CreateObisCodeInput,
  type MeterIntegrationSummary,
  type ObisCode,
  type ObisUpload,
  type ObisUploadMode,
  type UploadObisCodesInput,
} from '../../../../features/admin-meters/adminMeterQueries'

export const Route = createFileRoute('/admin/_admin/meter-integration/$meterId')({
  component: MeterViewPage,
})

type ObisFormValues = Required<CreateObisCodeInput>
type ObisFormField = keyof ObisFormValues
type ObisUploadField = keyof UploadObisCodesInput

function MeterViewPage() {
  const { meterId } = Route.useParams()
  const queryClient = useQueryClient()
  const meter = getCachedMeterIntegration(queryClient, meterId)

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

  return <MeterView meter={meter} />
}

function MeterView({ meter }: { meter: MeterIntegrationSummary }) {
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
                className={`code-badge${meter.status === 'ACTIVE' ? ' is-ok' : ' is-error'}`}
              >
                {meter.status}
              </span>
            </p>
            <p className="meter-view-meta">{meter.manufacturer}</p>
            <p className="meter-view-meta">
              Date Added {formatAddedDate(new Date(meter.createdAt))}
            </p>
          </div>
        </div>
      </section>

      <ObisPanel meterIntegrationId={meter.id} />
    </div>
  )
}

function ObisPanel({ meterIntegrationId }: { meterIntegrationId: string }) {
  const queryClient = useQueryClient()
  const createObisCode = useCreateObisCode(meterIntegrationId)
  const uploadObisCodes = useUploadObisCodes(meterIntegrationId)
  const { showToast } = useToast()
  const [codes, setCodes] = useState<ObisCode[]>(() =>
    getCachedObisCodes(queryClient, meterIntegrationId),
  )
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ObisFormField, string>>
  >({})
  const [uploadFieldErrors, setUploadFieldErrors] = useState<
    Partial<Record<ObisUploadField, string>>
  >({})
  const [uploadResult, setUploadResult] = useState<ObisUpload | null>(null)

  const openAddModal = () => {
    createObisCode.reset()
    setFieldErrors({})
    setAddOpen(true)
  }

  const openUploadModal = () => {
    uploadObisCodes.reset()
    setUploadFieldErrors({})
    setUploadResult(null)
    setUploadOpen(true)
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

  const uploadCodes = async (values: UploadObisCodesInput) => {
    setUploadFieldErrors({})

    try {
      const upload = await uploadObisCodes.mutateAsync(values)
      setUploadResult(upload)
      showToast({
        title: 'OBIS codes uploaded',
        message: `${upload.created} created · ${upload.updated} updated · ${upload.failed} failed`,
        variant: upload.failed > 0 ? 'info' : 'success',
      })
    } catch (error) {
      const apiError = getObisUploadError(error)
      const nextFieldErrors = apiError.fields as Partial<
        Record<ObisUploadField, string>
      >
      const fieldMessage = [...new Set(Object.values(apiError.fields))].join(' ')
      setUploadFieldErrors(nextFieldErrors)
      showToast({
        title: apiError.message,
        message: [fieldMessage, apiError.requestId ? `Request ID: ${apiError.requestId}` : '']
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
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
          <button type="button" className="btn-neutral" onClick={openUploadModal}>
            Upload CSV <UploadIcon />
          </button>
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

      {uploadOpen ? (
        <ObisUploadModal
          isSubmitting={uploadObisCodes.isPending}
          fieldErrors={uploadFieldErrors}
          result={uploadResult}
          onFieldChange={(field) => {
            setUploadFieldErrors((current) => {
              if (!current[field]) return current
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onClose={() => {
            if (!uploadObisCodes.isPending) setUploadOpen(false)
          }}
          onSubmit={uploadCodes}
        />
      ) : null}
    </section>
  )
}

function ObisUploadModal({
  isSubmitting,
  fieldErrors,
  result,
  onFieldChange,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean
  fieldErrors: Partial<Record<ObisUploadField, string>>
  result: ObisUpload | null
  onFieldChange: (field: ObisUploadField) => void
  onClose: () => void
  onSubmit: (values: UploadObisCodesInput) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ObisUploadMode>('append')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return
    setFile(nextFile)
    onFieldChange('file')
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="obis-upload-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="obis-upload-title" className="modal-title">
              Upload OBIS/action codes
            </h2>
            <p className="modal-subtitle">Import a CSV file into this meter integration.</p>
          </div>
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

        {result ? (
          <ObisUploadResult upload={result} onClose={onClose} />
        ) : (
          <div className="modal-body">
            <div className="modal-field">
              <label htmlFor="obis-upload-mode">Upload mode</label>
              <select
                id="obis-upload-mode"
                className="modal-select"
                value={mode}
                aria-invalid={Boolean(fieldErrors.mode)}
                disabled={isSubmitting}
                onChange={(event) => {
                  setMode(event.target.value as ObisUploadMode)
                  onFieldChange('mode')
                }}
              >
                <option value="append">Append to existing codes</option>
                <option value="replace">Replace existing codes</option>
              </select>
              <span className="upload-mode-help">
                {mode === 'append'
                  ? 'Keep the current codes and add or update rows from this CSV.'
                  : 'Replace the current code set with the rows from this CSV.'}
              </span>
              {fieldErrors.mode ? (
                <span className="modal-field-error" role="alert">{fieldErrors.mode}</span>
              ) : null}
            </div>

            <div className="modal-field">
              <span className="upload-heading">CSV file</span>
              <label
                className="upload-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  if (!isSubmitting) chooseFile(event.dataTransfer.files[0])
                }}
              >
                <input
                  className="upload-input"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isSubmitting}
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
                <span className="upload-zone-icon" aria-hidden="true">
                  <UploadIcon />
                </span>
                <span className="upload-file-name">
                  {file?.name ?? 'Choose a CSV file or drag it here'}
                </span>
                <span className="upload-file-status">
                  {file ? `${Math.max(1, Math.ceil(file.size / 1024))} KB selected` : 'CSV files only'}
                </span>
              </label>
              {fieldErrors.file ? (
                <span className="modal-field-error" role="alert">{fieldErrors.file}</span>
              ) : null}
            </div>

            <p className="upload-note">
              Expected columns: <code>action,code,description</code>. Every data row will be
              validated by the server.
            </p>

            <div className="modal-foot">
              <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!file || isSubmitting}
                onClick={() => file && onSubmit({ file, mode })}
              >
                {isSubmitting ? 'Uploading…' : 'Upload codes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ObisUploadResult({ upload, onClose }: { upload: ObisUpload; onClose: () => void }) {
  return (
    <div className="modal-body">
      <div className="upload-result-head" role="status">
        <span className={`code-badge${upload.failed > 0 ? ' is-error' : ' is-ok'}`}>
          {upload.status}
        </span>
        <span>{upload.totalRows} rows processed in {upload.mode} mode</span>
      </div>

      <div className="upload-stats" aria-label="Upload counts">
        <div><span>Total</span><strong>{upload.totalRows}</strong></div>
        <div><span>Created</span><strong>{upload.created}</strong></div>
        <div><span>Updated</span><strong>{upload.updated}</strong></div>
        <div><span>Failed</span><strong>{upload.failed}</strong></div>
      </div>

      {upload.errors.length > 0 ? (
        <div>
          <h3 className="upload-heading">Row errors</h3>
          <div className="upload-errors">
            <table className="data-table">
              <thead>
                <tr><th>Row</th><th>Field</th><th>Message</th></tr>
              </thead>
              <tbody>
                {upload.errors.map((error, index) => (
                  <tr key={`${error.row}-${error.field}-${index}`}>
                    <td>{error.row}</td>
                    <td>{error.field}</td>
                    <td>{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="upload-success-note">All rows passed validation.</p>
      )}

      <div className="modal-foot modal-foot--end">
        <button type="button" className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
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

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
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

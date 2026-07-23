import { useDeferredValue, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../../app/AsyncState'
import { useAnchoredMenu } from '../../../../app/useAnchoredMenu'
import { useDismiss } from '../../../../app/useDismiss'
import { useToast } from '../../../../app/toastContext'
import { formatAddedDate } from '../../../../app/adminMeters'
import {
  getObisCodeError,
  getObisCodeStatusError,
  getObisCodeUpdateError,
  getObisUploadError,
  useChangeObisCodeStatus,
  useCreateObisCode,
  useMeterIntegration,
  useObisCodes,
  useUpdateObisCode,
  useUploadObisCodes,
  type CreateObisCodeInput,
  type MeterIntegration,
  type ObisCode,
  type ObisCodeStatus,
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
type ObisStatusField = 'status' | 'reason'

function MeterViewPage() {
  const { meterId } = Route.useParams()
  const meterQuery = useMeterIntegration(meterId)

  return (
    <AsyncState
      isPending={meterQuery.isPending}
      error={meterQuery.error}
      onRetry={() => void meterQuery.refetch()}
    >
      {meterQuery.data ? <MeterView meter={meterQuery.data} /> : null}
    </AsyncState>
  )
}

function MeterView({ meter }: { meter: MeterIntegration }) {
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
        <dl className="meter-view-summary">
          <SummaryItem label="Class" value={formatIntegrationValue(meter.class)} />
          <SummaryItem
            label="Category"
            value={formatIntegrationValue(meter.category)}
          />
          <SummaryItem label="Protocol" value={meter.protocol} />
          <SummaryItem
            label="Authentication"
            value={formatIntegrationValue(meter.authenticationType)}
          />
          <SummaryItem label="OBIS codes" value={meter.obisCodeCount} />
          <SummaryItem label="Added by" value={meter.addedBy.name} />
          <SummaryItem
            label="Description"
            value={meter.description || '—'}
            wide
          />
        </dl>
      </section>

      <ObisPanel meterIntegrationId={meter.id} />
    </div>
  )
}

function SummaryItem({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string | number
  wide?: boolean
}) {
  return (
    <div className={`meter-view-summary-item${wide ? ' is-wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function formatIntegrationValue(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ObisPanel({ meterIntegrationId }: { meterIntegrationId: string }) {
  const createObisCode = useCreateObisCode(meterIntegrationId)
  const updateObisCode = useUpdateObisCode(meterIntegrationId)
  const changeObisCodeStatus = useChangeObisCodeStatus(meterIntegrationId)
  const uploadObisCodes = useUploadObisCodes(meterIntegrationId)
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ObisCodeStatus | ''>('')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deprecating, setDeprecating] = useState<ObisCode | null>(null)
  const [editing, setEditing] = useState<ObisCode | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ObisFormField, string>>
  >({})
  const [uploadFieldErrors, setUploadFieldErrors] = useState<
    Partial<Record<ObisUploadField, string>>
  >({})
  const [statusFieldErrors, setStatusFieldErrors] = useState<
    Partial<Record<ObisStatusField, string>>
  >({})
  const [uploadResult, setUploadResult] = useState<ObisUpload | null>(null)
  const deferredSearch = useDeferredValue(search.trim())
  const codesQuery = useObisCodes(meterIntegrationId, {
    search: deferredSearch || undefined,
    status: status || undefined,
    page,
    limit: 50,
  })
  const codes = codesQuery.data?.items ?? []
  const pagination = codesQuery.data?.pagination

  const openAddModal = () => {
    createObisCode.reset()
    updateObisCode.reset()
    setFieldErrors({})
    setAddOpen(true)
  }

  const openEditModal = (code: ObisCode) => {
    updateObisCode.reset()
    setFieldErrors({})
    setOpenMenu(null)
    setEditing(code)
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

  const editCode = async (values: ObisFormValues) => {
    if (!editing) return
    setFieldErrors({})

    try {
      const obisCode = await updateObisCode.mutateAsync({
        obisCodeId: editing.id,
        action: values.action,
        code: values.code,
        description: values.description,
      })
      setEditing(null)
      showToast({
        title: 'OBIS code updated',
        message: `${obisCode.action} was updated successfully.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getObisCodeUpdateError(error)
      const fields = apiError.fields as Partial<Record<ObisFormField, string>>
      setFieldErrors(fields)
      showToast({
        title: apiError.message,
        message: [
          [...new Set(Object.values(fields))].join(' '),
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · ') || undefined,
        variant: 'error',
      })
    } finally {
      updateObisCode.reset()
    }
  }

  const updateCodeStatus = async (
    code: ObisCode,
    nextStatus: ObisCodeStatus,
    reason?: string,
  ) => {
    if (nextStatus === 'DEPRECATED' && !reason?.trim()) {
      setStatusFieldErrors({
        reason: 'Reason is required when deprecating an OBIS code.',
      })
      return
    }

    setStatusFieldErrors({})
    try {
      await changeObisCodeStatus.mutateAsync({
        obisCodeId: code.id,
        status: nextStatus,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      })
      setOpenMenu(null)
      setDeprecating(null)
      showToast({
        title: nextStatus === 'ACTIVE' ? 'OBIS code activated' : 'OBIS code deprecated',
        message: `${code.action} is now ${nextStatus.toLowerCase()}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getObisCodeStatusError(error)
      const fields = apiError.fields as Partial<Record<ObisStatusField, string>>
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

  const isEmpty = !codesQuery.isPending && codes.length === 0

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
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
          <SearchIcon />
        </div>
        <select
          className="filter-btn"
          aria-label="Filter OBIS codes by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ObisCodeStatus | '')
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>
      </div>

      <AsyncState
        isPending={codesQuery.isPending}
        error={codesQuery.error}
        onRetry={() => void codesQuery.refetch()}
      >
        {isEmpty ? (
          <div className="meter-empty">
            <p className="meter-empty-text">No OBIS/action codes found.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll" aria-busy={codesQuery.isFetching}>
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
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code, index) => (
                    <tr key={code.id}>
                      <td className="col-check">
                        <input type="checkbox" aria-label={`Select OBIS code ${index + 1}`} />
                      </td>
                      <td>
                        {String(
                          ((pagination?.page ?? page) - 1) *
                            (pagination?.limit ?? 50) +
                            index +
                            1,
                        ).padStart(2, '0')}
                      </td>
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
                      <td className="col-actions">
                        <ObisRowActions
                          isOpen={openMenu === code.id}
                          status={code.status}
                          isPending={
                            changeObisCodeStatus.isPending || updateObisCode.isPending
                          }
                          onToggle={() =>
                            setOpenMenu((current) => current === code.id ? null : code.id)
                          }
                          onClose={() => setOpenMenu(null)}
                          onEdit={() => openEditModal(code)}
                          onDeprecate={() => {
                            setOpenMenu(null)
                            changeObisCodeStatus.reset()
                            setStatusFieldErrors({})
                            setDeprecating(code)
                          }}
                          onActivate={() => void updateCodeStatus(code, 'ACTIVE')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="OBIS code pagination">
              <button
                type="button"
                className="page-nav"
                disabled={(pagination?.page ?? page) <= 1 || codesQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="page-gap">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                {' · '}{pagination?.total ?? codes.length} total
              </span>
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) >= (pagination?.totalPages ?? 1) ||
                  codesQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </AsyncState>

      {addOpen ? (
        <ObisFormModal
          title="Add OBIS Code"
          submitLabel="Add"
          submittingLabel="Adding…"
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

      {editing ? (
        <ObisFormModal
          title="Edit OBIS Code"
          submitLabel="Save Changes"
          submittingLabel="Saving…"
          initial={{
            action: editing.action,
            code: editing.code,
            description: editing.description,
          }}
          isSubmitting={updateObisCode.isPending}
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
            if (!updateObisCode.isPending) setEditing(null)
          }}
          onSubmit={editCode}
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

      {deprecating ? (
        <DeprecateObisCodeModal
          code={deprecating}
          isSubmitting={changeObisCodeStatus.isPending}
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
            if (!changeObisCodeStatus.isPending) setDeprecating(null)
          }}
          onConfirm={(reason) =>
            void updateCodeStatus(deprecating, 'DEPRECATED', reason)
          }
        />
      ) : null}
    </section>
  )
}

function DeprecateObisCodeModal({
  code,
  isSubmitting,
  fieldErrors,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  code: ObisCode
  isSubmitting: boolean
  fieldErrors: Partial<Record<ObisStatusField, string>>
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
      aria-labelledby="deprecate-obis-code-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="deprecate-obis-code-title" className="modal-title">
              Deprecate OBIS code
            </h2>
            <p className="modal-subtitle">
              {code.action} will no longer be available for new operations.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          {fieldErrors.status ? (
            <p className="modal-field-error" role="alert">{fieldErrors.status}</p>
          ) : null}
          <div className="modal-field">
            <label htmlFor="obis-deprecation-reason">
              Reason <span className="req">*</span>
            </label>
            <textarea
              id="obis-deprecation-reason"
              className="modal-input"
              rows={3}
              placeholder="Explain why this OBIS code is being deprecated"
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
            <button
              type="button"
              className="btn-neutral"
              onClick={onCancel}
              disabled={isSubmitting}
            >
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

function ObisRowActions({
  isOpen,
  status,
  isPending,
  onToggle,
  onClose,
  onEdit,
  onDeprecate,
  onActivate,
}: {
  isOpen: boolean
  status: ObisCodeStatus
  isPending: boolean
  onToggle: () => void
  onClose: () => void
  onEdit: () => void
  onDeprecate: () => void
  onActivate: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, onClose, isOpen)
  const { anchorRef, menuStyle } = useAnchoredMenu(isOpen, 100)

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="row-kebab"
        aria-label="OBIS code actions"
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
            onClick={onEdit}
            disabled={isPending}
          >
            <PencilIcon /> Edit
          </button>
          {status === 'ACTIVE' ? (
            <button
              type="button"
              className="row-menu-item"
              role="menuitem"
              onClick={onDeprecate}
              disabled={isPending}
            >
              <DeprecatedIcon /> Deprecate
            </button>
          ) : (
            <button
              type="button"
              className="row-menu-item"
              role="menuitem"
              onClick={onActivate}
              disabled={isPending}
            >
              <ActiveIcon /> Activate
            </button>
          )}
        </div>
      ) : null}
    </div>
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
  submittingLabel,
  initial,
  isSubmitting,
  fieldErrors,
  onFieldChange,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  submittingLabel: string
  initial?: ObisFormValues
  isSubmitting: boolean
  fieldErrors: Partial<Record<ObisFormField, string>>
  onFieldChange: (field: ObisFormField) => void
  onClose: () => void
  onSubmit: (values: ObisFormValues) => void
}) {
  const [action, setAction] = useState(initial?.action ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
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
              {isSubmitting ? submittingLabel : submitLabel}
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

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function DeprecatedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 8.5 7 7" />
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

function ActiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5" />
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

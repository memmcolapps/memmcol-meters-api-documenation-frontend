import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../app/useAnchoredMenu'
import { ConfirmModal } from '../../../../app/ConfirmModal'
import { MeterFormModal, type MeterFormValues } from '../../../../app/MeterFormModal'
import {
  formatAddedDate,
  seededSupportedMeters,
  type AdminMeterStatus,
  type SupportedMeter,
} from '../../../../app/adminMeters'

export const Route = createFileRoute('/admin/_admin/meter-integration/$meterId')({
  component: MeterViewPage,
})

type ObisCode = {
  id: string
  action: string
  code: string
  addedBy: string
  addedDate: string
  status: AdminMeterStatus
}

const seededObisCodes: ObisCode[] = [
  {
    id: 'ob-1',
    action: 'Send Token',
    code: '45;0.11.25.4.0.255;2;0',
    addedBy: 'Wura',
    addedDate: '17-02-2026',
    status: 'Active',
  },
  {
    id: 'ob-2',
    action: 'Configure IP Address',
    code: '46;0.11.25.4.0.255;2;0',
    addedBy: 'Margaret',
    addedDate: '17-02-2026',
    status: 'Active',
  },
  {
    id: 'ob-3',
    action: 'Configure Port',
    code: '45;0.11.25.4.0.255;4;0',
    addedBy: 'Moshood',
    addedDate: '17-02-2026',
    status: 'Deprecated',
  },
  {
    id: 'ob-4',
    action: 'Read Credit Balance',
    code: '45;0.11.35.4.0.255;2;0',
    addedBy: 'Wura',
    addedDate: '17-02-2026',
    status: 'Active',
  },
]

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function MeterViewPage() {
  const { meterId } = Route.useParams()
  const [meter, setMeter] = useState<SupportedMeter | undefined>(() =>
    seededSupportedMeters.find((m) => m.id === meterId),
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
    onUpdate({ ...meter, ...values })
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

      <ObisPanel />

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

function ObisPanel() {
  const [codes, setCodes] = useState<ObisCode[]>(seededObisCodes)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<ObisCode | null>(null)
  const [deprecating, setDeprecating] = useState<ObisCode | null>(null)

  const addCode = (values: { action: string; code: string }) => {
    setCodes((prev) => [
      ...prev,
      {
        id: `ob-${Date.now()}`,
        addedBy: 'Admin',
        addedDate: formatAddedDate(),
        status: 'Active',
        ...values,
      },
    ])
    setAddOpen(false)
  }

  const saveCode = (id: string, values: { action: string; code: string }) => {
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, ...values } : c)))
    setEditing(null)
  }

  const setStatus = (id: string, status: AdminMeterStatus) => {
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    setOpenMenu(null)
  }

  const query = search.trim().toLowerCase()
  const visibleCodes = query
    ? codes.filter((c) =>
        [c.action, c.code, c.addedBy].join(' ').toLowerCase().includes(query),
      )
    : codes

  return (
    <section className="dash-panel">
      <div className="panel-head">
        <h2 className="panel-title">OBIS Code</h2>
        <div className="panel-actions">
          <button type="button" className="btn-primary" onClick={() => setAddOpen(true)}>
            Add OBIS Code <PlusIcon />
          </button>
          <button
            type="button"
            className="btn-outline btn-icon"
            aria-label="Upload OBIS file"
            onClick={() => setUploadOpen(true)}
          >
            <UploadIcon />
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
              <th>Added By</th>
              <th>Added Date</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
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
                <td>{code.addedBy}</td>
                <td>{code.addedDate}</td>
                <td>
                  <span
                    className={`code-badge${code.status === 'Active' ? ' is-ok' : ' is-error'}`}
                  >
                    {code.status}
                  </span>
                </td>
                <td className="col-actions">
                  <ObisRowActions
                    isOpen={openMenu === code.id}
                    status={code.status}
                    onToggle={() =>
                      setOpenMenu((prev) => (prev === code.id ? null : code.id))
                    }
                    onClose={() => setOpenMenu(null)}
                    onEdit={() => {
                      setOpenMenu(null)
                      setEditing(code)
                    }}
                    onActivate={() => setStatus(code.id, 'Active')}
                    onDeprecate={() => {
                      setOpenMenu(null)
                      setDeprecating(code)
                    }}
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

      {addOpen ? (
        <ObisFormModal
          title="Add OBIS Code"
          submitLabel="Add"
          onClose={() => setAddOpen(false)}
          onSubmit={addCode}
        />
      ) : null}

      {uploadOpen ? <UploadObisModal onClose={() => setUploadOpen(false)} /> : null}

      {editing ? (
        <ObisFormModal
          title="Edit OBIS Code"
          submitLabel="Save"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(values) => saveCode(editing.id, values)}
        />
      ) : null}

      {deprecating ? (
        <ConfirmModal
          message="Are you sure you want to deprecate OBIS?"
          confirmLabel="Deprecate"
          onCancel={() => setDeprecating(null)}
          onConfirm={() => {
            setStatus(deprecating.id, 'Deprecated')
            setDeprecating(null)
          }}
        />
      ) : null}
    </section>
  )
}

function ObisFormModal({
  title,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  initial?: Pick<ObisCode, 'action' | 'code'>
  onClose: () => void
  onSubmit: (values: { action: string; code: string }) => void
}) {
  const [action, setAction] = useState(initial?.action ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
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
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>OBIS Action</label>
            <input
              className="modal-input"
              placeholder="E.g. Send Token"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>OBIS Code</label>
            <input
              className="modal-input"
              placeholder="E.g. 45;0.11.25.4.0.255;2;0"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit}
              onClick={() => canSubmit && onSubmit({ action: action.trim(), code: code.trim() })}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadObisModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0]
    if (selected) setFile({ name: selected.name, size: selected.size })
  }

  const formatSize = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="upload-obis-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="upload-obis-title" className="modal-title">
            Upload File
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div>
            <h3 className="upload-heading">Upload OBIS</h3>
            <p className="modal-subtitle">Upload your file containing OBIS details.</p>
          </div>

          <div
            className="upload-zone"
            role="button"
            tabIndex={0}
            aria-label="Choose a file to upload"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              handleFiles(event.dataTransfer.files)
            }}
          >
            <span className="upload-zone-icon" aria-hidden="true">
              <FilePlusIcon />
            </span>
            {file ? (
              <>
                <p className="upload-file-name">
                  {file.name} | {formatSize(file.size)}
                </p>
                <p className="upload-file-status">
                  Your {file.name} has been successfully updated
                </p>
              </>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(event) => handleFiles(event.target.files)}
          />

          <p className="upload-note">
            Click the{' '}
            <button type="button" className="upload-link">
              link to download
            </button>{' '}
            the required document format. Please ensure your file follows the
            structure before uploading.
          </p>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!file}
              onClick={onClose}
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilePlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M12 12v6M9 15h6" />
    </svg>
  )
}

function ObisRowActions({
  isOpen,
  status,
  onToggle,
  onClose,
  onEdit,
  onActivate,
  onDeprecate,
}: {
  isOpen: boolean
  status: AdminMeterStatus
  onToggle: () => void
  onClose: () => void
  onEdit: () => void
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
          <button type="button" className="row-menu-item" role="menuitem" onClick={onEdit}>
            <PencilIcon /> Edit OBIS Code
          </button>
          {status === 'Active' ? (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onDeprecate}>
              <TrashIcon /> Deprecate OBIS
            </button>
          ) : (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onActivate}>
              <BadgeCheckIcon /> Activate OBIS
            </button>
          )}
        </div>
      ) : null}
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

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
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

function BadgeCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5" />
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
      <path d="M12 15V4m0 0-4 4m4-4 4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
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

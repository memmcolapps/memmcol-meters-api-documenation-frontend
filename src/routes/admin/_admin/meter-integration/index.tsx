import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../app/useAnchoredMenu'
import { ConfirmModal } from '../../../../app/ConfirmModal'
import { MeterFormModal, type MeterFormValues } from '../../../../app/MeterFormModal'
import {
  formatAddedDate,
  seededSupportedMeters,
  type SupportedMeter,
} from '../../../../app/adminMeters'

export const Route = createFileRoute('/admin/_admin/meter-integration/')({
  component: MeterIntegrationPage,
})

function MeterIntegrationPage() {
  const navigate = useNavigate()
  const [meters, setMeters] = useState<SupportedMeter[]>(seededSupportedMeters)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [integrateOpen, setIntegrateOpen] = useState(false)
  const [editing, setEditing] = useState<SupportedMeter | null>(null)
  const [deprecating, setDeprecating] = useState<SupportedMeter | null>(null)

  const integrateMeter = (data: MeterFormValues) => {
    setMeters((prev) => [
      ...prev,
      {
        id: `sm-${Date.now()}`,
        addedBy: 'Admin',
        addedDate: formatAddedDate(),
        status: 'Active',
        ...data,
      },
    ])
    setIntegrateOpen(false)
  }

  const saveMeter = (id: string, data: MeterFormValues) => {
    setMeters((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)))
    setEditing(null)
  }

  const setStatus = (id: string, status: SupportedMeter['status']) => {
    setMeters((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    setOpenMenu(null)
  }

  const goToMeter = (id: string) => {
    navigate({ to: '/admin/meter-integration/$meterId', params: { meterId: id } })
  }

  const query = search.trim().toLowerCase()
  const visibleMeters = query
    ? meters.filter((m) =>
        [m.manufacturer, m.category, m.meterClass, m.model, m.addedBy]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : meters

  const isEmpty = meters.length === 0

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
        <button type="button" className="btn-primary" onClick={() => setIntegrateOpen(true)}>
          Integrate Meter <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Supported Meters
        </button>
      </div>

      {isEmpty ? (
        <div className="meter-empty">
          <p className="meter-empty-text">No meters Available</p>
          <button type="button" className="btn-primary" onClick={() => setIntegrateOpen(true)}>
            Integrate Meter <PlusIcon />
          </button>
        </div>
      ) : (
        <>
          <div className="dash-toolbar">
            <div className="dash-filters">
              <div className="table-search">
                <input
                  type="search"
                  placeholder="Search Meter..."
                  aria-label="Search meters"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <SearchIcon />
              </div>
              <button type="button" className="filter-btn">
                Filter <ChevronRightIcon />
              </button>
              <button type="button" className="filter-btn">
                Sort <SortIcon />
              </button>
            </div>
          </div>

          <div className="table-scroll">
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
                {visibleMeters.map((meter, index) => (
                  <tr key={meter.id}>
                    <td className="col-check">
                      <input type="checkbox" aria-label={`Select meter ${index + 1}`} />
                    </td>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{meter.manufacturer}</td>
                    <td>{meter.category}</td>
                    <td>{meter.meterClass}</td>
                    <td>{meter.model}</td>
                    <td>{meter.addedBy}</td>
                    <td>{meter.addedDate}</td>
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
                        onView={() => goToMeter(meter.id)}
                        onEdit={() => {
                          setOpenMenu(null)
                          setEditing(meter)
                        }}
                        onAddObis={() => goToMeter(meter.id)}
                        onActivate={() => setStatus(meter.id, 'Active')}
                        onDeprecate={() => {
                          setOpenMenu(null)
                          setDeprecating(meter)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {integrateOpen ? (
        <MeterFormModal
          title="Integrate Meter"
          submitLabel="Integrate"
          onClose={() => setIntegrateOpen(false)}
          onSubmit={integrateMeter}
        />
      ) : null}

      {editing ? (
        <MeterFormModal
          title="Edit Meter"
          submitLabel="Save"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(values) => saveMeter(editing.id, values)}
        />
      ) : null}

      {deprecating ? (
        <ConfirmModal
          message={`Are you sure you want to deprecate ${deprecating.model}?`}
          confirmLabel="Deprecate"
          onCancel={() => setDeprecating(null)}
          onConfirm={() => {
            setStatus(deprecating.id, 'Deprecated')
            setDeprecating(null)
          }}
        />
      ) : null}
    </div>
  )
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
  status: SupportedMeter['status']
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
          {status === 'Active' ? (
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

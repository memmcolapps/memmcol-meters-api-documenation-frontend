import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../app/useDismiss'
import { DatePicker } from '../../app/DatePicker'

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

function MeterPage() {
  const [meters, setMeters] = useState<Meter[]>(seededMeters)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const addMeter = () =>
    setMeters((prev) => [...prev, makeMeter(prev.length + 1)])

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
        <button type="button" className="btn-primary" onClick={addMeter}>
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
          <button type="button" className="btn-primary" onClick={addMeter}>
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
                  <th>Actions</th>
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
                    <td>
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
    </div>
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

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        className="row-kebab"
        aria-label="Row actions"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <KebabIcon />
      </button>
      {isOpen ? (
        <div className="row-menu" role="menu">
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

import { useRef, useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DatePicker } from '../../../app/DatePicker'
import { useDismiss } from '../../../app/useDismiss'
import { useToast } from '../../../app/toastContext'
import {
  getResolveIncidentError,
  useResolveIncident,
  type ResolvedIncident,
} from '../../../features/admin-incidents/adminIncidentQueries'
import { formatDateTime } from '../../../lib/format'

export const Route = createFileRoute('/admin/_admin/incident-report')({
  component: IncidentReportPage,
})

type IncidentStatus = 'UNRESOLVED' | 'RESOLVED'

type Incident = {
  id: string
  title: string
  company: string
  date: string
  time: string
  status: IncidentStatus
} & Partial<Omit<ResolvedIncident, 'id' | 'status'>>

const seededIncidents: Incident[] = [
  ...Array.from({ length: 7 }, (_, index): Incident => ({
    id: `in-u-${index + 1}`,
    title: 'Login API 505',
    company: index === 1 ? 'Buypower' : 'Interswitch',
    date: 'Aug 19, 2025',
    time: '8:42 AM',
    status: 'UNRESOLVED',
  })),
  ...Array.from({ length: 6 }, (_, index): Incident => ({
    id: `in-r-${index + 1}`,
    title: 'Login API 505',
    company: 'Interswitch',
    date: 'Aug 19, 2025',
    time: '8:42 AM',
    status: 'RESOLVED',
  })),
]

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function IncidentReportPage() {
  const [incidents, setIncidents] = useState<Incident[]>(seededIncidents)
  const [search, setSearch] = useState('')
  const [resolving, setResolving] = useState<Incident | null>(null)
  const resolveIncident = useResolveIncident()
  const { showToast } = useToast()

  const resolve = async (resolution: string) => {
    if (!resolving) return

    try {
      const updated = await resolveIncident.mutateAsync({
        incidentId: resolving.id,
        resolution,
      })
      setIncidents((current) => current.map((incident) =>
        incident.id === updated.id ? { ...incident, ...updated } : incident,
      ))
      setResolving(null)
      showToast({
        title: 'Incident resolved',
        message: `${resolving.title} was resolved by ${updated.resolvedBy.name}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getResolveIncidentError(error)

      if (apiError.code === 'INCIDENT_ALREADY_RESOLVED') {
        setIncidents((current) => current.map((incident) =>
          incident.id === resolving.id
            ? { ...incident, status: 'RESOLVED' }
            : incident,
        ))
        setResolving(null)
      } else if (apiError.code === 'INCIDENT_NOT_FOUND') {
        setIncidents((current) => current.filter(
          (incident) => incident.id !== resolving.id,
        ))
        setResolving(null)
      }

      if (apiError.status !== 401) {
        showToast({
          title: apiError.code === 'INCIDENT_ALREADY_RESOLVED'
            ? 'Incident already resolved'
            : apiError.code === 'INCIDENT_NOT_FOUND'
              ? 'Incident not found'
              : apiError.code === 'ACCESS_DENIED'
                ? 'Access denied'
                : 'Could not resolve incident',
          message: [
            apiError.fields.resolution ?? apiError.message,
            apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
          ].filter(Boolean).join(' · '),
          variant: 'error',
        })
      }
      throw error
    }
  }

  const query = search.trim().toLowerCase()
  const visibleIncidents = query
    ? incidents.filter((incident) =>
        incident.company.toLowerCase().includes(query),
      )
    : incidents

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Incident Report</h1>
        <p className="dash-subtitle">
          Track, review, and resolve issues reported by users or detected
          automatically.
        </p>
      </header>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search organization..."
              aria-label="Search organizations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SearchIcon />
          </div>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
          <DatePicker placeholder="Date Range" />
        </div>
      </div>

      <section className="dash-panel">
        <h2 className="panel-title">Recent Incidents</h2>
        <div className="incident-list">
          {visibleIncidents.length === 0 ? (
            <p className="incident-empty">
              No incidents{query ? ' match your search' : ''}.
            </p>
          ) : (
            visibleIncidents.map((incident) => (
              <article
                key={incident.id}
                className={`incident-card${incident.status === 'RESOLVED' ? ' is-resolved' : ''}`}
              >
                <div className="incident-info">
                  <p className="incident-title">
                    <span className="incident-dot" aria-hidden="true" />
                    {incident.title}
                  </p>
                  <p className="incident-meta">Utility Company: {incident.company}</p>
                  <p className="incident-meta">
                    {incident.date} • <ClockIcon /> {incident.time}
                  </p>
                  {incident.resolution ? (
                    <p className="incident-meta">Resolution: {incident.resolution}</p>
                  ) : null}
                  {incident.resolvedBy && incident.resolvedAt ? (
                    <p className="incident-meta">
                      Resolved by {incident.resolvedBy.name} ·{' '}
                      {formatDateTime(incident.resolvedAt)}
                    </p>
                  ) : null}
                </div>
                {incident.status === 'UNRESOLVED' ? (
                  <button
                    type="button"
                    className="btn-neutral"
                    onClick={() => {
                      resolveIncident.reset()
                      setResolving(incident)
                    }}
                  >
                    Resolve
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

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

      {resolving ? (
        <ResolveIncidentModal
          incident={resolving}
          isSubmitting={resolveIncident.isPending}
          mutationError={resolveIncident.error}
          onCancel={() => {
            if (!resolveIncident.isPending) setResolving(null)
          }}
          onConfirm={resolve}
        />
      ) : null}
    </div>
  )
}

function ResolveIncidentModal({
  incident,
  isSubmitting,
  mutationError,
  onCancel,
  onConfirm,
}: {
  incident: Incident
  isSubmitting: boolean
  mutationError: unknown
  onCancel: () => void
  onConfirm: (resolution: string) => Promise<void>
}) {
  const [resolution, setResolution] = useState('')
  const [localError, setLocalError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, () => {
    if (!isSubmitting) onCancel()
  })
  const apiError = getResolveIncidentError(mutationError)
  const resolutionError = localError || apiError.fields.resolution

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = resolution.trim()
    if (!value) {
      setLocalError('Resolution is required.')
      return
    }
    setLocalError('')
    void onConfirm(value).catch(() => undefined)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="resolve-incident-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="resolve-incident-title" className="modal-title">
              Resolve Incident
            </h2>
            <p className="modal-subtitle">{incident.title} · {incident.company}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <CloseIcon />
          </button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="modal-field">
            <label htmlFor="incident-resolution">
              Resolution <span className="req">*</span>
            </label>
            <textarea
              id="incident-resolution"
              className="modal-input incident-resolution-input"
              rows={5}
              value={resolution}
              disabled={isSubmitting}
              aria-invalid={Boolean(resolutionError)}
              aria-describedby={resolutionError ? 'incident-resolution-error' : undefined}
              placeholder="Describe how the incident was resolved"
              onChange={(event) => {
                setResolution(event.target.value)
                setLocalError('')
              }}
            />
            {resolutionError ? (
              <span id="incident-resolution-error" className="modal-field-error" role="alert">
                {resolutionError}
              </span>
            ) : null}
          </div>

          <div className="modal-foot modal-foot--end">
            <button type="button" className="btn-neutral" disabled={isSubmitting} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Resolving…' : 'Resolve Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
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

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-2px' }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

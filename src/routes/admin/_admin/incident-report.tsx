import { useDeferredValue, useRef, useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../app/AsyncState'
import { DatePicker } from '../../../app/DatePicker'
import { useDismiss } from '../../../app/useDismiss'
import { useToast } from '../../../app/toastContext'
import {
  getResolveIncidentError,
  useAdminIncidents,
  useResolveIncident,
  type AdminIncident,
  type AdminIncidentSeverity,
  type AdminIncidentSortOrder,
  type AdminIncidentStatus,
} from '../../../features/admin-incidents/adminIncidentQueries'
import {
  formatDateTime,
  formatStatusLabel,
  formatText,
  toList,
} from '../../../lib/format'

export const Route = createFileRoute('/admin/_admin/incident-report')({
  component: IncidentReportPage,
})

const PAGE_SIZE = 20

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value.toISOString()
}

function endOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value.toISOString()
}

function IncidentReportPage() {
  const [search, setSearch] = useState('')
  const [organisationId, setOrganisationId] = useState('')
  const [status, setStatus] = useState<AdminIncidentStatus | ''>('')
  const [severity, setSeverity] = useState<AdminIncidentSeverity | ''>('')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [sortOrder, setSortOrder] = useState<AdminIncidentSortOrder>('desc')
  const [page, setPage] = useState(1)
  const [resolving, setResolving] = useState<AdminIncident | null>(null)
  const resolveIncident = useResolveIncident()
  const { showToast } = useToast()
  const deferredSearch = useDeferredValue(search.trim())
  const deferredOrganisationId = useDeferredValue(organisationId.trim())
  const incidentsQuery = useAdminIncidents({
    search: deferredSearch || undefined,
    organisationId: deferredOrganisationId || undefined,
    status: status || undefined,
    severity: severity || undefined,
    from: from ? startOfDay(from) : undefined,
    to: to ? endOfDay(to) : undefined,
    page,
    limit: PAGE_SIZE,
    sortOrder,
  })
  const incidents = toList<AdminIncident>(incidentsQuery.data?.items)
  const pagination = incidentsQuery.data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.totalPages ?? 1

  const resolve = async (resolution: string) => {
    if (!resolving) return

    try {
      const updated = await resolveIncident.mutateAsync({
        incidentId: resolving.id,
        resolution,
      })
      setResolving(null)
      showToast({
        title: 'Incident resolved',
        message: `${formatText(resolving.title, 'The incident')} was resolved by ${formatText(updated.resolvedBy?.name, 'an administrator')}.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getResolveIncidentError(error)

      if (apiError.code === 'INCIDENT_ALREADY_RESOLVED') {
        setResolving(null)
        void incidentsQuery.refetch()
      } else if (apiError.code === 'INCIDENT_NOT_FOUND') {
        setResolving(null)
        void incidentsQuery.refetch()
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
              aria-label="Search incidents"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <input
            type="text"
            className="filter-input"
            placeholder="Organisation ID"
            aria-label="Filter by organisation ID"
            value={organisationId}
            onChange={(event) => {
              setOrganisationId(event.target.value)
              setPage(1)
            }}
          />
          <select
            className="filter-btn"
            aria-label="Filter incidents by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminIncidentStatus | '')
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="UNRESOLVED">Unresolved</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            className="filter-btn"
            aria-label="Filter incidents by severity"
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value as AdminIncidentSeverity | '')
              setPage(1)
            }}
          >
            <option value="">All severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <DatePicker
            placeholder="From date"
            onChange={(date) => {
              setFrom(date)
              setPage(1)
            }}
          />
          <DatePicker
            placeholder="To date"
            onChange={(date) => {
              setTo(date)
              setPage(1)
            }}
          />
          <select
            className="filter-btn"
            aria-label="Sort incidents"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as AdminIncidentSortOrder)
              setPage(1)
            }}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      <AsyncState
        isPending={incidentsQuery.isPending}
        error={incidentsQuery.error}
        onRetry={() => void incidentsQuery.refetch()}
      >
        <section className="dash-panel" aria-busy={incidentsQuery.isFetching}>
          <h2 className="panel-title">Recent Incidents</h2>
          <div className="incident-list">
            {incidents.length === 0 ? (
              <p className="incident-empty">No incidents found.</p>
            ) : (
              incidents.map((incident) => (
                <article
                  key={incident.id}
                  className={`incident-card${incident.status === 'RESOLVED' ? ' is-resolved' : ''}`}
                >
                  <div className="incident-info">
                    <p className="incident-title">
                      <span className="incident-dot" aria-hidden="true" />
                      {formatText(incident.title)}
                    </p>
                    <p className="incident-meta">
                      Utility Company: {incidentOrganisationName(incident)}
                    </p>
                    <p className="incident-meta">
                      {formatDateTime(incident.detectedAt)} • <ClockIcon />{' '}
                      Request ID: {formatText(incident.requestId)}
                    </p>
                    <p className="incident-meta">
                      Severity:{' '}
                      <span
                        className={`incident-severity${severityBadgeClass(incident.severity)}`}
                      >
                        {formatStatusLabel(incident.severity)}
                      </span>
                    </p>
                    {incident.resolvedBy && incident.resolvedAt ? (
                      <p className="incident-meta">
                        Resolved by {formatText(incident.resolvedBy.name)} ·{' '}
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

        <nav className="pagination" aria-label="Incident pagination">
          <button
            type="button"
            className="page-nav"
            disabled={currentPage <= 1 || incidentsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeftIcon /> Previous
          </button>
          <div className="page-numbers">
            <span className="page-gap">
              Page {currentPage} of {totalPages}
              {' · '}{pagination?.total ?? incidents.length} total
            </span>
          </div>
          <button
            type="button"
            className="page-nav"
            disabled={currentPage >= totalPages || incidentsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next <ChevronRightIcon />
          </button>
        </nav>
      </AsyncState>

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
  incident: AdminIncident
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
            <p className="modal-subtitle">
              {formatText(incident.title)} · {incidentOrganisationName(incident)}
            </p>
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

function incidentOrganisationName(incident: AdminIncident) {
  return formatText(
    incident.organisation?.name ??
      incident.organisation?.businessName ??
      incident.organization?.name ??
      incident.organization?.businessName ??
      incident.organisationName ??
      incident.organizationName ??
      incident.company,
  )
}

function severityBadgeClass(severity: unknown) {
  if (severity === 'LOW') return ' is-low'
  if (severity === 'MEDIUM') return ' is-medium'
  if (severity === 'HIGH') return ' is-high'
  if (severity === 'CRITICAL') return ' is-critical'
  return ''
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

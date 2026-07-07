import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DatePicker } from '../../../app/DatePicker'

export const Route = createFileRoute('/admin/_admin/incident-report')({
  component: IncidentReportPage,
})

type IncidentStatus = 'unresolved' | 'resolved'

type Incident = {
  id: string
  title: string
  company: string
  date: string
  time: string
  status: IncidentStatus
}

const seededIncidents: Incident[] = [
  ...Array.from({ length: 7 }, (_, index): Incident => ({
    id: `in-u-${index + 1}`,
    title: 'Login API 505',
    company: index === 1 ? 'Buypower' : 'Interswitch',
    date: 'Aug 19, 2025',
    time: '8:42 AM',
    status: 'unresolved',
  })),
  ...Array.from({ length: 6 }, (_, index): Incident => ({
    id: `in-r-${index + 1}`,
    title: 'Login API 505',
    company: 'Interswitch',
    date: 'Aug 19, 2025',
    time: '8:42 AM',
    status: 'resolved',
  })),
]

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function IncidentReportPage() {
  const [incidents, setIncidents] = useState<Incident[]>(seededIncidents)
  const [search, setSearch] = useState('')

  const resolve = (id: string) => {
    setIncidents((prev) =>
      prev.map((incident) =>
        incident.id === id ? { ...incident, status: 'resolved' } : incident,
      ),
    )
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
                className={`incident-card${incident.status === 'resolved' ? ' is-resolved' : ''}`}
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
                </div>
                {incident.status === 'unresolved' ? (
                  <button
                    type="button"
                    className="btn-neutral"
                    onClick={() => resolve(incident.id)}
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

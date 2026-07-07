import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DatePicker } from '../../../app/DatePicker'

export const Route = createFileRoute('/admin/_admin/request-logs')({
  component: RequestLogsPage,
})

type RequestLog = {
  id: string
  organization: string
  time: string
  service: string
  code: number
  response: string
}

const services = [
  'Remote Token Management',
  'Consumption Data',
  'Event & Alarm Data',
  'Meter Master Data',
  'Remote Communication',
]

const seededLogs: RequestLog[] = Array.from({ length: 10 }, (_, index) => {
  const isError = index === 0
  return {
    id: `rl-${index + 1}`,
    organization: index === 1 ? 'Memmcol' : 'Momas',
    time: '6/23/2026, 4:53:21 PM',
    service: services[Math.floor((index + 1) / 2) % services.length],
    code: isError ? 400 : 200,
    response: isError ? 'Calls Exceeded' : 'Token generated successfully',
  }
})

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function RequestLogsPage() {
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const visibleLogs = query
    ? seededLogs.filter((log) => log.organization.toLowerCase().includes(query))
    : seededLogs

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Request Logs</h1>
        <p className="dash-subtitle">
          Monitor API request activity across all organizations.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Logs
        </button>
      </div>

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
            Filter <ChevronRightIcon />
          </button>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
          <DatePicker placeholder="Date Range" />
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
              <th>Organization</th>
              <th>Request Time</th>
              <th>API Service</th>
              <th>Code</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log, index) => (
              <tr key={log.id}>
                <td className="col-check">
                  <input type="checkbox" aria-label={`Select log ${index + 1}`} />
                </td>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>{log.organization}</td>
                <td>{log.time}</td>
                <td>{log.service}</td>
                <td>
                  <span
                    className={`code-badge${log.code >= 400 ? ' is-error' : ' is-ok'}`}
                  >
                    {log.code}
                  </span>
                </td>
                <td>{log.response}</td>
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

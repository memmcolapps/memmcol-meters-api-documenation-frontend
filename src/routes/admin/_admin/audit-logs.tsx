import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_admin/audit-logs')({
  component: AuditLogsPage,
})

type AuditLog = {
  id: string
  name: string
  email: string
  role: string
  activity: string
  userAgent: string
  ip: string
  timestamp: string
}

const seededLogs: AuditLog[] = [
  {
    id: 'al-1',
    name: 'MEMMCOL',
    email: 'Memmcolapp@gmail.com',
    role: 'Admin',
    activity: 'Added Organization',
    userAgent: 'Mozilla/5.0 ....',
    ip: '153.67.71.84',
    timestamp: '6/23/2026, 4:53:21 PM',
  },
  ...Array.from({ length: 9 }, (_, index): AuditLog => ({
    id: `al-${index + 2}`,
    name: 'Moshood Alimi',
    email: 'Moshood@gmail.com',
    role: 'Developer',
    activity: 'Added Meter',
    userAgent: 'Mozilla/5.0 ....',
    ip: '153.67.71.84',
    timestamp: '6/23/2026, 4:53:21 PM',
  })),
]

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function AuditLogsPage() {
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const visibleLogs = query
    ? seededLogs.filter((log) =>
        `${log.name} ${log.email}`.toLowerCase().includes(query),
      )
    : seededLogs

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Audit Logs</h1>
        <p className="dash-subtitle">
          Track system events and user actions for security and accountability
          here.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Audit Logs
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search user..."
              aria-label="Search users"
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
              <th>User</th>
              <th>Role</th>
              <th>Activity</th>
              <th>User Agent</th>
              <th>IP Address</th>
              <th>Time Stamp</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <p className="table-user">{log.name}</p>
                  <p className="table-user-email">{log.email}</p>
                </td>
                <td>{log.role}</td>
                <td>{log.activity}</td>
                <td>{log.userAgent}</td>
                <td>{log.ip}</td>
                <td>{log.timestamp}</td>
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

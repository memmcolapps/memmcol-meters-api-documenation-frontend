import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../app/AsyncState'
import { DateRangePicker, type DateRange } from '../../../app/DateRangePicker'
import {
  formatDateTime,
  formatStatusLabel,
  formatText,
  toList,
} from '../../../lib/format'
import {
  useAdminAuditLogs,
  type AdminAuditLog,
  type AdminAuditLogSortOrder,
} from '../../../features/admin-audit-logs/adminAuditLogQueries'

export const Route = createFileRoute('/admin/_admin/audit-logs')({
  component: AuditLogsPage,
})

const PAGE_SIZE = 20

function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<DateRange>({ from: null, to: null })
  const [sortOrder, setSortOrder] =
    useState<AdminAuditLogSortOrder>('desc')
  const [page, setPage] = useState(1)

  const auditLogsQuery = useAdminAuditLogs({
    search: search.trim() || undefined,
    from: range.from ? startOfDay(range.from).toISOString() : undefined,
    to: range.to ? endOfDay(range.to).toISOString() : undefined,
    page,
    limit: PAGE_SIZE,
    sortOrder,
  })
  const logs = toList<AdminAuditLog>(auditLogsQuery.data?.items)
  const pagination = auditLogsQuery.data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.totalPages ?? 1

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
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          {/* <button type="button" className="filter-btn">
            Filter <ChevronRightIcon />
          </button>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button> */}
          <select
            className="filter-btn"
            aria-label="Audit log sort order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as AdminAuditLogSortOrder)
              setPage(1)
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <DateRangePicker
            placeholder="Date Range"
            value={range}
            onChange={(next) => {
              setRange(next)
              setPage(1)
            }}
          />
        </div>
      </div>

      <AsyncState
        isPending={auditLogsQuery.isPending}
        error={auditLogsQuery.error}
        onRetry={() => void auditLogsQuery.refetch()}
      >
        <div className="table-scroll" aria-busy={auditLogsQuery.isFetching}>
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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <p className="table-user">{formatText(log.actor?.name)}</p>
                    <p className="table-user-email">{formatText(log.actor?.email)}</p>
                  </td>
                  <td>{formatStatusLabel(log.actor?.role)}</td>
                  <td>{formatText(log.activity)}</td>
                  <td>{formatText(log.userAgent)}</td>
                  <td>{formatText(log.ipAddress)}</td>
                  <td>{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="pagination" aria-label="Pagination">
          <button
            type="button"
            className="page-nav"
            disabled={currentPage <= 1 || auditLogsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeftIcon /> Previous
          </button>
          <div className="page-numbers">
            <span className="page-gap">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <button
            type="button"
            className="page-nav"
            disabled={currentPage >= totalPages || auditLogsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next <ChevronRightIcon />
          </button>
        </nav>
      </AsyncState>
    </div>
  )
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

// function SortIcon() {
//   return (
//     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//       <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
//     </svg>
//   )
// }

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

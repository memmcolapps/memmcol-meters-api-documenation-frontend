import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../app/AsyncState'
import { DatePicker } from '../../../app/DatePicker'
import { formatDateTime, formatText, toList } from '../../../lib/format'
import {
  useAdminRequestLogs,
  type AdminRequestLog,
  type AdminRequestLogSortOrder,
} from '../../../features/admin-request-logs/adminRequestLogQueries'

export const Route = createFileRoute('/admin/_admin/request-logs')({
  component: RequestLogsPage,
})

const PAGE_SIZE = 20

function RequestLogsPage() {
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [sortOrder, setSortOrder] =
    useState<AdminRequestLogSortOrder>('desc')
  const [page, setPage] = useState(1)

  const activeFilters = {
    search: search.trim() || undefined,
    from: from?.toISOString(),
    to: to?.toISOString(),
    sortOrder,
  }

  const requestLogsQuery = useAdminRequestLogs({
    ...activeFilters,
    page,
    limit: PAGE_SIZE,
  })
  const logs = toList<AdminRequestLog>(requestLogsQuery.data?.items)
  const pagination = requestLogsQuery.data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.totalPages ?? 1

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
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <button type="button" className="filter-btn">
            Filter <ChevronRightIcon />
          </button>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
          <select
            className="filter-btn"
            aria-label="Sort order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as AdminRequestLogSortOrder)
              setPage(1)
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <DatePicker
            placeholder="Date Range"
            initialDate={from ?? undefined}
            onChange={(date) => {
              setFrom(date)
              setTo(date)
              setPage(1)
            }}
          />
        </div>
      </div>

      <AsyncState
        isPending={requestLogsQuery.isPending}
        error={requestLogsQuery.error}
        onRetry={() => void requestLogsQuery.refetch()}
      >
        <div className="table-scroll" aria-busy={requestLogsQuery.isFetching}>
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
              {logs.map((log, index) => (
                <tr key={log.id}>
                  <td className="col-check">
                    <input type="checkbox" aria-label={`Select log ${index + 1}`} />
                  </td>
                  <td>
                    {String(
                      (currentPage - 1) * PAGE_SIZE + index + 1,
                    ).padStart(2, '0')}
                  </td>
                  <td>{formatText(log.organisation?.name)}</td>
                  <td>{formatDateTime(log.requestTime)}</td>
                  <td>{formatText(log.api?.name)}</td>
                  <td>
                    <span
                      className={`code-badge${log.code !== null &&
                        log.code !== undefined &&
                        log.code >= 400
                        ? ' is-error'
                        : ' is-ok'}`}
                    >
                      {log.code ?? '—'}
                    </span>
                  </td>
                  <td>{formatText(log.response)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="pagination" aria-label="Pagination">
          <button
            type="button"
            className="page-nav"
            disabled={currentPage <= 1 || requestLogsQuery.isFetching}
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
            disabled={currentPage >= totalPages || requestLogsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next <ChevronRightIcon />
          </button>
        </nav>
      </AsyncState>
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

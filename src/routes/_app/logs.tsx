import { useDeferredValue, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../app/AsyncState'
import { DatePicker } from '../../app/DatePicker'
import { useToast } from '../../app/toastContext'
import {
  useExportRequestLogs,
  useRequestLogs,
  type RequestLog,
  type RequestLogOutcome,
  type RequestLogSortOrder,
} from '../../features/request-logs/requestLogQueries'
import { getApiErrorMessage } from '../../lib/api/client'
import { formatDateTime, formatNumber, formatText, toList } from '../../lib/format'

export const Route = createFileRoute('/_app/logs')({
  component: LogsPage,
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

function formatDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function LogsPage() {
  const [search, setSearch] = useState('')
  const [apiId, setApiId] = useState('')
  const [code, setCode] = useState('')
  const [outcome, setOutcome] = useState<RequestLogOutcome | ''>('')
  const [date, setDate] = useState<Date | null>(null)
  const [sortOrder, setSortOrder] = useState<RequestLogSortOrder>('desc')
  const [page, setPage] = useState(1)
  const exportLogs = useExportRequestLogs()
  const { showToast } = useToast()
  const deferredSearch = useDeferredValue(search.trim())
  const deferredApiId = useDeferredValue(apiId.trim())
  const numericCode = Number(code)
  const codeFilter = /^\d{3}$/.test(code) && numericCode >= 100 && numericCode <= 599
    ? numericCode
    : undefined

  const logsQuery = useRequestLogs({
    search: deferredSearch || undefined,
    apiId: deferredApiId || undefined,
    code: codeFilter,
    outcome: outcome || undefined,
    from: date ? startOfDay(date) : undefined,
    to: date ? endOfDay(date) : undefined,
    page,
    limit: PAGE_SIZE,
    sortOrder,
  })
  const logs = toList<RequestLog>(logsQuery.data?.items)
  const summary = logsQuery.data?.summary
  const pagination = logsQuery.data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.totalPages ?? 1
  const stats = [
    { label: 'Total API Calls', value: formatNumber(summary?.totalApiCalls) },
    { label: 'Successful API Calls', value: formatNumber(summary?.successfulApiCalls) },
    { label: 'Failed API Calls', value: formatNumber(summary?.failedApiCalls) },
    { label: 'Credit Balance', value: formatNumber(summary?.creditBalance) },
  ]

  const handleExport = async () => {
    try {
      const { blob, filename } = await exportLogs.mutateAsync({
        date: date ? formatDateParam(date) : undefined,
        statusCode: codeFilter,
      })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || `request-logs-${date
        ? formatDateParam(date)
        : new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000)
    } catch (error) {
      showToast({
        title: 'Could not export logs',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Logs</h1>
        <p className="dash-subtitle">
          View and monitor API request logs, responses, and integration activity.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Summary
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search logs..."
              aria-label="Search request logs"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <input
            className="filter-input"
            type="text"
            placeholder="API ID"
            aria-label="Filter by API ID"
            value={apiId}
            onChange={(event) => {
              setApiId(event.target.value)
              setPage(1)
            }}
          />
          <input
            className="filter-input filter-input--code"
            type="number"
            min="100"
            max="599"
            placeholder="All codes"
            aria-label="Filter by response code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              setPage(1)
            }}
          />
          <select
            className="filter-btn"
            aria-label="Filter by outcome"
            value={outcome}
            onChange={(event) => {
              setOutcome(event.target.value as RequestLogOutcome | '')
              setPage(1)
            }}
          >
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="CLIENT_ERROR">Client error</option>
            <option value="SERVER_ERROR">Server error</option>
          </select>
          <DatePicker
            placeholder="Date"
            onChange={(date) => {
              setDate(date)
              setPage(1)
            }}
          />
          <select
            className="filter-btn"
            aria-label="Sort order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as RequestLogSortOrder)
              setPage(1)
            }}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
        <button
          type="button"
          className="btn-outline btn-icon"
          disabled={exportLogs.isPending}
          onClick={() => void handleExport()}
        >
          {exportLogs.isPending ? 'Exporting…' : 'Download'} <DownloadIcon />
        </button>
      </div>

      <AsyncState
        isPending={logsQuery.isPending}
        error={logsQuery.error}
        onRetry={() => void logsQuery.refetch()}
      >
        <section className="dash-stats dash-stats--4" aria-busy={logsQuery.isFetching}>
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <div className="stat-text">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
              <span className="stat-icon" aria-hidden="true">
                <ApiIcon />
              </span>
            </article>
          ))}
        </section>

        {logs.length ? (
          <section className="table-wrap">
            <div className="table-scroll" aria-busy={logsQuery.isFetching}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Request ID</th>
                    <th>Request Time</th>
                    <th>API Service</th>
                    <th>Code</th>
                    <th>Response</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id}>
                      <td>
                        {String(
                          (currentPage - 1) * (pagination?.limit ?? PAGE_SIZE) + index + 1,
                        ).padStart(2, '0')}
                      </td>
                      <td>{formatText(log.requestId)}</td>
                      <td>{formatDateTime(log.requestTime)}</td>
                      <td>{formatText(log.api?.name)}</td>
                      <td>
                        <span
                          className={`code-badge${log.code >= 400 ? ' is-error' : ' is-ok'}`}
                        >
                          {formatNumber(log.code)}
                        </span>
                      </td>
                      <td>{formatText(log.response)}</td>
                      <td>{formatNumber(log.creditsCharged)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Request logs pagination">
              <button
                type="button"
                className="page-nav"
                disabled={currentPage <= 1 || logsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeftIcon /> Previous
              </button>
              <div className="page-numbers">
                <span className="page-gap">
                  Page {currentPage} of {totalPages}
                  {' · '}{pagination?.total ?? logs.length} total
                </span>
              </div>
              <button
                type="button"
                className="page-nav"
                disabled={currentPage >= totalPages || logsQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next <ChevronRightIcon />
              </button>
            </nav>
          </section>
        ) : (
          <div className="meter-empty">
            <p className="meter-empty-text">No request logs found.</p>
          </div>
        )}
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

function ApiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M7 12h.01M12 12h.01M17 12h.01" />
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

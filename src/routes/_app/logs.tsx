import { createFileRoute } from '@tanstack/react-router'
import { DatePicker } from '../../app/DatePicker'

export const Route = createFileRoute('/_app/logs')({
  component: LogsPage,
})

const stats = [
  { label: 'Total API Calls', value: '1000' },
  { label: 'Used API Calls', value: '500' },
  { label: 'API Calls Left', value: '500' },
]

const logs = Array.from({ length: 8 }, (_, index) => {
  const isError = index === 0
  return {
    sn: String(index + 1).padStart(2, '0'),
    time: '6/23/2026, 4:53:21 PM',
    code: isError ? 400 : 200,
    response: isError ? 'Calls Exceeded' : 'Token generated successfully',
  }
})

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function LogsPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Logs</h1>
        <p className="dash-subtitle">
          View and monitor API request logs, responses, and inspect integration
          activity.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Summary
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <DatePicker placeholder="Today" />
          <button type="button" className="filter-btn">
            All code <ChevronIcon />
          </button>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
        </div>
        <button type="button" className="btn-primary">
          Download <DownloadIcon />
        </button>
      </div>

      <section className="dash-stats">
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

      <section className="table-wrap">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" aria-label="Select all rows" />
                </th>
                <th>S/N</th>
                <th>Request Time</th>
                <th>Code</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.sn}>
                  <td className="col-check">
                    <input type="checkbox" aria-label={`Select row ${log.sn}`} />
                  </td>
                  <td>{log.sn}</td>
                  <td>{log.time}</td>
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
      </section>
    </div>
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

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
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

function ApiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M7 12h.01M12 12h.01M17 12h.01" />
    </svg>
  )
}

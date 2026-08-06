import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../app/AsyncState'
import { DateRangePicker, type DateRange } from '../../app/DateRangePicker'
import { useUsageSummary } from '../../features/usage-summary/usageSummaryQueries'
import { formatDateTime, formatNumber, formatText, toList } from '../../lib/format'

export const Route = createFileRoute('/_app/logs')({
  component: LogsPage,
})

function formatDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function LogsPage() {
  const [range, setRange] = useState<DateRange>(() => {
    const today = new Date()
    return { from: today, to: today }
  })
  const today = new Date()

  const summaryQuery = useUsageSummary({
    from: formatDateParam(range.from ?? today),
    to: formatDateParam(range.to ?? today),
  })
  const summary = summaryQuery.data?.summary
  const services = toList<NonNullable<typeof summary>['usageByService'][number]>(
    summary?.usageByService,
  )
  const recentLogs = toList<NonNullable<typeof summary>['recentLogs'][number]>(
    summary?.recentLogs,
  )
  const stats = [
    { label: 'Total API Calls', value: formatNumber(summary?.totalApiCalls) },
    { label: 'Successful API Calls', value: formatNumber(summary?.successfulApiCalls) },
    { label: 'Failed API Calls', value: formatNumber(summary?.failedApiCalls) },
    { label: 'Credit Balance', value: formatNumber(summary?.creditBalance) },
  ]

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
          <DateRangePicker
            placeholder="Date Range"
            value={range}
            onChange={setRange}
          />
        </div>
      </div>

      <AsyncState
        isPending={summaryQuery.isPending}
        error={summaryQuery.error}
        onRetry={() => void summaryQuery.refetch()}
      >
        <section className="dash-stats dash-stats--4" aria-busy={summaryQuery.isFetching}>
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

        <section className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Usage by Service</h2>
          </div>
          {services.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>API Service</th>
                    <th>Calls</th>
                    <th>Credits Used</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.apiId}>
                      <td>{formatText(service.name)}</td>
                      <td>{formatNumber(service.calls)}</td>
                      <td>{formatNumber(service.creditsUsed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="meter-empty">
              <p className="meter-empty-text">No usage data is available for this period.</p>
            </div>
          )}
        </section>

        <section className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Recent Logs</h2>
          </div>
          {recentLogs.length ? (
            <div className="table-scroll" aria-busy={summaryQuery.isFetching}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Request Time</th>
                    <th>API Service</th>
                    <th>Code</th>
                    <th>Response</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatText(log.requestId)}</td>
                      <td>{formatDateTime(log.requestTime)}</td>
                      <td>{formatText(log.apiName)}</td>
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
          ) : (
            <div className="meter-empty">
              <p className="meter-empty-text">No recent logs are available for this period.</p>
            </div>
          )}
        </section>
      </AsyncState>
    </div>
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

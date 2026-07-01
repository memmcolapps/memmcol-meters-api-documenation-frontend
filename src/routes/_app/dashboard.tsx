import { createFileRoute } from '@tanstack/react-router'
import { DatePicker } from '../../app/DatePicker'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

const monthYear = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

const stats = [
  { label: 'Total API Calls', value: '1000' },
  { label: 'Used API Calls', value: '500' },
  { label: 'API Calls Left', value: '500' },
]

const CHART_MAX = 500

const usageData = [
  { label: 'Meter Master Data', value: 140 },
  { label: 'Consumption Data', value: 80 },
  { label: 'Event & Alarm Data', value: 290 },
  { label: 'Load Profile Data', value: 360 },
  { label: 'Remote Token Man.', value: 140 },
  { label: 'Remote Communication', value: 200 },
  { label: 'Token Generation', value: 240 },
]

const yTicks = [500, 400, 300, 200, 100, 0]

const successRate = 80

const logs = [
  { time: '6/23/2026, 4:53:21 PM', code: 400, response: 'Calls Exceeded' },
  { time: '6/23/2026, 4:53:21 PM', code: 200, response: 'Token generated successful' },
  { time: '6/23/2026, 4:53:21 PM', code: 200, response: 'Token generated successful' },
]

function DashboardPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">
          Get a real-time overview of your API usage, performance, and
          subscriptions.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Summary
        </button>
      </div>

      <DatePicker
        initialDate={new Date(2026, 5, 1)}
        formatLabel={monthYear}
        triggerClassName="dash-month"
      />

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

      <section className="dash-panel">
        <h2 className="panel-title">Monthly Usage</h2>
        <div className="chart">
          <div className="chart-y">
            {yTicks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <div className="chart-plot">
            <div className="chart-grid" aria-hidden="true">
              {yTicks.map((tick) => (
                <span key={tick} />
              ))}
            </div>
            <div className="chart-bars">
              {usageData.map((item) => (
                <div className="chart-col" key={item.label}>
                  <div
                    className="chart-bar"
                    style={{ height: `${(item.value / CHART_MAX) * 100}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                  <span className="chart-col-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dash-grid">
        <article className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Performance Metrics</h2>
            <div className="legend">
              <span className="legend-item">
                Success Rate <i className="legend-dot is-success" />
              </span>
              <span className="legend-item">
                Error Rate <i className="legend-dot is-error" />
              </span>
            </div>
          </div>
          <div className="gauge">
            <div
              className="donut"
              style={{
                background: `conic-gradient(var(--app-green) 0 ${successRate}%, #d64545 ${successRate}% 100%)`,
              }}
              role="img"
              aria-label={`Success rate ${successRate}%, error rate ${100 - successRate}%`}
            >
              <div className="donut-hole" />
            </div>
          </div>
        </article>

        <article className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Logs</h2>
            <button type="button" className="panel-link">
              See All
            </button>
          </div>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Request Time</th>
                <th>Code</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td>{log.time}</td>
                  <td>
                    <span
                      className={`code-badge${log.code >= 400 ? ' is-error' : ' is-ok'}`}
                    >
                      {log.code}
                    </span>
                  </td>
                  <td className="logs-response">{log.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
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

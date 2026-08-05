import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../../../app/AsyncState'
import { DatePicker } from '../../../app/DatePicker'
import {
  useAdminDashboardSummary,
  type AdminDashboardSummary,
} from '../../../features/admin-dashboard/adminDashboardQueries'
import { formatDateTime, formatNumber, formatText, toList } from '../../../lib/format'

export const Route = createFileRoute('/admin/_admin/dashboard')({
  component: AdminDashboardPage,
})

const yearLabel = (date: Date) => String(date.getFullYear())

function yearRange(date: Date) {
  const year = date.getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString()}`
  }
}

function AdminDashboardPage() {
  const [selectedYear, setSelectedYear] = useState(() => new Date())
  const range = yearRange(selectedYear)
  const summaryQuery = useAdminDashboardSummary(range)

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">
          Get a real-time overview of your organizations, performance, and
          subscriptions.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Summary
        </button>
      </div>

      <DatePicker
        initialDate={selectedYear}
        formatLabel={yearLabel}
        triggerClassName="dash-month"
        onChange={setSelectedYear}
      />

      <AsyncState
        isPending={summaryQuery.isPending}
        error={summaryQuery.error}
        onRetry={() => void summaryQuery.refetch()}
      >
        {summaryQuery.data ? (
          <DashboardSummary
            summary={summaryQuery.data}
            year={selectedYear.getFullYear()}
            isFetching={summaryQuery.isFetching}
          />
        ) : null}
      </AsyncState>
    </div>
  )
}

function DashboardSummary({
  summary,
  year,
  isFetching,
}: {
  summary: AdminDashboardSummary
  year: number
  isFetching: boolean
}) {
  const stats = [
    { label: 'Total Organizations', value: formatNumber(summary.totalOrganisations) },
    { label: 'Total Meters', value: formatNumber(summary.totalMeters) },
    { label: 'Total Active Plans', value: formatNumber(summary.totalActivePlans) },
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue, summary.currency),
    },
  ]
  const meters = toList<AdminDashboardSummary['meterCountByIntegration'][number]>(
    summary.meterCountByIntegration,
  )
  const meterScale = chartScale(meters.map((meter) => meter.count))
  const apiUsage = toList<AdminDashboardSummary['apiUsageBreakdown'][number]>(
    summary.apiUsageBreakdown,
  )
  const apiSegments = apiUsage.map((item, index) => ({
    ...item,
    color: API_COLORS[index % API_COLORS.length],
  }))
  const recentLogs = toList<AdminDashboardSummary['recentLogs'][number]>(
    summary.recentLogs,
  )
  const healthPoints = sampleHealthPoints(summary.serviceHealth.points)

  return (
    <>
      <section className="dash-stats dash-stats--4" aria-busy={isFetching}>
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
        <h2 className="panel-title">Meters by Integration</h2>
        {meters.length ? (
          <div className="chart">
            <div className="chart-y">
              {meterScale.ticks.map((tick) => (
                <span key={tick}>{formatNumber(tick)}</span>
              ))}
            </div>
            <div className="chart-plot">
              <div className="chart-grid" aria-hidden="true">
                {meterScale.ticks.map((tick) => <span key={tick} />)}
              </div>
              <div className="chart-bars">
                {meters.map((meter) => (
                  <div className="chart-col" key={meter.meterIntegrationId}>
                    <div
                      className="chart-bar"
                      style={{ height: `${(meter.count / meterScale.max) * 100}%` }}
                      title={`${meter.label}: ${meter.count.toLocaleString()}`}
                    />
                    <span className="chart-col-label">{meter.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState message="No meter data is available for this period." />
        )}
      </section>

      <section className="dash-grid">
        <article className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Performance by API</h2>
          </div>
          {apiSegments.length ? (
            <>
              <div className="gauge">
                <div
                  className="donut"
                  style={{ background: donutGradient(apiSegments) }}
                  role="img"
                  aria-label={apiSegments
                    .map((segment) => `${segment.name} ${segment.percentage}%`)
                    .join(', ')}
                >
                  <div className="donut-hole" />
                </div>
              </div>
              <div className="dashboard-api-legend" aria-label="API usage legend">
                {apiSegments.map((segment) => (
                  <span className="legend-item" key={segment.apiId}>
                    <i className="legend-dot" style={{ background: segment.color }} />
                    {segment.name}: {formatNumber(segment.calls)} ({segment.percentage}%)
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="No API usage is available for this period." />
          )}
        </article>

        <article className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Request Logs</h2>
            <Link to="/admin/request-logs" className="panel-link">
              See All
            </Link>
          </div>
          {recentLogs.length ? (
            <div className="table-scroll">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Request Time</th>
                    <th>API Service</th>
                    <th>Code</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatText(log.organisation?.name ?? log.organization?.name)}</td>
                      <td>{formatDateTime(log.requestTime)}</td>
                      <td>{formatText(log.api?.name)}</td>
                      <td>
                        <span
                          className={`code-badge${typeof log.code === 'number' && log.code >= 400
                            ? ' is-error'
                            : ' is-ok'}`}
                        >
                          {formatNumber(log.code)}
                        </span>
                      </td>
                      <td className="logs-response">{formatText(log.response)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No recent request logs are available." />
          )}
        </article>
      </section>

      <section className="dash-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Service Health — {year}</h2>
            <p className="panel-subtitle">
              {summary.serviceHealth.uptimePercentage.toLocaleString()}% uptime ·{' '}
              {formatNumber(summary.serviceHealth.averageResponseTimeMs)} ms average response time
            </p>
          </div>
          <div className="legend">
            <span className="legend-item">
              Uptime <i className="legend-dot is-success" />
            </span>
            <span className="legend-item">
              Downtime <i className="legend-dot is-error" />
            </span>
          </div>
        </div>
        {healthPoints.length ? (
          <UptimeChart points={healthPoints} />
        ) : (
          <EmptyState message="No service-health points are available for this period." />
        )}
      </section>
    </>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="meter-empty">
      <p className="meter-empty-text">{message}</p>
    </div>
  )
}

function chartScale(values: number[]) {
  const largest = Math.max(0, ...values)
  if (largest === 0) return { max: 1, ticks: [1, 0.8, 0.6, 0.4, 0.2, 0] }
  const roughStep = largest / 5
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceStep = normalized <= 1
    ? magnitude
    : normalized <= 2
      ? 2 * magnitude
      : normalized <= 5
        ? 5 * magnitude
        : 10 * magnitude
  const max = Math.max(
    niceStep * 5,
    Math.ceil(largest / niceStep) * niceStep,
  )
  return {
    max,
    ticks: Array.from({ length: 6 }, (_, index) => max - index * niceStep),
  }
}

const API_COLORS = ['#123524', '#9fb3a4', '#d64545', '#0b2e1f', '#26b8ce', '#2f9e44']
const SEGMENT_GAP = 0.75

function donutGradient(
  segments: Array<{ percentage: number; color: string }>,
) {
  let start = 0
  const stops: string[] = []
  for (const segment of segments) {
    const value = Math.max(0, segment.percentage)
    const end = start + value
    const gap = Math.min(SEGMENT_GAP, value / 4)
    stops.push(`${segment.color} ${start}% ${Math.max(start, end - gap)}%`)
    stops.push(`#ffffff ${Math.max(start, end - gap)}% ${end}%`)
    start = end
  }
  return stops.length ? `conic-gradient(${stops.join(', ')})` : '#edf0ee'
}

type HealthPoint = AdminDashboardSummary['serviceHealth']['points'][number]

function sampleHealthPoints(points: HealthPoint[], limit = 12) {
  const safePoints = toList<HealthPoint>(points)
  if (safePoints.length <= limit) return safePoints
  return Array.from({ length: limit }, (_, index) =>
    safePoints[Math.round(index * (safePoints.length - 1) / (limit - 1))])
}

const PLOT = { left: 44, right: 752, top: 14, bottom: 258, labelY: 286 }

function chartPoints(series: number[]) {
  if (series.length === 0) return []
  const stepX = series.length === 1
    ? 0
    : (PLOT.right - PLOT.left) / (series.length - 1)
  return series.map((value, index) => ({
    x: series.length === 1 ? (PLOT.left + PLOT.right) / 2 : PLOT.left + index * stepX,
    y: PLOT.bottom - (Math.max(0, Math.min(100, value)) / 100) *
      (PLOT.bottom - PLOT.top),
  }))
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function UptimeChart({ points }: { points: HealthPoint[] }) {
  const uptime = points.map((point) => point.uptimePercentage)
  const upPoints = chartPoints(uptime)
  const downPoints = chartPoints(uptime.map((value) => 100 - value))
  const yAxis = [0, 20, 40, 60, 80, 100]
  const labelStep = points.length === 1
    ? 0
    : (PLOT.right - PLOT.left) / (points.length - 1)

  return (
    <svg
      className="uptime-chart"
      viewBox="0 0 780 300"
      role="img"
      aria-label="Uptime and downtime trend chart"
    >
      {yAxis.map((tick) => (
        <text
          key={tick}
          x={PLOT.left - 10}
          y={PLOT.bottom - (tick / 100) * (PLOT.bottom - PLOT.top) + 4}
          textAnchor="end"
          className="uptime-chart-tick"
        >
          {tick}
        </text>
      ))}
      {points.map((point, index) => (
        <text
          key={point.timestamp}
          x={points.length === 1
            ? (PLOT.left + PLOT.right) / 2
            : PLOT.left + index * labelStep}
          y={PLOT.labelY}
          textAnchor="middle"
          className="uptime-chart-tick"
        >
          {formatHealthTimestamp(point.timestamp)}
        </text>
      ))}

      <Line points={downPoints} color="#e03131" />
      <Line points={upPoints} color="#2f9e44" />
    </svg>
  )
}

function formatHealthTimestamp(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
}

function Line({ points, color }: { points: Array<{ x: number; y: number }>; color: string }) {
  return (
    <g>
      {points.length > 1 ? (
        <path d={smoothPath(points)} fill="none" stroke={color} strokeWidth="1.6" />
      ) : null}
      {points.map((point, index) => (
        <g key={index}>
          <circle cx={point.x} cy={point.y} r="7" fill={color} opacity="0.18" />
          <circle cx={point.x} cy={point.y} r="3.2" fill={color} />
        </g>
      ))}
    </g>
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

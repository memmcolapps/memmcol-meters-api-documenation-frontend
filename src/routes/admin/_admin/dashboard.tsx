import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DatePicker } from '../../../app/DatePicker'
import { useDismiss } from '../../../app/useDismiss'
import { useAnchoredMenu } from '../../../app/useAnchoredMenu'

export const Route = createFileRoute('/admin/_admin/dashboard')({
  component: AdminDashboardPage,
})

const yearLabel = (date: Date) => String(date.getFullYear())

const stats = [
  { label: 'Total Organizations', value: '100' },
  { label: 'Total Meters', value: '10,000' },
  { label: 'Total Active Plans', value: '99' },
  { label: 'Total Revenue', value: '₦99,000' },
]

const CHART_MAX = 500

const topMeters = [
  { label: 'MMX-310-NG (Momas)', value: 410 },
  { label: 'MMX-313-CT (Momas)', value: 230 },
  { label: 'MMX-110-NG (Momas)', value: 230 },
  { label: 'MMX-110-NG (Mojec)', value: 230 },
  { label: 'MMX-110-NG (Hexing)', value: 230 },
]

const yTicks = [500, 400, 300, 200, 100, 0]

const apiSegments = [
  { label: 'Meter Master Data', value: 18, color: '#123524' },
  { label: 'Consumption Data', value: 15, color: '#9fb3a4' },
  { label: 'Load Profile Data', value: 20, color: '#d64545' },
  { label: 'Remote Communication', value: 5, color: '#0b2e1f' },
  { label: 'Token Generation', value: 12, color: '#26b8ce' },
  { label: 'Event & Alarm Data', value: 30, color: '#2f9e44' },
]

const SEGMENT_GAP = 1

function donutGradient() {
  let start = 0
  const stops: string[] = []
  for (const segment of apiSegments) {
    const end = start + segment.value
    stops.push(`${segment.color} ${start}% ${end - SEGMENT_GAP}%`)
    stops.push(`#ffffff ${end - SEGMENT_GAP}% ${end}%`)
    start = end
  }
  return `conic-gradient(${stops.join(', ')})`
}

const requestLogs = [
  {
    organization: 'Buypower',
    time: '6/23/2026, 4:53:21 PM',
    service: 'Consumption Data',
    code: 400,
    response: 'Calls Exceeded',
  },
  {
    organization: 'Buypower',
    time: '6/23/2026, 4:53:21 PM',
    service: 'Consumption Data',
    code: 200,
    response: 'Token generated successfully',
  },
  {
    organization: 'Buypower',
    time: '6/23/2026, 4:53:21 PM',
    service: 'Consumption Data',
    code: 200,
    response: 'Token generated successfully',
  },
]

const uptimeRanges = [
  'Last 30 mins',
  'Last 1 hour',
  'Last 12 hours',
  'Last 24 hours',
  'Last 3 Days',
  'Last 5 Days',
  'Last 7 Days',
]

const uptimeSeries = [43, 52, 36, 85, 42, 16, 16, 55, 58, 15, 98, 98, 16]
const downtimeSeries = [72, 18, 33, 20, 42, 43, 58, 60, 12, 30, 60, 97, 42]
const uptimeLabels = ['01/07', '02/07', '03/07', '04/07', '05/07', '06/07', '07/07']

function AdminDashboardPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">
          Get a real-time overview of your Organizations, performance, and
          subscriptions.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Summary
        </button>
      </div>

      <DatePicker
        initialDate={new Date(2026, 0, 1)}
        formatLabel={yearLabel}
        triggerClassName="dash-month"
      />

      <section className="dash-stats dash-stats--4">
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
        <h2 className="panel-title">Top Performing Meters</h2>
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
              {topMeters.map((item) => (
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
            <h2 className="panel-title">Performance by API</h2>
          </div>
          <div className="gauge">
            <div className="donut-wrap">
              <div
                className="donut"
                style={{ background: donutGradient() }}
                role="img"
                aria-label={apiSegments
                  .map((segment) => `${segment.label} ${segment.value}%`)
                  .join(', ')}
              >
                <div className="donut-hole" />
              </div>
              <span className="donut-tip">Event &amp; Alarm Data: 30%</span>
            </div>
          </div>
        </article>

        <article className="dash-panel">
          <div className="panel-head">
            <h2 className="panel-title">Request Logs</h2>
            <button type="button" className="panel-link">
              See All
            </button>
          </div>
          <div className="table-scroll">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Request Time</th>
                  <th>API Services</th>
                  <th>Code</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {requestLogs.map((log, index) => (
                  <tr key={index}>
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
                    <td className="logs-response">{log.response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <UptimePanel />
    </div>
  )
}

function UptimePanel() {
  const [range, setRange] = useState('Last 7 days')

  return (
    <section className="dash-panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Annual Uptime &amp; Downtime Performance (%)</h2>
          <p className="panel-subtitle">
            Monthly uptime and downtime trend across all utilities for the past
            year.
          </p>
        </div>
        <div className="panel-actions">
          <div className="legend">
            <span className="legend-item">
              Uptime <i className="legend-dot is-success" />
            </span>
            <span className="legend-item">
              Downtime <i className="legend-dot is-error" />
            </span>
          </div>
          <RangeDropdown value={range} onChange={setRange} />
        </div>
      </div>
      <UptimeChart />
    </section>
  )
}

function RangeDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)
  const { anchorRef, menuStyle } = useAnchoredMenu(open)

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="filter-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {value} <ChevronDownIcon />
      </button>
      {open ? (
        <div className="row-menu" style={menuStyle} role="menu">
          {uptimeRanges.map((option) => (
            <button
              type="button"
              key={option}
              className="row-menu-item"
              role="menuitem"
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const PLOT = { left: 44, right: 752, top: 14, bottom: 258, labelY: 286 }

function chartPoints(series: number[]) {
  const stepX = (PLOT.right - PLOT.left) / (series.length - 1)
  return series.map((value, index) => ({
    x: Math.round((PLOT.left + index * stepX) * 10) / 10,
    y: Math.round((PLOT.bottom - (value / 100) * (PLOT.bottom - PLOT.top)) * 10) / 10,
  }))
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1x = Math.round((p1.x + (p2.x - p0.x) / 6) * 10) / 10
    const c1y = Math.round((p1.y + (p2.y - p0.y) / 6) * 10) / 10
    const c2x = Math.round((p2.x - (p3.x - p1.x) / 6) * 10) / 10
    const c2y = Math.round((p2.y - (p3.y - p1.y) / 6) * 10) / 10
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function UptimeChart() {
  const upPoints = chartPoints(uptimeSeries)
  const downPoints = chartPoints(downtimeSeries)
  const yAxis = [0, 20, 40, 60, 80, 100]
  const labelStep = (PLOT.right - PLOT.left) / (uptimeLabels.length - 1)

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
      {uptimeLabels.map((label, index) => (
        <text
          key={label}
          x={PLOT.left + index * labelStep}
          y={PLOT.labelY}
          textAnchor="middle"
          className="uptime-chart-tick"
        >
          {label}
        </text>
      ))}

      <Line points={downPoints} color="#e03131" />
      <Line points={upPoints} color="#2f9e44" />
    </svg>
  )
}

function Line({ points, color }: { points: { x: number; y: number }[]; color: string }) {
  return (
    <g>
      <path d={smoothPath(points)} fill="none" stroke={color} strokeWidth="1.6" />
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

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

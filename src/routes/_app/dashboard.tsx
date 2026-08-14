import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DatePicker } from "../../app/DatePicker";
import { getApiErrorMessage } from "../../lib/api/client";
import {
  toMonthRange,
  useDashboardSummary,
} from "../../features/customer-dashboard/customerDashboardQueries";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const monthYear = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

function DashboardPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const { from, to } = useMemo(() => toMonthRange(month), [month]);
  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useDashboardSummary({ from, to });

  const usageByService = summary?.usageByService ?? [];
  const chartMax = Math.max(...usageByService.map((item) => item.calls), 1);
  const yTicks = buildTicks(chartMax);
  const axisMax = yTicks[0];
  const [hoveredSegment, setHoveredSegment] = useState<
    "success" | "error" | null
  >(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const successRate = summary?.successRate ?? 0;
  const errorRate = 100 - successRate;
  const successDash = (successRate / 100) * circumference;
  const errorDash = (errorRate / 100) * circumference;

  const handleMouseMove = (e: React.MouseEvent<SVGCircleElement>) => {
    const wrapRect = e.currentTarget
      .closest(".donut-wrap")!
      .getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - wrapRect.left,
      y: e.clientY - wrapRect.top,
    });
  };

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
        <button
          type="button"
          className="dash-tab is-active"
          role="tab"
          aria-selected="true"
        >
          Summary
        </button>
      </div>

      <DatePicker
        initialDate={month}
        formatLabel={monthYear}
        triggerClassName="dash-month"
        onChange={setMonth}
      />

      {isLoading ? (
        <div className="dash-panel">
          <p className="meter-empty-text">Loading dashboard…</p>
        </div>
      ) : isError ? (
        <div className="dash-panel">
          <p className="modal-field-error" role="alert">
            {getApiErrorMessage(error)}
          </p>
        </div>
      ) : summary ? (
        <>
          <section className="dash-stats">
            {[
              {
                label: "Total API Calls",
                value: summary.totalApiCalls.toLocaleString(),
              },
              {
                label: "Credits Used",
                value: summary.creditsUsed.toLocaleString(),
              },
              {
                label: "Credit Balance",
                value: summary.creditBalance.toLocaleString(),
              },
            ].map((stat) => (
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
            {usageByService.length === 0 ? (
              <p className="chart-empty">No usage recorded for this period.</p>
            ) : (
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
                    {usageByService.map((item) => (
                      <div className="chart-col" key={item.apiId}>
                        <div
                          className="chart-bar"
                          style={{
                            height: `${(item.calls / axisMax) * 100}%`,
                          }}
                          title={`${item.name}: ${item.calls}`}
                        />
                        <span className="chart-col-label">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                <div className="donut-wrap">
                  <svg
                    viewBox="0 0 120 120"
                    width="220"
                    height="220"
                    role="img"
                    aria-label={`Success rate ${successRate}%, error rate ${errorRate.toFixed(2)}%`}
                  >
                    {/* Success arc */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="var(--app-green)"
                      strokeWidth="22"
                      strokeDasharray={`${successDash} ${circumference - successDash}`}
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                      onMouseEnter={() => setHoveredSegment("success")}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoveredSegment(null)}
                      style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                    />
                    {/* Error arc */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#d64545"
                      strokeWidth="22"
                      strokeDasharray={`${errorDash} ${circumference - errorDash}`}
                      strokeDashoffset={-successDash}
                      transform="rotate(-90 60 60)"
                      onMouseEnter={() => setHoveredSegment("error")}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoveredSegment(null)}
                      style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                    />
                  </svg>

                  {hoveredSegment && (
                    <div
                      className={`donut-tooltip ${hoveredSegment === "success" ? "is-success" : "is-error"}`}
                      style={{ left: tooltipPos.x, top: tooltipPos.y }}
                    >
                      {hoveredSegment === "success"
                        ? `Success: ${successRate}%`
                        : `Error: ${errorRate.toFixed(2)}%`}
                    </div>
                  )}
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
              {summary.recentLogs.length === 0 ? (
                <p className="logs-empty">No requests in this period.</p>
              ) : (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Request Time</th>
                      <th>Code</th>
                      <th>Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatLogTime(log.requestTime)}</td>
                        <td>
                          <span
                            className={`code-badge${log.code >= 400 ? " is-error" : " is-ok"}`}
                          >
                            {log.code}
                          </span>
                        </td>
                        {log.response === null ? (
                          <td>No Response </td>
                        ) : (
                          <td className="logs-response">{log.response}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function buildTicks(max: number) {
  const step = Math.max(Math.ceil(max / 5 / 10) * 10, 10);
  return [5, 4, 3, 2, 1, 0].map((n) => step * n);
}

function ApiIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M7 12h.01M12 12h.01M17 12h.01" />
    </svg>
  );
}

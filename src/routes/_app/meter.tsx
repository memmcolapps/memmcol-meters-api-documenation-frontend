import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/meter')({
  component: MeterPage,
})

function MeterPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Meter</h1>
        <p className="dash-subtitle">
          Manage and monitor your connected meters.
        </p>
      </header>
      <section className="dash-panel">
        <div className="panel-empty" />
      </section>
    </div>
  )
}

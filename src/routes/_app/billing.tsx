import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/billing')({
  component: BillingPage,
})

function BillingPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Billing</h1>
        <p className="dash-subtitle">
          Review invoices, subscriptions, and payment history.
        </p>
      </header>
      <section className="dash-panel">
        <div className="panel-empty" />
      </section>
    </div>
  )
}

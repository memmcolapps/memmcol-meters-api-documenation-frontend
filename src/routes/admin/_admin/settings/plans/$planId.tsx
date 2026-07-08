import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PlanFormModal, NigeriaFlagIcon } from '../../../../../app/PlanFormModal'
import { seededPlans, type Plan } from '../../../../../app/adminPlans'

export const Route = createFileRoute(
  '/admin/_admin/settings/plans/$planId',
)({
  component: PlanViewPage,
})

function PlanViewPage() {
  const { planId } = Route.useParams()
  const [plan, setPlan] = useState<Plan | undefined>(() =>
    seededPlans.find((item) => item.id === planId),
  )
  const [editing, setEditing] = useState(false)

  if (!plan) {
    return (
      <div className="dash">
        <header className="dash-head">
          <h1 className="dash-title">Plans &amp; Pricing</h1>
          <p className="dash-subtitle">This plan could not be found.</p>
        </header>
      </div>
    )
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Plans &amp; Pricing</h1>
        <p className="dash-subtitle">
          Manage customer subscriptions, plans, and API access.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Subscription Plans
        </button>
      </div>

      <div className="api-view-actions">
        <button type="button" className="btn-neutral" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      <div className="api-view">
        <div className="modal-field">
          <label>Name</label>
          <input className="modal-input" value={plan.name} readOnly />
        </div>

        <div className="modal-field">
          <label>Description</label>
          <textarea className="modal-input" rows={2} value={plan.description} readOnly />
        </div>

        <div className="modal-field">
          <label>Amount</label>
          <div className="amount-input">
            <span className="amount-prefix" aria-hidden="true">
              <NigeriaFlagIcon /> ₦
            </span>
            <input value={plan.amount} readOnly aria-label="Amount in naira" />
          </div>
        </div>

        <div className="modal-field">
          <label>Credits</label>
          <input className="modal-input" value={plan.credits} readOnly />
        </div>

        <div className="modal-field">
          <label>Features</label>
          <ol className="plan-features">
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ol>
        </div>

        <div className="modal-field">
          <label>Set Status</label>
          <label className="status-box">
            {plan.status}
            <input type="checkbox" checked={plan.status === 'Active'} readOnly disabled />
          </label>
        </div>

        <div className="modal-field">
          <label>CTA</label>
          <input className="modal-input" value={plan.cta} readOnly />
        </div>
      </div>

      {editing ? (
        <PlanFormModal
          title="Edit Subscription Plan"
          submitLabel="Save Changes"
          initial={plan}
          onClose={() => setEditing(false)}
          onSubmit={(values) => {
            setPlan((prev) => (prev ? { ...prev, ...values } : prev))
            setEditing(false)
          }}
        />
      ) : null}
    </div>
  )
}

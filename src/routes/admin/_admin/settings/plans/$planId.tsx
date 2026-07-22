import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { PlanFormModal, NigeriaFlagIcon } from '../../../../../app/PlanFormModal'
import { useToast } from '../../../../../app/toastContext'
import { formatAddedDate } from '../../../../../app/adminMeters'
import {
  seededPlans,
  type Plan,
  type PlanFormField,
  type PlanFormValues,
} from '../../../../../app/adminPlans'
import {
  getBillingPlanUpdateError,
  getCachedBillingPlan,
  useUpdateBillingPlan,
  type BillingPlan,
} from '../../../../../features/billing/billingPlanQueries'

export const Route = createFileRoute(
  '/admin/_admin/settings/plans/$planId',
)({
  component: PlanViewPage,
})

function PlanViewPage() {
  const { planId } = Route.useParams()
  const queryClient = useQueryClient()
  const updatePlan = useUpdateBillingPlan()
  const { showToast } = useToast()
  const [plan, setPlan] = useState<Plan | undefined>(() =>
    toDisplayPlan(getCachedBillingPlan(queryClient, planId)) ??
      seededPlans.find((item) => item.id === planId),
  )
  const [editing, setEditing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PlanFormField, string>>
  >({})

  const savePlan = async (values: PlanFormValues) => {
    if (!plan) return
    setFieldErrors({})
    try {
      const updated = await updatePlan.mutateAsync({ planId: plan.id, ...values })
      setPlan((current) => current ? { ...current, ...updated } : current)
      setEditing(false)
      showToast({
        title: 'Credit plan updated',
        message: `${updated.name} was updated successfully.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getBillingPlanUpdateError(error)
      const fields = apiError.fields as Partial<Record<PlanFormField, string>>
      setFieldErrors(fields)
      showToast({
        title: apiError.message,
        message: [
          [...new Set(Object.values(fields))].join(' '),
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ].filter(Boolean).join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

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
        <button
          type="button"
          className="btn-neutral"
          onClick={() => {
            updatePlan.reset()
            setFieldErrors({})
            setEditing(true)
          }}
        >
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
            <input value={plan.amount.toLocaleString()} readOnly aria-label="Amount in naira" />
          </div>
        </div>

        <div className="modal-field">
          <label>Credits</label>
          <input className="modal-input" value={plan.credits.toLocaleString()} readOnly />
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
            {plan.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            <input type="checkbox" checked={plan.status === 'ACTIVE'} readOnly disabled />
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
          isSubmitting={updatePlan.isPending}
          fieldErrors={fieldErrors}
          onFieldChange={(field) => {
            setFieldErrors((current) => {
              if (!current[field]) return current
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onClose={() => {
            if (!updatePlan.isPending) setEditing(false)
          }}
          onSubmit={(values) => void savePlan(values)}
        />
      ) : null}
    </div>
  )
}

function toDisplayPlan(plan?: BillingPlan): Plan | undefined {
  return plan ? {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    amount: plan.amount,
    credits: plan.credits,
    features: plan.features,
    cta: plan.cta,
    status: plan.status,
    addedDate: formatAddedDate(new Date(plan.createdAt)),
  } : undefined
}

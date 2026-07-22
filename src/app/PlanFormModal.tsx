import { useRef, useState, type KeyboardEvent } from 'react'
import { useDismiss } from './useDismiss'
import {
  ctaOptions,
  type Plan,
  type PlanFormField,
  type PlanFormValues,
} from './adminPlans'

export function PlanFormModal({
  title,
  submitLabel,
  initial,
  isSubmitting = false,
  fieldErrors = {},
  onFieldChange,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  initial?: Plan
  isSubmitting?: boolean
  fieldErrors?: Partial<Record<PlanFormField, string>>
  onFieldChange?: (field: PlanFormField) => void
  onClose: () => void
  onSubmit: (values: PlanFormValues) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [credits, setCredits] = useState(initial ? String(initial.credits) : '')
  const [features, setFeatures] = useState<string[]>(initial?.features ?? [])
  const [featureDraft, setFeatureDraft] = useState('')
  const [active, setActive] = useState(initial ? initial.status === 'ACTIVE' : true)
  const [cta, setCta] = useState(initial?.cta ?? ctaOptions[0])
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const addFeature = () => {
    const value = featureDraft.trim()
    if (value && !features.includes(value)) {
      setFeatures((prev) => [...prev, value])
      onFieldChange?.('features')
    }
    setFeatureDraft('')
  }

  const handleFeatureKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addFeature()
    } else if (event.key === 'Backspace' && featureDraft === '' && features.length > 0) {
      setFeatures((prev) => prev.slice(0, -1))
      onFieldChange?.('features')
    }
  }

  const amountNumber = parsePlanNumber(amount)
  const creditsNumber = parsePlanNumber(credits)
  const canSubmit =
    name.trim() !== '' &&
    description.trim() !== '' &&
    amountNumber > 0 &&
    creditsNumber > 0 &&
    cta.trim() !== ''

  const handleSubmit = () => {
    if (!canSubmit) return
    const draft = featureDraft.trim()
    const submittedFeatures = draft && !features.includes(draft)
      ? [...features, draft]
      : features
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      amount: amountNumber,
      credits: creditsNumber,
      features: submittedFeatures,
      status: active ? 'ACTIVE' : 'INACTIVE',
      cta: cta.trim(),
    })
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-form-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="plan-form-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose} disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Name <span className="req">*</span></label>
            <input
              className="modal-input"
              placeholder="E.g. Gold Platter"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                onFieldChange?.('name')
              }}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={isSubmitting}
            />
            {fieldErrors.name ? <span className="modal-field-error" role="alert">{fieldErrors.name}</span> : null}
          </div>

          <div className="modal-field">
            <label>Description <span className="req">*</span></label>
            <textarea
              className="modal-input"
              rows={2}
              placeholder="E.g. Great for big enterprise looking to manage their facility"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                onFieldChange?.('description')
              }}
              aria-invalid={Boolean(fieldErrors.description)}
              disabled={isSubmitting}
            />
            {fieldErrors.description ? <span className="modal-field-error" role="alert">{fieldErrors.description}</span> : null}
          </div>

          <div className="modal-field">
            <label>Amount <span className="req">*</span></label>
            <div className="amount-input">
              <span className="amount-prefix" aria-hidden="true">
                <NigeriaFlagIcon /> ₦
              </span>
              <input
                inputMode="numeric"
                placeholder="E.g. 10,000,000"
                aria-label="Amount in naira"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  onFieldChange?.('amount')
                }}
                aria-invalid={Boolean(fieldErrors.amount)}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.amount ? <span className="modal-field-error" role="alert">{fieldErrors.amount}</span> : null}
          </div>

          <div className="modal-field">
            <label>Credits <span className="req">*</span></label>
            <input
              className="modal-input"
              inputMode="numeric"
              placeholder="E.g. 100,000"
              value={credits}
              onChange={(e) => {
                setCredits(e.target.value)
                onFieldChange?.('credits')
              }}
              aria-invalid={Boolean(fieldErrors.credits)}
              disabled={isSubmitting}
            />
            {fieldErrors.credits ? <span className="modal-field-error" role="alert">{fieldErrors.credits}</span> : null}
          </div>

          <div className="modal-field">
            <label>Features</label>
            <div className="tag-box">
              <input
                className="tag-input"
                placeholder="Type here"
                aria-label="Add a feature and press Enter"
                value={featureDraft}
                onChange={(e) => {
                  setFeatureDraft(e.target.value)
                  onFieldChange?.('features')
                }}
                onKeyDown={handleFeatureKey}
                onBlur={addFeature}
                aria-invalid={Boolean(fieldErrors.features)}
                disabled={isSubmitting}
              />
              {features.length > 0 ? (
                <div className="tag-list">
                  {features.map((feature) => (
                    <span className="tag-chip" key={feature}>
                      {feature}
                      <button
                        type="button"
                        aria-label={`Remove ${feature}`}
                        disabled={isSubmitting}
                        onClick={() => {
                          setFeatures((prev) => prev.filter((f) => f !== feature))
                          onFieldChange?.('features')
                        }}
                      >
                        <SmallCloseIcon />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {fieldErrors.features ? <span className="modal-field-error" role="alert">{fieldErrors.features}</span> : null}
          </div>

          <div className="modal-field">
            <label>Set Status</label>
            <label className="status-box">
              {active ? 'Active' : 'Inactive'}
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => {
                  setActive(e.target.checked)
                  onFieldChange?.('status')
                }}
                aria-invalid={Boolean(fieldErrors.status)}
                disabled={isSubmitting}
              />
            </label>
            {fieldErrors.status ? <span className="modal-field-error" role="alert">{fieldErrors.status}</span> : null}
          </div>

          <div className="modal-field">
            <label>CTA <span className="req">*</span></label>
            <select
              className="modal-select"
              value={cta}
              onChange={(e) => {
                setCta(e.target.value)
                onFieldChange?.('cta')
              }}
              aria-invalid={Boolean(fieldErrors.cta)}
              disabled={isSubmitting}
            >
              {ctaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.cta ? <span className="modal-field-error" role="alert">{fieldErrors.cta}</span> : null}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function parsePlanNumber(value: string) {
  const parsed = Number(value.replaceAll(',', '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

export function NigeriaFlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9.5" fill="#ffffff" stroke="#e1e5e1" />
      <path d="M0.5 10a9.5 9.5 0 0 1 6.2-8.9v17.8A9.5 9.5 0 0 1 0.5 10Z" fill="#1f8a4c" />
      <path d="M19.5 10a9.5 9.5 0 0 0-6.2-8.9v17.8a9.5 9.5 0 0 0 6.2-8.9Z" fill="#1f8a4c" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SmallCloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

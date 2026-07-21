import { useRef, useState } from 'react'
import { useDismiss } from './useDismiss'
import type { SupportedMeter } from './adminMeters'

export type MeterFormValues = Pick<
  SupportedMeter,
  | 'manufacturer'
  | 'category'
  | 'meterClass'
  | 'model'
  | 'protocol'
  | 'authenticationType'
  | 'description'
> & { password: string }

export type MeterFormField = keyof MeterFormValues

const meterCategories = ['Prepaid', 'Post-paid']
const meterClasses = ['MD', 'Single-Phase', 'Three-Phase']

export function MeterFormModal({
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
  initial?: Partial<MeterFormValues>
  isSubmitting?: boolean
  fieldErrors?: Partial<Record<MeterFormField | 'class', string>>
  onFieldChange?: (field: MeterFormField) => void
  onClose: () => void
  onSubmit: (values: MeterFormValues) => void
}) {
  const [form, setForm] = useState({
    manufacturer: initial?.manufacturer ?? '',
    category: initial?.category ?? '',
    meterClass: initial?.meterClass ?? '',
    model: initial?.model ?? '',
    protocol: initial?.protocol ?? '',
    authenticationType: initial?.authenticationType ?? '',
    password: '',
    description: initial?.description ?? '',
  })
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: MeterFormField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    onFieldChange?.(key)
  }

  const canSubmit =
    form.manufacturer.trim() &&
    form.category.trim() &&
    form.meterClass.trim() &&
    form.model.trim() &&
    form.protocol.trim() &&
    form.authenticationType.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      manufacturer: form.manufacturer.trim(),
      category: form.category,
      meterClass: form.meterClass,
      model: form.model.trim(),
      protocol: form.protocol.trim(),
      authenticationType: form.authenticationType.trim(),
      password: form.password,
      description: form.description.trim(),
    })
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="meter-form-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="meter-form-title" className="modal-title">
              {title}
            </h2>
            <p className="modal-subtitle">Basic Meter Information</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <Field label="Meter Manufacturer" error={fieldErrors.manufacturer}>
            <input
              className="modal-input"
              placeholder="Enter Manufacturer"
              value={form.manufacturer}
              onChange={(e) => set('manufacturer', e.target.value)}
              aria-invalid={Boolean(fieldErrors.manufacturer)}
              disabled={isSubmitting}
            />
          </Field>

          <div className="modal-grid">
            <Field label="Meter Category" error={fieldErrors.category}>
              <select
                className="modal-select"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                aria-invalid={Boolean(fieldErrors.category)}
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select Category
                </option>
                {meterCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Meter Class" error={fieldErrors.meterClass ?? fieldErrors.class}>
              <select
                className="modal-select"
                value={form.meterClass}
                onChange={(e) => set('meterClass', e.target.value)}
                aria-invalid={Boolean(fieldErrors.meterClass ?? fieldErrors.class)}
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select Class
                </option>
                {meterClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Meter Model" error={fieldErrors.model}>
            <input
              className="modal-input"
              placeholder="Enter Model"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
              aria-invalid={Boolean(fieldErrors.model)}
              disabled={isSubmitting}
            />
          </Field>

          <div className="modal-grid">
            <Field label="Protocol" error={fieldErrors.protocol}>
              <input
                className="modal-input"
                placeholder="Enter Protocol"
                value={form.protocol}
                onChange={(e) => set('protocol', e.target.value)}
                aria-invalid={Boolean(fieldErrors.protocol)}
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Authentication" error={fieldErrors.authenticationType}>
              <input
                className="modal-input"
                placeholder="Enter Authentication"
                value={form.authenticationType}
                onChange={(e) => set('authenticationType', e.target.value)}
                aria-invalid={Boolean(fieldErrors.authenticationType)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field label="Password" error={fieldErrors.password}>
            <input
              className="modal-input"
              type="password"
              placeholder="Enter Password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </Field>

          <Field label="Description" error={fieldErrors.description}>
            <textarea
              className="modal-input"
              rows={3}
              placeholder="Describe this meter integration"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              aria-invalid={Boolean(fieldErrors.description)}
              disabled={isSubmitting}
            />
          </Field>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? 'Integrating…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="modal-field">
      <label>{label}</label>
      {children}
      {error ? <span className="modal-field-error" role="alert">{error}</span> : null}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

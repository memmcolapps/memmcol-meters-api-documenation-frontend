import { useRef, useState } from 'react'
import { useDismiss } from './useDismiss'
import type { SupportedMeter } from './adminMeters'

export type MeterFormValues = Pick<
  SupportedMeter,
  'manufacturer' | 'category' | 'meterClass' | 'model'
>

const meterCategories = ['Prepaid', 'Post-paid']
const meterClasses = ['MD', 'Single-Phase', 'Three-Phase']

export function MeterFormModal({
  title,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  initial?: MeterFormValues
  onClose: () => void
  onSubmit: (values: MeterFormValues) => void
}) {
  const [form, setForm] = useState({
    manufacturer: initial?.manufacturer ?? '',
    category: initial?.category ?? '',
    meterClass: initial?.meterClass ?? '',
    model: initial?.model ?? '',
    protocol: '',
    authentication: '',
    password: '',
  })
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const canSubmit =
    form.manufacturer && form.category && form.meterClass && form.model

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      manufacturer: form.manufacturer,
      category: form.category,
      meterClass: form.meterClass,
      model: form.model,
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
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <Field label="Meter Manufacturer">
            <input
              className="modal-input"
              placeholder="Enter Manufacturer"
              value={form.manufacturer}
              onChange={(e) => set('manufacturer', e.target.value)}
            />
          </Field>

          <div className="modal-grid">
            <Field label="Meter Category">
              <select
                className="modal-select"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
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
            <Field label="Meter Class">
              <select
                className="modal-select"
                value={form.meterClass}
                onChange={(e) => set('meterClass', e.target.value)}
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

          <Field label="Meter Model">
            <input
              className="modal-input"
              placeholder="Enter Model"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
            />
          </Field>

          <div className="modal-grid">
            <Field label="Protocol">
              <input
                className="modal-input"
                placeholder="Enter Protocol"
                value={form.protocol}
                onChange={(e) => set('protocol', e.target.value)}
              />
            </Field>
            <Field label="Authentication">
              <input
                className="modal-input"
                placeholder="Enter Authentication"
                value={form.authentication}
                onChange={(e) => set('authentication', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Password">
            <input
              className="modal-input"
              type="password"
              placeholder="Enter Password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="modal-field">
      <label>{label}</label>
      {children}
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

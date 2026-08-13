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
> & { serialNumber: string; multiplier: string; description: string }

export type MeterFormField = keyof MeterFormValues

const meterCategories = ['Prepaid', 'Post-paid']
const meterClasses = ['MD', 'Single-Phase', 'Three-Phase']
const meterProtocols = ['DLMS/COSEM']
const meterAuthenticationTypes = ['HLS', 'LLS']

export type LlsSecurityField = 'clientId' | 'destinationAddress' | 'password'

export type LlsSecurityValues = Record<LlsSecurityField, string>

export type HlsSecurityField =
  | 'securityPolicy'
  | 'authMechanism'
  | 'encryptionKey'
  | 'masterKey'
  | 'globalBroadcastEncryptionKey'
  | 'clientId'
  | 'destinationAddress'

export type HlsSecurityValues = Record<HlsSecurityField, string>

export function MeterFormModal({
  title,
  submitLabel,
  submittingLabel = 'Integrating…',
  initial,
  isSubmitting = false,
  showSerialNumber = false,
  showDescription = false,
  fieldErrors = {},
  onFieldChange,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  submittingLabel?: string
  initial?: Partial<MeterFormValues>
  isSubmitting?: boolean
  showSerialNumber?: boolean
  showDescription?: boolean
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
    serialNumber: initial?.serialNumber ?? '',
    multiplier: initial?.multiplier ?? '',
    protocol: initial?.protocol ?? '',
    authenticationType: initial?.authenticationType ?? '',
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
    form.multiplier.trim() &&
    form.protocol.trim() &&
    form.authenticationType.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      manufacturer: form.manufacturer.trim(),
      category: form.category,
      meterClass: form.meterClass,
      model: form.model.trim(),
      serialNumber: form.serialNumber.trim(),
      multiplier: form.multiplier.trim(),
      protocol: form.protocol.trim(),
      authenticationType: form.authenticationType.trim(),
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

          {showSerialNumber ? (
            <div className="modal-grid">
              <Field
                label="Meter Serial No"
                error={fieldErrors.serialNumber}
                className="modal-field-wide"
              >
                <input
                  className="modal-input"
                  placeholder="Enter Serial No"
                  value={form.serialNumber}
                  onChange={(e) => set('serialNumber', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.serialNumber)}
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          ) : null}

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
            <Field
              label="Multiplier"
              error={fieldErrors.multiplier}
              className="modal-field-wide"
            >
              <input
                className="modal-input"
                placeholder="Enter Multiplier"
                value={form.multiplier}
                onChange={(e) => set('multiplier', e.target.value)}
                aria-invalid={Boolean(fieldErrors.multiplier)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="modal-grid">
            <Field label="Protocol" error={fieldErrors.protocol}>
              <select
                className="modal-select"
                value={form.protocol}
                onChange={(e) => set('protocol', e.target.value)}
                aria-invalid={Boolean(fieldErrors.protocol)}
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select Protocol
                </option>
                {meterProtocols.map((protocol) => (
                  <option key={protocol} value={protocol}>
                    {protocol}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Authentication" error={fieldErrors.authenticationType}>
              <select
                className="modal-select"
                value={form.authenticationType}
                onChange={(e) => set('authenticationType', e.target.value)}
                aria-invalid={Boolean(fieldErrors.authenticationType)}
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select Authentication
                </option>
                {meterAuthenticationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {showDescription ? (
            <Field label="Description" error={fieldErrors.description} className="modal-field-wide">
              <textarea
                className="modal-input"
                rows={3}
                placeholder="Enter a description for this meter"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                disabled={isSubmitting}
              />
            </Field>
          ) : null}

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`modal-field${className ? ` ${className}` : ''}`}>
      <label>{label} {required ? <span className="req">*</span> : null}</label>
      {children}
      {error ? <span className="modal-field-error" role="alert">{error}</span> : null}
    </div>
  )
}

function SecurityDialogFoot({
  isSubmitting,
  submittingLabel,
  canSubmit,
  onBack,
  onSubmit,
}: {
  isSubmitting: boolean
  submittingLabel: string
  canSubmit: boolean
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="modal-foot">
      <button type="button" className="btn-neutral" onClick={onBack} disabled={isSubmitting}>
        Back
      </button>
      <button
        type="button"
        className="btn-primary"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? 'Integrating…' : submittingLabel}
      </button>
    </div>
  )
}

export function LlsSecurityDialog({
  isSubmitting = false,
  submittingLabel = 'Integrate',
  title = 'Integrate Meter',
  subtitle = 'LLS Information',
  initial,
  fieldErrors = {},
  onFieldChange,
  onBack,
  onClose,
  onSubmit,
}: {
  isSubmitting?: boolean
  submittingLabel?: string
  title?: string
  subtitle?: string
  initial?: Partial<LlsSecurityValues>
  fieldErrors?: Partial<Record<LlsSecurityField, string>>
  onFieldChange?: (field: LlsSecurityField) => void
  onBack: () => void
  onClose: () => void
  onSubmit: (values: LlsSecurityValues) => void
}) {
  const [form, setForm] = useState<LlsSecurityValues>({
    clientId: initial?.clientId ?? '',
    destinationAddress: initial?.destinationAddress ?? '',
    password: initial?.password ?? '',
  })
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: LlsSecurityField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    onFieldChange?.(key)
  }

  const canSubmit = Boolean(
    form.clientId.trim() &&
    form.destinationAddress.trim() &&
    form.password.trim(),
  )

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      clientId: form.clientId.trim(),
      destinationAddress: form.destinationAddress.trim(),
      password: form.password,
    })
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lls-security-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="lls-security-title" className="modal-title">
              {title}
            </h2>
            <p className="modal-subtitle">{subtitle}</p>
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
          <Field label="Client ID" error={fieldErrors.clientId}>
            <input
              className="modal-input"
              placeholder="Enter Client ID"
              value={form.clientId}
              onChange={(e) => set('clientId', e.target.value)}
              aria-invalid={Boolean(fieldErrors.clientId)}
              disabled={isSubmitting}
            />
          </Field>
          <Field label="Destination Address" error={fieldErrors.destinationAddress}>
            <input
              className="modal-input"
              placeholder="Enter Destination Address"
              value={form.destinationAddress}
              onChange={(e) => set('destinationAddress', e.target.value)}
              aria-invalid={Boolean(fieldErrors.destinationAddress)}
              disabled={isSubmitting}
            />
          </Field>
          <Field label="Password"  error={fieldErrors.password}>
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
          <SecurityDialogFoot
            isSubmitting={isSubmitting}
            submittingLabel={submittingLabel}
            canSubmit={canSubmit}
            onBack={onBack}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

export function HlsSecurityDialog({
  isSubmitting = false,
  submittingLabel = 'Integrate',
  title = 'Integrate Meter',
  subtitle = 'HLS Information',
  initial,
  fieldErrors = {},
  onFieldChange,
  onBack,
  onClose,
  onSubmit,
}: {
  isSubmitting?: boolean
  submittingLabel?: string
  title?: string
  subtitle?: string
  initial?: Partial<HlsSecurityValues>
  fieldErrors?: Partial<Record<HlsSecurityField, string>>
  onFieldChange?: (field: HlsSecurityField) => void
  onBack: () => void
  onClose: () => void
  onSubmit: (values: HlsSecurityValues) => void
}) {
  const [form, setForm] = useState<HlsSecurityValues>({
    securityPolicy: initial?.securityPolicy ?? '',
    authMechanism: initial?.authMechanism ?? '',
    encryptionKey: initial?.encryptionKey ?? '',
    masterKey: initial?.masterKey ?? '',
    globalBroadcastEncryptionKey: initial?.globalBroadcastEncryptionKey ?? '',
    clientId: initial?.clientId ?? '',
    destinationAddress: initial?.destinationAddress ?? '',
  })
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: HlsSecurityField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    onFieldChange?.(key)
  }

  const canSubmit = Boolean(
    form.securityPolicy.trim() &&
    form.authMechanism.trim() &&
    form.encryptionKey.trim() &&
    form.masterKey.trim() &&
    form.globalBroadcastEncryptionKey.trim() &&
    form.clientId.trim() &&
    form.destinationAddress.trim(),
  )

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      securityPolicy: form.securityPolicy,
      authMechanism: form.authMechanism,
      encryptionKey: form.encryptionKey.trim(),
      masterKey: form.masterKey.trim(),
      globalBroadcastEncryptionKey: form.globalBroadcastEncryptionKey.trim(),
      clientId: form.clientId.trim(),
      destinationAddress: form.destinationAddress.trim(),
    })
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="hls-security-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="hls-security-title" className="modal-title">
              {title}
            </h2>
            <p className="modal-subtitle">{subtitle}</p>
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
          <div className="modal-grid">
            <Field
              label="Security Policy"
              error={fieldErrors.securityPolicy}
              className="modal-field-wide"
            >
              <input
                className="modal-input"
                placeholder="Enter Security Policy"
                value={form.securityPolicy}
                onChange={(e) => set('securityPolicy', e.target.value)}
                aria-invalid={Boolean(fieldErrors.securityPolicy)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="modal-grid">
            <Field
              label="Auth Mechanism"
              error={fieldErrors.authMechanism}
              className="modal-field-wide"
            >
              <input
                className="modal-input"
                placeholder="Enter Auth Mechanism"
                value={form.authMechanism}
                onChange={(e) => set('authMechanism', e.target.value)}
                aria-invalid={Boolean(fieldErrors.authMechanism)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="modal-grid">
            <Field label="Encryption Key" error={fieldErrors.encryptionKey}>
              <input
                className="modal-input"
                placeholder="Enter Encryption Key"
                value={form.encryptionKey}
                onChange={(e) => set('encryptionKey', e.target.value)}
                aria-invalid={Boolean(fieldErrors.encryptionKey)}
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Master Key" error={fieldErrors.masterKey}>
              <input
                className="modal-input"
                placeholder="Enter Master Key"
                value={form.masterKey}
                onChange={(e) => set('masterKey', e.target.value)}
                aria-invalid={Boolean(fieldErrors.masterKey)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="modal-grid">
            <Field
              label="Global Broadcast Encryption Key"
              error={fieldErrors.globalBroadcastEncryptionKey}
              className="modal-field-wide"
            >
              <input
                className="modal-input"
                placeholder="Enter Global Broadcast Encryption Key"
                value={form.globalBroadcastEncryptionKey}
                onChange={(e) => set('globalBroadcastEncryptionKey', e.target.value)}
                aria-invalid={Boolean(fieldErrors.globalBroadcastEncryptionKey)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="modal-grid">
            <Field label="Client ID" error={fieldErrors.clientId}>
              <input
                className="modal-input"
                placeholder="Enter Client ID"
                value={form.clientId}
                onChange={(e) => set('clientId', e.target.value)}
                aria-invalid={Boolean(fieldErrors.clientId)}
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Destination Address" error={fieldErrors.destinationAddress}>
              <input
                className="modal-input"
                placeholder="Enter Destination Address"
                value={form.destinationAddress}
                onChange={(e) => set('destinationAddress', e.target.value)}
                aria-invalid={Boolean(fieldErrors.destinationAddress)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <SecurityDialogFoot
            isSubmitting={isSubmitting}
            submittingLabel={submittingLabel}
            canSubmit={canSubmit}
            onBack={onBack}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
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

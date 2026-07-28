import { useRef, useState } from 'react'
import { useDismiss } from './useDismiss'

export type AdminResetPasswordField = 'resetToken' | 'password'

export function AdminResetPasswordModal({
  resetToken,
  isSubmitting = false,
  fieldErrors = {},
  onFieldChange,
  onClose,
  onSubmit,
}: {
  resetToken: string
  isSubmitting?: boolean
  fieldErrors?: Partial<Record<AdminResetPasswordField, string>>
  onFieldChange?: (field: AdminResetPasswordField) => void
  onClose: () => void
  onSubmit: (resetToken: string, password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const canSubmit = resetToken.trim() !== '' && password.trim() !== '' && !isSubmitting

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-reset-password-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="admin-reset-password-title" className="modal-title">
            Reset Password
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose} disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Reset Token <span className="req">*</span></label>
            <input
              className="modal-input"
              type="text"
              value={resetToken}
              readOnly
              aria-readonly="true"
            />
            {fieldErrors.resetToken ? (
              <span className="modal-field-error" role="alert">
                {fieldErrors.resetToken}
              </span>
            ) : null}
          </div>

          <div className="modal-field">
            <label>
              New Password <span className="req">*</span>
            </label>
            <div className="auth-input-group">
              <input
                className="modal-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  onFieldChange?.('password')
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="auth-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.password ? (
              <span className="modal-field-error" role="alert">
                {fieldErrors.password}
              </span>
            ) : null}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit}
              onClick={() => canSubmit && onSubmit(resetToken, password)}
            >
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
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

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

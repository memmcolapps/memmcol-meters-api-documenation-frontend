import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { PASSWORD_REQUIREMENTS } from '../features/auth/schemas'

export type AdminResetPasswordField = 'resetToken' | 'password'

export function AdminResetPasswordModal({
  resetToken,
  isSubmitting = false,
  fieldErrors = {},
  onFieldChange,
  onSubmit,
}: {
  resetToken: string
  isSubmitting?: boolean
  fieldErrors?: Partial<Record<AdminResetPasswordField, string>>
  onFieldChange?: (field: AdminResetPasswordField) => void
  onSubmit: (resetToken: string, password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = resetToken.trim() !== '' && password.trim() !== '' && !isSubmitting

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canSubmit) onSubmit(resetToken, password)
  }

  return (
    <section className="auth-card" aria-labelledby="admin-reset-password-title">
      <h1 id="admin-reset-password-title" className="auth-title">
        Reset Password
      </h1>
      <p className="auth-subtitle">
        Enter your new password below to complete the reset.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="adminPassword">
            New Password <span className="req">*</span>
          </label>
          <div className={`auth-input-group${fieldErrors.password ? ' is-invalid' : ''}`}>
            <input
              id="adminPassword"
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
          <p id="admin-password-requirements" className="auth-field-hint">
            {PASSWORD_REQUIREMENTS}
          </p>
          {fieldErrors.password ? (
            <span className="modal-field-error" role="alert">
              {fieldErrors.password}
            </span>
          ) : null}
        </div>

        <button type="submit" className="auth-submit" disabled={!canSubmit}>
          {isSubmitting ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>

      <p className="auth-back">
        <Link to="/admin/login" className="auth-back-link">
          <BackIcon /> Back to login
        </Link>
      </p>
    </section>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
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

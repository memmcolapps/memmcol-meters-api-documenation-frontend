import { useState, type FormEvent } from 'react'
import { Link, createFileRoute, useSearch } from '@tanstack/react-router'
import { Logo } from '../../../app/Logo'
import { useToast } from '../../../app/toastContext'
import {
  getSchemaFieldErrors,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  summarizeFieldErrors,
} from '../../../features/auth/schemas'
import { useCompleteAdminInvite } from '../../../features/admin-users/adminInvitationQueries'
import { getApiErrorMessage } from '../../../lib/api/client'
import { z } from 'zod'

const adminInviteSearchSchema = z.object({
  token: z.string(),
})

export const Route = createFileRoute('/admin/invitation/setup')({
  component: AdminInvitationSetupPage,
  validateSearch: adminInviteSearchSchema,
})

const adminInviteSetupSchema = z.object({
  password: z.string().superRefine((password, context) => {
    if (!password.trim()) {
      context.addIssue({ code: 'custom', message: 'Password is required' })
      return
    }
    const meetsSecurityRules =
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9\s]/.test(password)
    if (!meetsSecurityRules) {
      context.addIssue({ code: 'custom', message: PASSWORD_REQUIREMENTS })
    }
  }),
})

type AdminInviteSetupField = 'password'

function AdminInvitationSetupPage() {
  const { token } = useSearch({ from: Route.fullPath })
  const { showToast } = useToast()
  const completeInvite = useCompleteAdminInvite()

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AdminInviteSetupField, string>>>({})
  const [showPassword, setShowPassword] = useState(false)

  const clearFieldError = (field: AdminInviteSetupField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})

    const data = new FormData(event.currentTarget)
    const result = adminInviteSetupSchema.safeParse({
      password: String(data.get('password') ?? ''),
    })

    if (!result.success) {
      const errors = getSchemaFieldErrors<AdminInviteSetupField>(result.error)
      setFieldErrors(errors)
      showToast({
        title: 'Review the highlighted fields',
        message: summarizeFieldErrors(errors),
        variant: 'error',
      })
      return
    }

    try {
      await completeInvite.mutateAsync({
        inviteToken: token,
        password: result.data.password,
      })
      showToast({
        title: 'Account activated',
        message: 'Your admin account has been set up successfully. You can now sign in.',
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'Setup failed',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const errorFor = (field: AdminInviteSetupField) => fieldErrors[field]

  if (!token) {
    return (
      <div className="auth-wrap">
        <header className="auth-head">
          <Logo className="auth-brand-logo" />
          <p className="auth-tagline">We Make Meter Communication seamless</p>
        </header>
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title" className="auth-title">Invalid Link</h1>
          <p className="auth-subtitle">
            This invitation link is missing a valid token. Please check your email and try again.
          </p>
          <p className="auth-back">
            <Link to="/admin/login" className="auth-back-link"><BackIcon /> Back to login</Link>
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <header className="auth-head">
        <Logo className="auth-brand-logo" />
        <p className="auth-tagline">We Make Meter Communication seamless</p>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="auth-title">Set Up Your Admin Account</h1>
        <p className="auth-subtitle">
          You&rsquo;ve been invited to join as an administrator. Set your password below to activate your account.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="inviteToken">Invite Token</label>
            <input
              id="inviteToken"
              type="text"
              className="auth-input"
              value={token}
              readOnly
              aria-readonly="true"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="adminPassword">Password</label>
            <div className={`auth-input-group${errorFor('password') ? ' is-invalid' : ''}`}>
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Enter your password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                aria-invalid={Boolean(errorFor('password'))}
                aria-describedby="admin-password-requirements"
                onChange={() => clearFieldError('password')}
              />
              <button
                type="button"
                className="auth-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            <p id="admin-password-requirements" className="auth-field-hint">
              {PASSWORD_REQUIREMENTS}
            </p>
          </div>

          <button type="submit" className="auth-submit" disabled={completeInvite.isPending}>
            {completeInvite.isPending ? 'Activating account…' : 'Activate Account'}
          </button>
        </form>

        <p className="auth-back">
          <Link to="/admin/login" className="auth-back-link"><BackIcon /> Back to login</Link>
        </p>
      </section>
    </div>
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

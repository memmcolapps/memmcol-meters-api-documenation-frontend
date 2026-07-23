import { useEffect, useState, type FormEvent } from 'react'
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Logo } from '../../app/Logo'
import { useToast } from '../../app/toastContext'
import {
  getSchemaFieldErrors,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  summarizeFieldErrors,
} from '../../features/auth/schemas'
import {
  useVerifyInvitation,
  useAcceptInvitation,
  type VerifyInvitationResponse,
} from '../../features/organisation/invitationQueries'
import { getApiErrorMessage } from '../../lib/api/client'
import { z } from 'zod'

const invitationSearchSchema = z.object({
  token: z.string(),
})

export const Route = createFileRoute('/api/invitation/setup')({
  component: InvitationSetupPage,
  validateSearch: invitationSearchSchema,
})

const invitationSetupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
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
  confirmPassword: z.string().refine(
    (password) => Boolean(password.trim()),
    'Please confirm your password',
  ),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    })
  }
})

type InvitationSetupField = 'firstName' | 'lastName' | 'password' | 'confirmPassword'

function InvitationSetupPage() {
  const { token } = useSearch({ from: Route.fullPath })
  const navigate = useNavigate()
  const { showToast } = useToast()
  const verifyInvitation = useVerifyInvitation()
  const acceptInvitation = useAcceptInvitation()

  const [invitationData, setInvitationData] = useState<VerifyInvitationResponse | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<InvitationSetupField, string>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!token) return
    verifyInvitation.mutate(token, {
      onSuccess: (data) => setInvitationData(data),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const clearFieldError = (field: InvitationSetupField) => {
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
    const result = invitationSetupSchema.safeParse({
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      password: String(data.get('password') ?? ''),
      confirmPassword: String(data.get('confirmPassword') ?? ''),
    })

    if (!result.success) {
      const errors = getSchemaFieldErrors<InvitationSetupField>(result.error)
      setFieldErrors(errors)
      showToast({
        title: 'Review the highlighted fields',
        message: summarizeFieldErrors(errors),
        variant: 'error',
      })
      return
    }

    if (!invitationData) return

    try {
      await acceptInvitation.mutateAsync({
        email: invitationData.email,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        password: result.data.password,
      })
      showToast({
        title: 'Account created',
        message: 'Your account has been set up successfully. You can now sign in.',
        variant: 'success',
      })
      await navigate({ to: '/login' })
    } catch (error) {
      showToast({
        title: 'Setup failed',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const errorFor = (field: InvitationSetupField) => fieldErrors[field]

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
            <Link to="/login" className="auth-back-link"><BackIcon /> Back to login</Link>
          </p>
        </section>
      </div>
    )
  }

  if (verifyInvitation.isPending) {
    return (
      <div className="auth-wrap">
        <header className="auth-head">
          <Logo className="auth-brand-logo" />
          <p className="auth-tagline">We Make Meter Communication seamless</p>
        </header>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="async-state" role="status" aria-live="polite">
            <span className="async-spinner" aria-hidden="true" />
            <p>Verifying your invitation…</p>
          </div>
        </section>
      </div>
    )
  }

  if (verifyInvitation.isError || !invitationData) {
    return (
      <div className="auth-wrap">
        <header className="auth-head">
          <Logo className="auth-brand-logo" />
          <p className="auth-tagline">We Make Meter Communication seamless</p>
        </header>
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title" className="auth-title">Invalid or Expired Invitation</h1>
          <p className="auth-subtitle">
            {verifyInvitation.isError
              ? getApiErrorMessage(verifyInvitation.error)
              : 'This invitation link is invalid or has expired. Please request a new one.'}
          </p>
          <p className="auth-back">
            <Link to="/login" className="auth-back-link"><BackIcon /> Back to login</Link>
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
        <h1 id="auth-title" className="auth-title">Set Up Your Account</h1>
        <p className="auth-subtitle">
          You&rsquo;ve been invited to join <strong>{invitationData.organisationName}</strong> as a {invitationData.role.toLowerCase()}.
          Complete your details below.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="invitationEmail">Email Address</label>
            <input
              id="invitationEmail"
              type="email"
              className="auth-input"
              value={invitationData.email}
              readOnly
              autoComplete="email"
              aria-readonly="true"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              autoComplete="given-name"
              placeholder="Enter first name"
              required
              aria-invalid={Boolean(errorFor('firstName'))}
              onChange={() => clearFieldError('firstName')}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder="Enter last name"
              required
              aria-invalid={Boolean(errorFor('lastName'))}
              onChange={() => clearFieldError('lastName')}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="setupPassword">Password</label>
            <div className={`auth-input-group${errorFor('password') ? ' is-invalid' : ''}`}>
              <input
                id="setupPassword"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Enter your password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                aria-invalid={Boolean(errorFor('password'))}
                aria-describedby="password-requirements"
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
            <p id="password-requirements" className="auth-field-hint">
              {PASSWORD_REQUIREMENTS}
            </p>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`auth-input-group${errorFor('confirmPassword') ? ' is-invalid' : ''}`}>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm password"
                required
                aria-invalid={Boolean(errorFor('confirmPassword'))}
                onChange={() => clearFieldError('confirmPassword')}
              />
              <button
                type="button"
                className="auth-toggle"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirm}
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={acceptInvitation.isPending}>
            {acceptInvitation.isPending ? 'Setting up account…' : 'Complete Setup'}
          </button>
        </form>

        <p className="auth-back">
          <Link to="/login" className="auth-back-link"><BackIcon /> Back to login</Link>
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

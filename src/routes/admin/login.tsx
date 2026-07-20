import { useState, type FormEvent } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Logo } from '../../app/Logo'
import { useToast } from '../../app/toastContext'
import { getAuthError } from '../../features/auth/errors'
import {
  useAdminLogin,
  type AdminLoginInput,
} from '../../features/auth/adminLogin'
import {
  getSchemaFieldErrors,
  loginSchema,
  summarizeFieldErrors,
} from '../../features/auth/schemas'

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AdminLoginInput, string>>
  >({})
  const login = useAdminLogin()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const clearFieldError = (field: keyof AdminLoginInput) => {
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
    const result = loginSchema.safeParse({
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    })

    if (!result.success) {
      const errors = getSchemaFieldErrors<keyof AdminLoginInput>(result.error)
      setFieldErrors(errors)
      showToast({
        title: 'Review the highlighted fields',
        message: summarizeFieldErrors(errors),
        variant: 'error',
      })
      return
    }

    try {
      await login.mutateAsync(result.data)
      await navigate({ to: '/admin/dashboard' })
    } catch (error) {
      const authError = getAuthError(error)
      setFieldErrors(authError.fields)
      showToast({
        title: authError.message,
        message: summarizeFieldErrors(authError.fields),
        variant: 'error',
      })
    }
  }

  return (
    <div className="auth-wrap admin">
      <header className="auth-head">
        <Logo className="auth-brand-logo" />
        <p className="auth-tagline">Admin Portal</p>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="auth-title">
          Sign In
        </h1>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              onChange={() => clearFieldError('email')}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className={`auth-input-group${fieldErrors.password ? ' is-invalid' : ''}`}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                aria-invalid={Boolean(fieldErrors.password)}
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
          </div>

          <Link to="/admin/forgot-password" className="auth-forgot">
            Forgot Password?
          </Link>

          <button type="submit" className="auth-submit auth-cta" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </section>
    </div>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

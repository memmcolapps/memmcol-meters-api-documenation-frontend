import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Logo } from '../../app/Logo'
import { useToast } from '../../app/toastContext'
import { getApiErrorMessage } from '../../lib/api/client'
import { useAdminForgotPassword } from '../../features/auth/adminPasswordReset'

export const Route = createFileRoute('/admin/forgot-password')({
  component: AdminForgotPasswordPage,
})

type Step = 'email' | 'success'

function AdminForgotPasswordPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const forgotPassword = useAdminForgotPassword()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')

  return (
    <div className="auth-wrap admin">
      <header className="auth-head">
        <Logo className="auth-brand-logo" />
        <p className="auth-tagline">Admin Portal</p>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        {step === 'email' ? (
          <>
            <h1 id="auth-title" className="auth-title">
              Reset Password
            </h1>
            <form
              className="auth-form"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!email) return
                try {
                  await forgotPassword.mutateAsync({ email })
                  showToast({
                    title: 'Email sent',
                    message: 'If this email exists, reset instructions have been sent.',
                    variant: 'success',
                  })
                  setStep('success')
                } catch (error) {
                  showToast({
                    title: 'Request failed',
                    message: getApiErrorMessage(error),
                    variant: 'error',
                  })
                }
              }}
            >
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button type="submit" className="auth-submit auth-cta" disabled={!email || forgotPassword.isPending}>
                {forgotPassword.isPending ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : null}

        {step === 'success' ? (
          <>
            <h1 id="auth-title" className="auth-title">
              Check Your Email
            </h1>
            <p className="auth-subtitle">
              If an account exists with <strong>{email}</strong>, you will receive
              a password reset link shortly.
            </p>
            <button
              type="button"
              className="auth-submit auth-cta"
              onClick={() => navigate({ to: '/admin/login' })}
            >
              Back to Login
            </button>
          </>
        ) : null}

        {step !== 'success' ? (
          <p className="auth-back">
            <Link to="/admin/login" className="auth-back-link">
              <BackIcon /> Back to login
            </Link>
          </p>
        ) : null}
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

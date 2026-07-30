import { useState } from 'react'
import { Link, createFileRoute, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { Logo } from '../../app/Logo'
import { AdminResetPasswordModal, type AdminResetPasswordField } from '../../app/AdminResetPasswordModal'
import { useToast } from '../../app/toastContext'
import {
  getSchemaFieldErrors,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  summarizeFieldErrors,
} from '../../features/auth/schemas'
import {
  useAdminResetPassword,
  getAdminResetPasswordError,
} from '../../features/auth/adminPasswordReset'

const resetPasswordSearchSchema = z.object({
  token: z.string(),
})

export const Route = createFileRoute('/admin/reset-password')({
  component: AdminResetPasswordPage,
  validateSearch: resetPasswordSearchSchema,
})

const passwordFieldSchema = z.string().superRefine((password, context) => {
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
})

function AdminResetPasswordPage() {
  const { token } = useSearch({ from: Route.fullPath })
  const { showToast } = useToast()
  const resetPassword = useAdminResetPassword()
  const [modalOpen, setModalOpen] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AdminResetPasswordField, string>>>({})

  const clearFieldError = (field: AdminResetPasswordField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleReset = async (resetToken: string, password: string) => {
    setFieldErrors({})
    const result = passwordFieldSchema.safeParse(password)

    if (!result.success) {
      const errors = getSchemaFieldErrors<'password'>(result.error)
      setFieldErrors(errors)
      showToast({
        title: 'Review the highlighted fields',
        message: summarizeFieldErrors(errors),
        variant: 'error',
      })
      return
    }

    try {
      await resetPassword.mutateAsync({ resetToken, password: result.data })
      showToast({
        title: 'Password reset',
        message: 'Your password has been reset successfully.',
        variant: 'success',
      })
      setModalOpen(false)
    } catch (error) {
      const apiError = getAdminResetPasswordError(error)
      setFieldErrors(apiError.fields as Partial<Record<AdminResetPasswordField, string>>)
      showToast({
        title: apiError.message,
        message: [
          Object.values(apiError.fields).join(' '),
          apiError.requestId ? `Request ID: ${apiError.requestId}` : '',
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  if (!token) {
    return (
      <div className="auth-wrap admin">
        <header className="auth-head">
          <Logo className="auth-brand-logo" />
          <p className="auth-tagline">Admin Portal</p>
        </header>
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title" className="auth-title">
            Invalid Link
          </h1>
          <p className="auth-subtitle">
            This password reset link is missing a valid token. Please check your email and try
            again.
          </p>
          <p className="auth-back">
            <Link to="/admin/login" className="auth-back-link">
              <BackIcon /> Back to login
            </Link>
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="auth-wrap admin">
      <header className="auth-head">
        <Logo className="auth-brand-logo" />
        <p className="auth-tagline">Admin Portal</p>
      </header>

      {!modalOpen ? (
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title" className="auth-title">
            Reset Password
          </h1>
          <p className="auth-subtitle">Your password has been reset successfully.</p>

          <p className="auth-back">
            <Link to="/admin/login" className="auth-back-link">
              <BackIcon /> Back to login
            </Link>
          </p>
        </section>
      ) : null}

      {modalOpen ? (
        <AdminResetPasswordModal
          resetToken={token}
          isSubmitting={resetPassword.isPending}
          fieldErrors={fieldErrors}
          onFieldChange={clearFieldError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleReset}
        />
      ) : null}
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

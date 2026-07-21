import { useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Logo } from '../app/Logo'
import { useToast } from '../app/toastContext'
import { getApiErrorMessage } from '../lib/api/client'
import {
  useRequestPasswordOtp,
  useVerifyPasswordOtp,
  useResetPassword,
  useResendPasswordOtp,
} from '../features/auth/passwordReset'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

type Step = 'email' | 'otp' | 'password'

const OTP_LENGTH = 6

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const requestOtp = useRequestPasswordOtp()
  const verifyOtp = useVerifyPasswordOtp()
  const resetPwd = useResetPassword()
  const resendOtp = useResendPasswordOtp()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const otpComplete = otp.every((digit) => digit !== '')

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await requestOtp.mutateAsync({ email })
      setStep('otp')
    } catch (error) {
      showToast({
        title: 'Request failed',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const result = await verifyOtp.mutateAsync({ email, otp: otp.join('') })
      setResetToken(result.resetToken)
      setStep('password')
    } catch (error) {
      showToast({
        title: 'Verification failed',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const handleResendOtp = async () => {
    try {
      await resendOtp.mutateAsync({ email })
      setOtp(Array(OTP_LENGTH).fill(''))
      otpRefs.current[0]?.focus()
      showToast({
        title: 'Code resent',
        message: 'A new verification code has been sent.',
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'Resend failed',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await resetPwd.mutateAsync({ resetToken, password })
      showToast({
        title: 'Password reset',
        message: 'Your password has been reset successfully.',
        variant: 'success',
      })
      await navigate({ to: '/login' })
    } catch (error) {
      showToast({
        title: 'Reset failed',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="auth-wrap">
      <header className="auth-head">
        <Logo className="auth-brand-logo" />
        <p className="auth-tagline">We Make Meter Communication seamless</p>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        {step === 'email' ? (
          <>
            <h1 id="auth-title" className="auth-title">
              Reset Password
            </h1>
            <form className="auth-form" onSubmit={handleRequestOtp}>
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
              <button type="submit" className="auth-submit auth-cta" disabled={!email || requestOtp.isPending}>
                {requestOtp.isPending ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          </>
        ) : null}

        {step === 'otp' ? (
          <>
            <h1 id="auth-title" className="auth-title">
              Enter Verification Code
            </h1>
            <p className="auth-subtitle">We sent an OTP code to {email}</p>
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="otp-group">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el
                    }}
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Digit ${index + 1}`}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  />
                ))}
              </div>
              <button type="submit" className="auth-submit auth-cta" disabled={!otpComplete || verifyOtp.isPending}>
                {verifyOtp.isPending ? 'Verifying…' : 'Reset Password'}
              </button>
            </form>
            <p className="auth-resend">
              Did&rsquo;nt receive the email?{' '}
              <button
                type="button"
                className="auth-link-btn"
                disabled={resendOtp.isPending}
                onClick={handleResendOtp}
              >
                {resendOtp.isPending ? 'Resending…' : 'Click here to resend'}
              </button>
            </p>
          </>
        ) : null}

        {step === 'password' ? (
          <>
            <h1 id="auth-title" className="auth-title">
              Reset Password
            </h1>
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-input-group">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirm">Confirm Password</label>
                <div className="auth-input-group">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirm((value) => !value)}
                  >
                    {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit auth-cta"
                disabled={!password || password !== confirm || resetPwd.isPending}
              >
                {resetPwd.isPending ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : null}

        <p className="auth-back">
          <Link to="/login" className="auth-back-link">
            <BackIcon /> Back to login
          </Link>
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

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useToast } from '../../../app/toastContext'
import { useDismiss } from '../../../app/useDismiss'
import {
  profileKeys,
  useChangePassword,
  useCurrentProfile,
  useUpdateProfile,
  type CurrentProfile,
} from '../../../features/profile/profileQueries'
import {
  changePasswordSchema,
  getSchemaFieldErrors,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  summarizeFieldErrors,
  type ChangePasswordField,
} from '../../../features/auth/schemas'
import { getApiErrorMessage } from '../../../lib/api/client'

export const Route = createFileRoute('/_app/settings/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const profileQuery = useCurrentProfile()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const notifiedError = useRef<unknown>(null)
  const profile = profileQuery.data

  useEffect(() => {
    if (!profileQuery.error || notifiedError.current === profileQuery.error) return
    notifiedError.current = profileQuery.error
    showToast({
      title: 'Could not load your profile',
      message: getApiErrorMessage(profileQuery.error),
      variant: 'error',
    })
  }, [profileQuery.error, showToast])

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : ''

  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Profile</h1>
        <p className="dash-subtitle">
          Update your profile details and manage your account settings.
        </p>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Profile
        </button>
      </div>

      {profileQuery.isPending ? (
        <div className="async-state" role="status" aria-live="polite">
          <span className="async-spinner" aria-hidden="true" />
          <p>Loading profile…</p>
        </div>
      ) : profileQuery.error ? (
        <div className="async-state">
          <button type="button" className="btn-neutral" onClick={() => profileQuery.refetch()}>
            Try again
          </button>
        </div>
      ) : profile ? (
        <>
          <div className="profile-top">
            <div>
              <span className="profile-avatar" aria-hidden="true">
                {profile.firstName.charAt(0).toUpperCase()}
              </span>
              <p className="profile-role">{profile.role}</p>
            </div>
            <div className="profile-actions">
              <button type="button" className="btn-primary" onClick={() => setEditOpen(true)}>
                Edit
              </button>
              <button type="button" className="btn-danger" onClick={() => setResetOpen(true)}>
                Change Password
              </button>
            </div>
          </div>

          <section className="profile-section">
            <h2 className="profile-section-title">Name</h2>
            <div className="profile-field">
              <p className="profile-help">This is the name associated with your account</p>
              <input className="profile-input" value={fullName} readOnly />
            </div>
            <div className="profile-field">
              <p className="profile-help">
                This is the phone number associated with your account
              </p>
              <input className="profile-input" value={`${profile.dialCode} ${profile.phone}`} readOnly />
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Email Address</h2>
            <div className="profile-field">
              <p className="profile-help">This is the email associated with your account</p>
              <input className="profile-input" value={profile.email} disabled />
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Business Name</h2>
            <div className="profile-field">
              <p className="profile-help">
                This is the business name associated with your account
              </p>
              <input className="profile-input" value={profile.businessName} readOnly />
            </div>
          </section>

          {editOpen ? (
            <EditProfileModal
              profile={profile}
              onClose={() => setEditOpen(false)}
              onSave={(next) => {
                queryClient.setQueryData(profileKeys.current(), next)
                setEditOpen(false)
              }}
            />
          ) : null}

          {resetOpen ? <ResetPasswordModal onClose={() => setResetOpen(false)} /> : null}
        </>
      ) : null}
    </div>
  )
}

function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CurrentProfile
  onClose: () => void
  onSave: (profile: CurrentProfile) => void
}) {
  const [draft, setDraft] = useState(profile)
  const modalRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const updateProfile = useUpdateProfile()
  const { showToast } = useToast()
  useDismiss(modalRef, onClose)

  const update = (patch: Partial<CurrentProfile>) =>
    setDraft((prev) => ({ ...prev, ...patch }))

  const handleSave = async () => {
    try {
      const next = await updateProfile.mutateAsync({
        firstName: draft.firstName,
        lastName: draft.lastName,
        businessName: draft.businessName,
        dialCode: draft.dialCode,
        phone: draft.phone,
      })
      queryClient.setQueryData(profileKeys.current(), next)
      showToast({ title: 'Profile updated', variant: 'success' })
      onSave(next)
    } catch (error) {
      showToast({
        title: 'Could not update profile',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="edit-title" className="modal-title">
            Edit Profile
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label htmlFor="businessName">Business Name</label>
            <input
              id="businessName"
              className="modal-input"
              value={draft.businessName}
              onChange={(event) => update({ businessName: event.target.value })}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="modal-input"
              value={draft.firstName}
              onChange={(event) => update({ firstName: event.target.value })}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="modal-input"
              value={draft.lastName}
              onChange={(event) => update({ lastName: event.target.value })}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="editEmail">Email Address</label>
            <input id="editEmail" className="modal-input" value={draft.email} disabled />
          </div>
          <div className="modal-field">
            <label htmlFor="editPhone">Phone Number</label>
            <div className="modal-phone">
              <select
                className="modal-select"
                aria-label="Country dialing code"
                value={draft.dialCode}
                onChange={(event) => update({ dialCode: event.target.value })}
              >
                <option value="+234">+234</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+233">+233</option>
                <option value="+254">+254</option>
              </select>
              <input
                id="editPhone"
                className="modal-input"
                value={draft.phone}
                onChange={(event) => update({ phone: event.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary btn-block"
            disabled={updateProfile.isPending}
            onClick={handleSave}
          >
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ChangePasswordField, string>>>({})
  const changePassword = useChangePassword()
  const { showToast } = useToast()
  useDismiss(modalRef, onClose)

  const clearFieldError = (field: ChangePasswordField) => {
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
    const result = changePasswordSchema.safeParse({
      currentPassword: String(data.get('currentPassword') ?? ''),
      newPassword: String(data.get('newPassword') ?? ''),
      confirmPassword: String(data.get('confirmPassword') ?? ''),
    })

    if (!result.success) {
      const errors = getSchemaFieldErrors<ChangePasswordField>(result.error)
      setFieldErrors(errors)
      showToast({
        title: 'Review the highlighted fields',
        message: summarizeFieldErrors(errors),
        variant: 'error',
      })
      return
    }

    try {
      const response = await changePassword.mutateAsync(result.data)
      showToast({
        title: response.message,
        variant: 'success',
      })
      onClose()
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="reset-title" className="modal-title">
            Change Password
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <PasswordField
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            invalid={Boolean(fieldErrors.currentPassword)}
            onChange={() => clearFieldError('currentPassword')}
          />
          <PasswordField
            id="newPassword"
            name="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            invalid={Boolean(fieldErrors.newPassword)}
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            hint={PASSWORD_REQUIREMENTS}
            onChange={() => clearFieldError('newPassword')}
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            invalid={Boolean(fieldErrors.confirmPassword)}
            maxLength={PASSWORD_MAX_LENGTH}
            onChange={() => clearFieldError('confirmPassword')}
          />
          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? 'Changing password…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  invalid,
  minLength,
  maxLength,
  hint,
  onChange,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  autoComplete: string
  invalid: boolean
  minLength?: number
  maxLength?: number
  hint?: string
  onChange: () => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="modal-field">
      <label htmlFor={id}>{label}</label>
      <div className={`modal-input-group${invalid ? ' is-invalid' : ''}`}>
        <input
          id={id}
          name={name}
          className="modal-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          aria-invalid={invalid}
          onChange={onChange}
        />
        <button
          type="button"
          className="modal-toggle"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow((value) => !value)}
        >
          {show ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      {hint ? <p className="profile-help">{hint}</p> : null}
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

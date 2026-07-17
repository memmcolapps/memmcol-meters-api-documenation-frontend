import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { useAdminIdentity } from '../../../../features/auth/adminLogin'

export const Route = createFileRoute('/admin/_admin/settings/profile')({
  component: AdminProfilePage,
})

type AdminProfile = {
  firstName: string
  lastName: string
  role: string
  email: string
}

function AdminProfilePage() {
  const { data: admin } = useAdminIdentity()
  const [editedProfile, setEditedProfile] = useState<AdminProfile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const profile = editedProfile ?? {
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    email: admin.email,
  }

  const fullName = `${profile.firstName} ${profile.lastName}`

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

      <div className="profile-top">
        <div>
          <span className="profile-avatar" aria-hidden="true">
            {profile.firstName.charAt(0)}
          </span>
          <p className="profile-role">{profile.role}</p>
        </div>
        <div className="profile-actions">
          <button type="button" className="btn-primary" onClick={() => setEditOpen(true)}>
            Edit
          </button>
          <button type="button" className="btn-danger" onClick={() => setResetOpen(true)}>
            Reset Password
          </button>
        </div>
      </div>

      <section className="profile-section">
        <h2 className="profile-section-title">Name</h2>
        <div className="profile-field">
          <p className="profile-help">This is the name associated with your account</p>
          <input className="profile-input" value={fullName} readOnly />
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Email Address</h2>
        <div className="profile-field">
          <p className="profile-help">This is the email associated with your account</p>
          <input className="profile-input" value={profile.email} disabled />
        </div>
      </section>

      {editOpen ? (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={(next) => {
            setEditedProfile(next)
            setEditOpen(false)
          }}
        />
      ) : null}

      {resetOpen ? <ResetPasswordModal onClose={() => setResetOpen(false)} /> : null}
    </div>
  )
}

function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: AdminProfile
  onClose: () => void
  onSave: (profile: AdminProfile) => void
}) {
  const [draft, setDraft] = useState(profile)
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const update = (patch: Partial<AdminProfile>) =>
    setDraft((prev) => ({ ...prev, ...patch }))

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
          <button
            type="button"
            className="btn-primary btn-block"
            onClick={() => onSave(draft)}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="reset-title" className="modal-title">
            Reset Password
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <PasswordField id="oldPassword" label="Old Password" placeholder="Enter your old password" />
          <PasswordField id="newPassword" label="New Password" placeholder="Enter your new password" />
          <PasswordField
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="Enter your new password"
          />
          <button type="button" className="btn-primary btn-block" onClick={onClose}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  placeholder,
}: {
  id: string
  label: string
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="modal-field">
      <label htmlFor={id}>{label}</label>
      <div className="modal-input-group">
        <input
          id={id}
          className="modal-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete="off"
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

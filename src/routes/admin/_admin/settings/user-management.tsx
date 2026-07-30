import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { AsyncState } from '../../../../app/AsyncState'
import { ConfirmModal } from '../../../../app/ConfirmModal'
import { useToast } from '../../../../app/toastContext'
import {
  useCreateAdminUser,
  useLeaveAdminTeam,
  getCreateAdminUserError,
  useAdminTeamMembers,
  type AdminRole,
} from '../../../../features/admin-users/adminUserQueries'
import { getApiErrorMessage } from '../../../../lib/api/client'

export const Route = createFileRoute('/admin/_admin/settings/user-management')({
  component: UserManagementPage,
})

type Role = 'Admin' | 'Developer'

const roles: Array<{ name: Role; description: string }> = [
  { name: 'Admin', description: 'All Access' },
  {
    name: 'Developer',
    description: 'Can manage API, Request Log, Incident report, Meter Integration',
  },
]

const roleMap: Record<AdminRole, Role> = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
}

function UserManagementPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const createAdminUser = useCreateAdminUser()
  const leaveTeam = useLeaveAdminTeam()
  const membersQuery = useAdminTeamMembers()
  const { showToast } = useToast()
  const members = membersQuery.data?.items ?? []

  const invite = async (firstName: string, lastName: string, email: string, role: Role) => {
    const adminRole: AdminRole = role === 'Admin' ? 'ADMIN' : 'DEVELOPER'

    try {
      const admin = await createAdminUser.mutateAsync({
        firstName,
        lastName,
        email,
        role: adminRole,
      })
      setInviteOpen(false)
      showToast({
        title: 'Invitation sent',
        message: `${admin.firstName} ${admin.lastName} has been invited.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getCreateAdminUserError(error)
      const fieldMessage = [...new Set(Object.values(apiError.fields))].join(' ')
      showToast({
        title: apiError.message,
        message: [fieldMessage, apiError.requestId ? `Request ID: ${apiError.requestId}` : '']
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    }
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">User Management</h1>
          <p className="dash-subtitle">
            Manage users, roles, and access permissions in one place.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setInviteOpen(true)}
          disabled={createAdminUser.isPending}
        >
          Add Users <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Team Members
        </button>
      </div>

      <AsyncState
        isPending={membersQuery.isPending}
        error={membersQuery.error}
        onRetry={() => void membersQuery.refetch()}
      >
        {members.length > 0 ? (
          <div className="member-list">
            {members.map((member) => (
              <div className="member-row" key={member.id}>
                <div className="member-id">
                  <span className="member-avatar" aria-hidden="true">
                    {member.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="member-name">
                      {member.displayName}
                      {member.isCurrentUser ? (
                        <span className="org-member-you">You</span>
                      ) : null}
                    </p>
                    <p className="member-email">{member.email}</p>
                  </div>
                </div>
                <p className="member-role">
                  {member.isOwner ? 'Owner' : roleMap[member.role]}
                </p>
                <div className="member-actions">
                  <span
                    className={`code-badge${
                      member.status === 'ACTIVE' ? ' is-ok' : ' is-warn'
                    }`}
                  >
                    {formatMemberStatus(member.status)}
                  </span>
                  {member.isCurrentUser ? (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setLeaving(true)}
                    >
                      Leave
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="async-state">
            <p>No admin team members found.</p>
          </div>
        )}
      </AsyncState>

      {inviteOpen ? (
        <MemberFormModal
          title="Invite Member"
          submitLabel="Invite"
          isSubmitting={createAdminUser.isPending}
          onClose={() => setInviteOpen(false)}
          onSubmit={(firstName, lastName, email, role) => void invite(firstName, lastName, email, role)}
        />
      ) : null}

      {leaving ? (
        <ConfirmModal
          message="Are you sure you want to leave this workspace?"
          confirmLabel="Leave"
          isSubmitting={leaveTeam.isPending}
          onCancel={() => {
            if (!leaveTeam.isPending) setLeaving(false)
          }}
          onConfirm={async () => {
            try {
              await leaveTeam.mutateAsync()
              showToast({ title: 'You have left the workspace', variant: 'success' })
              setLeaving(false)
            } catch (error) {
              showToast({
                title: 'Could not leave workspace',
                message: getApiErrorMessage(error),
                variant: 'error',
              })
            }
          }}
        />
      ) : null}
    </div>
  )
}

function formatMemberStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function MemberFormModal({
  title,
  submitLabel,
  isSubmitting,
  initialFirstName,
  initialLastName,
  initialEmail,
  initialRole,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  isSubmitting?: boolean
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  initialRole?: Role
  onClose: () => void
  onSubmit: (firstName: string, lastName: string, email: string, role: Role) => void
}) {
  const [firstName, setFirstName] = useState(initialFirstName ?? '')
  const [lastName, setLastName] = useState(initialLastName ?? '')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [role, setRole] = useState<Role | ''>(initialRole ?? '')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const canSubmit = firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== '' && role !== ''

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="member-form-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="member-form-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose} disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <input
              className="modal-input"
              type="text"
              placeholder="First Name"
              aria-label="First name"
              value={firstName}
              disabled={isSubmitting}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <input
              className="modal-input"
              type="text"
              placeholder="Last Name"
              aria-label="Last name"
              value={lastName}
              disabled={isSubmitting}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <input
              className="modal-input"
              type="email"
              placeholder="Enter Email Address"
              aria-label="Email address"
              value={email}
              disabled={isSubmitting}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <RoleSelect value={role} onChange={setRole} disabled={isSubmitting} />

          <div className="modal-foot modal-foot--end">
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit || isSubmitting}
              onClick={() => canSubmit && onSubmit(firstName.trim(), lastName.trim(), email.trim(), role as Role)}
            >
              {isSubmitting ? 'Sending invitation…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role | ''
  onChange: (role: Role) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)

  return (
    <div className="role-select" ref={ref}>
      <button
        type="button"
        className={`role-select-btn${value === '' ? ' is-placeholder' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        {value === '' ? 'Select Role' : value}
        <ChevronDownIcon />
      </button>
      {open ? (
        <div className="role-menu" role="listbox" aria-label="Roles">
          {roles.map((option) => (
            <button
              type="button"
              key={option.name}
              className="role-option"
              role="option"
              aria-selected={value === option.name}
              onClick={() => {
                onChange(option.name)
                setOpen(false)
              }}
            >
              <p className="role-option-name">{option.name}</p>
              <p className="role-option-desc">{option.description}</p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

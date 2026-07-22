import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useToast } from '../../../app/toastContext'
import { useDismiss } from '../../../app/useDismiss'
import {
  useInviteOrganisationMember,
  useOrganisationMembers,
  useRemoveOrganisationMember,
  useLeaveOrganisation,
  type InvitationRole,
  type OrganisationMember,
  type OrganisationMemberRole,
} from '../../../features/organisation/memberQueries'
import {
  inviteOrganisationMemberSchema,
  type InviteMemberField,
} from '../../../features/organisation/schemas'
import {
  getSchemaFieldErrors,
  summarizeFieldErrors,
} from '../../../features/auth/schemas'
import { getApiErrorMessage } from '../../../lib/api/client'

export const Route = createFileRoute('/_app/settings/user-management')({
  component: UserManagementPage,
})

const roleLabels: Record<OrganisationMemberRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
}

function UserManagementPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [leaveModalMember, setLeaveModalMember] = useState<OrganisationMember | null>(null)
  const [removeModalMember, setRemoveModalMember] = useState<OrganisationMember | null>(null)
  const membersQuery = useOrganisationMembers()
  const { showToast } = useToast()
  const notifiedError = useRef<unknown>(null)

  useEffect(() => {
    if (!membersQuery.error || notifiedError.current === membersQuery.error) return
    notifiedError.current = membersQuery.error
    showToast({
      title: 'Could not load organisation members',
      message: getApiErrorMessage(membersQuery.error),
      variant: 'error',
    })
  }, [membersQuery.error, showToast])

  const currentMember = membersQuery.data?.items.find((member) => member.isCurrentUser)
  const canInvite = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'
  const canGrantAdmin = currentMember?.role === 'OWNER'
  const canRemove = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'

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
          disabled={!canInvite}
          title={canInvite ? undefined : 'Only owners and admins can invite members'}
          onClick={() => setInviteOpen(true)}
        >
          Invite Members <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Teams
        </button>
      </div>

      {membersQuery.isPending ? (
        <div className="async-state" role="status" aria-live="polite">
          <span className="async-spinner" aria-hidden="true" />
          <p>Loading members…</p>
        </div>
      ) : membersQuery.error ? (
        <div className="async-state">
          <button type="button" className="btn-neutral" onClick={() => membersQuery.refetch()}>
            Try again
          </button>
        </div>
      ) : membersQuery.data?.items.length ? (
        <section className="org-member-list" aria-label="Organisation members">
          {membersQuery.data.items.map((member) => (
            <div className="org-member-row" key={member.id}>
              <div className="org-member-id">
                <span className="org-member-avatar" aria-hidden="true">
                  {member.displayName.charAt(0).toUpperCase()}
                </span>
                <div className="org-member-text">
                  <p className="org-member-name">
                    {member.displayName}
                    {member.isCurrentUser ? <span className="org-member-you">You</span> : null}
                  </p>
                  <p className="org-member-email">{member.email}</p>
                </div>
              </div>
              <span className="org-member-role">{roleLabels[member.role]}</span>
              {member.isCurrentUser ? (
                <button
                  type="button"
                  className="btn-leave"
                  onClick={() => setLeaveModalMember(member)}
                >
                  Leave
                </button>
              ) : canRemove ? (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => setRemoveModalMember(member)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </section>
      ) : (
        <div className="async-state">
          <p>No organisation members found.</p>
        </div>
      )}

      {inviteOpen && canInvite ? (
        <InviteMemberModal
          canGrantAdmin={canGrantAdmin}
          onClose={() => setInviteOpen(false)}
        />
      ) : null}

      {leaveModalMember ? (
        <LeaveConfirmationModal
          member={leaveModalMember}
          onClose={() => setLeaveModalMember(null)}
        />
      ) : null}

      {removeModalMember ? (
        <RemoveConfirmationModal
          member={removeModalMember}
          onClose={() => setRemoveModalMember(null)}
        />
      ) : null}
    </div>
  )
}

function InviteMemberModal({
  canGrantAdmin,
  onClose,
}: {
  canGrantAdmin: boolean
  onClose: () => void
}) {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<InviteMemberField, string>>>({})
  const inviteMember = useInviteOrganisationMember()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const clearFieldError = (field: InviteMemberField) => {
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
    const result = inviteOrganisationMemberSchema.safeParse({
      email: String(data.get('email') ?? ''),
      role: String(data.get('role') ?? ''),
    })

    if (!result.success) {
      const errors = getSchemaFieldErrors<InviteMemberField>(result.error)
      setFieldErrors(errors)
      showToast({
        title: 'Review the highlighted fields',
        message: summarizeFieldErrors(errors),
        variant: 'error',
      })
      return
    }

    if (result.data.role === 'ADMIN' && !canGrantAdmin) {
      showToast({
        title: 'Only an owner can grant the Admin role',
        variant: 'error',
      })
      return
    }

    try {
      const invitation = await inviteMember.mutateAsync(result.data)
      showToast({
        title: 'Invitation sent',
        message: `${invitation.email} was invited as ${roleLabels[invitation.role]}.`,
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

  const roles: InvitationRole[] = canGrantAdmin
    ? ['OWNER', 'ADMIN', 'MEMBER']
    : ['MEMBER']

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="invite-title" className="modal-title">Invite Member</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="inviteEmail">Email Address</label>
            <input
              id="inviteEmail"
              name="email"
              className="modal-input"
              type="email"
              autoComplete="email"
              placeholder="Enter email address"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              onChange={() => clearFieldError('email')}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="inviteRole">Role</label>
            <select
              id="inviteRole"
              name="role"
              className="modal-select"
              defaultValue=""
              required
              aria-invalid={Boolean(fieldErrors.role)}
              onChange={() => clearFieldError('role')}
            >
              <option value="" disabled>Select role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={inviteMember.isPending}
          >
            {inviteMember.isPending ? 'Sending invitation…' : 'Send Invitation'}
          </button>
        </form>
      </div>
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

function LeaveConfirmationModal({
  onClose,
}: {
  member: OrganisationMember
  onClose: () => void
}) {
  const navigate = useNavigate()
  const leaveMember = useLeaveOrganisation()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const handleLeave = async () => {
    try {
      await leaveMember.mutateAsync()
      showToast({
        title: 'Left organisation',
        message: 'You have successfully left the organisation.',
        variant: 'success',
      })
      onClose()
      navigate({ to: '/login' })
    } catch (error) {
      showToast({
        title: 'Could not leave organisation',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="leave-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="leave-title" className="modal-title">Confirm Action</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to leave this organisation?</p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-neutral"
              onClick={onClose}
              disabled={leaveMember.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-leave"
              onClick={handleLeave}
              disabled={leaveMember.isPending}
            >
              {leaveMember.isPending ? 'Leaving…' : 'Leave'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RemoveConfirmationModal({
  member,
  onClose,
}: {
  member: OrganisationMember
  onClose: () => void
}) {
  const removeMember = useRemoveOrganisationMember()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync(member.id)
      showToast({
        title: 'Member removed',
        message: `${member.displayName} has been removed from the organisation.`,
        variant: 'success',
      })
      onClose()
    } catch (error) {
      showToast({
        title: 'Could not remove member',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="remove-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="remove-title" className="modal-title">Confirm Action</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to remove <strong>{member.displayName}</strong> from this organisation?</p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-neutral"
              onClick={onClose}
              disabled={removeMember.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-remove"
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { ConfirmModal } from '../../../../app/ConfirmModal'

export const Route = createFileRoute('/admin/_admin/settings/user-management')({
  component: UserManagementPage,
})

type Role = 'Admin' | 'Developer'

type Member = {
  id: string
  name: string
  email: string
  role: Role
  isOwner?: boolean
}

const roles: Array<{ name: Role; description: string }> = [
  { name: 'Admin', description: 'All Access' },
  {
    name: 'Developer',
    description: 'Can manage API, Request Log, Incident report, Meter Integration',
  },
]

const seededMembers: Member[] = [
  {
    id: 'mem-1',
    name: 'Memmcol',
    email: 'Memmcolapp@gmail.com',
    role: 'Admin',
    isOwner: true,
  },
]

function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? email
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function UserManagementPage() {
  const [members, setMembers] = useState<Member[]>(seededMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [removing, setRemoving] = useState<Member | null>(null)
  const [leaving, setLeaving] = useState(false)

  const invite = (email: string, role: Role) => {
    setMembers((prev) => [
      ...prev,
      { id: `mem-${Date.now()}`, name: nameFromEmail(email), email, role },
    ])
    setInviteOpen(false)
  }

  const saveMember = (id: string, email: string, role: Role) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? { ...member, email, role, name: nameFromEmail(email) }
          : member,
      ),
    )
    setEditing(null)
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
        <button type="button" className="btn-primary" onClick={() => setInviteOpen(true)}>
          Add Users <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Team Members
        </button>
      </div>

      <div className="member-list">
        {members.map((member) => (
          <div className="member-row" key={member.id}>
            <div className="member-id">
              <span className="member-avatar" aria-hidden="true">
                {member.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="member-name">{member.name}</p>
                <p className="member-email">{member.email}</p>
              </div>
            </div>
            <p className="member-role">{member.role}</p>
            <div className="member-actions">
              {member.isOwner ? (
                <button type="button" className="btn-danger" onClick={() => setLeaving(true)}>
                  Leave
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="icon-btn-primary"
                    aria-label={`Edit ${member.name}`}
                    onClick={() => setEditing(member)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setRemoving(member)}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {inviteOpen ? (
        <MemberFormModal
          title="Invite Member"
          submitLabel="Invite"
          onClose={() => setInviteOpen(false)}
          onSubmit={(email, role) => invite(email, role)}
        />
      ) : null}

      {editing ? (
        <MemberFormModal
          title="Edit Member"
          submitLabel="Save Changes"
          initialEmail={editing.email}
          initialRole={editing.role}
          onClose={() => setEditing(null)}
          onSubmit={(email, role) => saveMember(editing.id, email, role)}
        />
      ) : null}

      {removing ? (
        <ConfirmModal
          message={`Are you sure you want to remove ${removing.name}?`}
          confirmLabel="Remove"
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            setMembers((prev) => prev.filter((member) => member.id !== removing.id))
            setRemoving(null)
          }}
        />
      ) : null}

      {leaving ? (
        <ConfirmModal
          message="Are you sure you want to leave this workspace?"
          confirmLabel="Leave"
          onCancel={() => setLeaving(false)}
          onConfirm={() => setLeaving(false)}
        />
      ) : null}
    </div>
  )
}

function MemberFormModal({
  title,
  submitLabel,
  initialEmail,
  initialRole,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  initialEmail?: string
  initialRole?: Role
  onClose: () => void
  onSubmit: (email: string, role: Role) => void
}) {
  const [email, setEmail] = useState(initialEmail ?? '')
  const [role, setRole] = useState<Role | ''>(initialRole ?? '')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const canSubmit = email.trim() !== '' && role !== ''

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="member-form-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="member-form-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <input
              className="modal-input"
              type="email"
              placeholder="Enter Email Address"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <RoleSelect value={role} onChange={setRole} />

          <div className="modal-foot modal-foot--end">
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit}
              onClick={() => canSubmit && onSubmit(email.trim(), role as Role)}
            >
              {submitLabel}
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
}: {
  value: Role | ''
  onChange: (role: Role) => void
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

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M18.4 2.6a2 2 0 0 1 2.83 2.83L12 14.7l-3.7.87.87-3.7Z" />
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

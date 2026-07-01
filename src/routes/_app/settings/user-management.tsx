import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../app/useDismiss'

export const Route = createFileRoute('/_app/settings/user-management')({
  component: UserManagementPage,
})

type Role = 'Owner' | 'Admin' | 'Member'

type Member = {
  id: string
  name: string
  email: string
  role: Role
  isSelf?: boolean
}

const roleOptions = [
  { value: 'Admin', label: 'Admin', desc: 'Can manage member and billing' },
  { value: 'Member', label: 'Members', desc: 'Can only generate API keys' },
]

const initialMembers: Member[] = [
  {
    id: 'self',
    name: 'Wura Akande',
    email: 'wura@gmail.com',
    role: 'Owner',
    isSelf: true,
  },
]

type Confirm = { action: 'leave' | 'remove'; member: Member } | null

function UserManagementPage() {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)

  const handleInvite = (email: string, role: Role) => {
    const name = email.split('@')[0]
    setMembers((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email,
        role,
      },
    ])
    setInviteOpen(false)
  }

  const handleConfirm = () => {
    if (confirm) {
      setMembers((prev) => prev.filter((m) => m.id !== confirm.member.id))
    }
    setConfirm(null)
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
          Invite Members <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Teams
        </button>
      </div>

      <section className="member-list">
        {members.map((member) => (
          <div className="member-row" key={member.id}>
            <div className="member-id">
              <span className="member-avatar" aria-hidden="true">
                {member.name.charAt(0)}
              </span>
              <div className="member-text">
                <p className="member-name">{member.name}</p>
                <p className="member-email">{member.email}</p>
              </div>
            </div>
            <span className="member-role">{member.role}</span>
            <div className="member-action">
              {member.isSelf ? (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setConfirm({ action: 'leave', member })}
                >
                  Leave
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setConfirm({ action: 'remove', member })}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {inviteOpen ? (
        <InviteModal onClose={() => setInviteOpen(false)} onInvite={handleInvite} />
      ) : null}

      {confirm ? (
        <ConfirmModal
          action={confirm.action}
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </div>
  )
}

function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void
  onInvite: (email: string, role: Role) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [open, setOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const roleRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)
  useDismiss(roleRef, () => setOpen(false), open)

  const selected = roleOptions.find((option) => option.value === role)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="invite-title" className="modal-title">
            Invite Member
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <input
            className="modal-input"
            type="email"
            value={email}
            placeholder="Enter Email Address"
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="role-select" ref={roleRef}>
            <button
              type="button"
              className="role-trigger"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className={selected ? '' : 'role-placeholder'}>
                {selected ? selected.label : 'Select Role'}
              </span>
              <ChevronDownIcon />
            </button>
            {open ? (
              <ul className="role-options" role="listbox">
                {roleOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className="role-option"
                      onClick={() => {
                        setRole(option.value as Role)
                        setOpen(false)
                      }}
                    >
                      <span className="role-option-label">{option.label}</span>
                      <span className="role-option-desc">{option.desc}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={!email || !role}
              onClick={() => role && onInvite(email, role)}
            >
              Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({
  action,
  onCancel,
  onConfirm,
}: {
  action: 'leave' | 'remove'
  onCancel: () => void
  onConfirm: () => void
}) {
  const verb = action === 'leave' ? 'leave' : 'remove'
  const label = action === 'leave' ? 'Leave' : 'Remove'
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onCancel)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="confirm-title" className="modal-title">
            Confirm Action
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body modal-confirm">
          <p className="modal-text">Are you sure you want to {verb}?</p>
          <div className="confirm-actions">
            <button type="button" className="btn-neutral" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn-danger-solid" onClick={onConfirm}>
              {label}
            </button>
          </div>
        </div>
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

function ChevronDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

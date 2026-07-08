import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../app/useDismiss'
import { useAnchoredMenu } from '../../../app/useAnchoredMenu'
import { ConfirmModal } from '../../../app/ConfirmModal'

export const Route = createFileRoute('/admin/_admin/organization-management')({
  component: OrganizationManagementPage,
})

type OrgStatus = 'Active' | 'Suspended'

type Organization = {
  id: string
  business: string
  userName: string
  phone: string
  email: string
  role: 'Owner' | 'Member'
  credits: number
  status: OrgStatus
}

const seededOrgs: Organization[] = [
  { id: 'org-1', business: 'Memmcol', userName: 'Wura Akande', phone: '08145236987', email: 'wura@gmail.com', role: 'Owner', credits: 250000, status: 'Active' },
  { id: 'org-2', business: 'Epail', userName: 'Mia Chris', phone: '08145236987', email: 'mia@gmail.com', role: 'Owner', credits: 0, status: 'Active' },
  { id: 'org-3', business: 'Momas', userName: 'Jane Doe', phone: '08142106987', email: 'janea@gmail.com', role: 'Member', credits: 0, status: 'Suspended' },
  { id: 'org-4', business: 'Momas', userName: 'Jane Doe', phone: '08142106987', email: 'janea@gmail.com', role: 'Member', credits: 0, status: 'Active' },
  { id: 'org-5', business: 'Momas', userName: 'Jane Doe', phone: '08142106987', email: 'janea@gmail.com', role: 'Owner', credits: 0, status: 'Active' },
  { id: 'org-6', business: 'Epail', userName: 'Mia Chris', phone: '08145236987', email: 'mia@gmail.com', role: 'Member', credits: 0, status: 'Suspended' },
  { id: 'org-7', business: 'Epail', userName: 'Mia Chris', phone: '08145236987', email: 'mia@gmail.com', role: 'Member', credits: 0, status: 'Active' },
  { id: 'org-8', business: 'Epail', userName: 'Mia Chris', phone: '08145236987', email: 'mia@gmail.com', role: 'Owner', credits: 0, status: 'Suspended' },
  { id: 'org-9', business: 'Epail', userName: 'Mia Chris', phone: '08145236987', email: 'mia@gmail.com', role: 'Member', credits: 0, status: 'Active' },
  { id: 'org-10', business: 'Epail', userName: 'Mia Chris', phone: '08145236987', email: 'mia@gmail.com', role: 'Owner', credits: 0, status: 'Suspended' },
]

const pages = [1, 2, 3, '…', 5, 6, 7]
const currentPage = 1

function OrganizationManagementPage() {
  const [orgs, setOrgs] = useState<Organization[]>(seededOrgs)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [suspending, setSuspending] = useState<Organization | null>(null)
  const [assigning, setAssigning] = useState<Organization | null>(null)

  const assignCredits = (id: string, amount: number) => {
    setOrgs((prev) =>
      prev.map((org) =>
        org.id === id ? { ...org, credits: org.credits + amount } : org,
      ),
    )
    setAssigning(null)
  }

  const setStatus = (id: string, status: OrgStatus) => {
    setOrgs((prev) => prev.map((org) => (org.id === id ? { ...org, status } : org)))
    setOpenMenu(null)
  }

  const addOrg = (business: string, email: string) => {
    setOrgs((prev) => [
      ...prev,
      {
        id: `org-${Date.now()}`,
        business,
        userName: '—',
        phone: '—',
        email,
        role: 'Owner',
        credits: 0,
        status: 'Active',
      },
    ])
    setAddOpen(false)
  }

  const query = search.trim().toLowerCase()
  const visibleOrgs = query
    ? orgs.filter((org) =>
        `${org.business} ${org.userName} ${org.email}`.toLowerCase().includes(query),
      )
    : orgs

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Organization Management</h1>
          <p className="dash-subtitle">
            Manage organizations and users account status.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setAddOpen(true)}>
          Add Organization <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Organizations
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search Organization..."
              aria-label="Search organizations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SearchIcon />
          </div>
          <button type="button" className="filter-btn">
            Filter <ChevronRightIcon />
          </button>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-check">
                <input type="checkbox" aria-label="Select all rows" />
              </th>
              <th>S/N</th>
              <th>Business Name</th>
              <th>User Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Credits</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrgs.map((org, index) => (
              <tr key={org.id}>
                <td className="col-check">
                  <input type="checkbox" aria-label={`Select organization ${index + 1}`} />
                </td>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>{org.business}</td>
                <td>{org.userName}</td>
                <td>{org.phone}</td>
                <td>{org.email}</td>
                <td>{org.role}</td>
                <td>{org.credits.toLocaleString()}</td>
                <td>
                  <span
                    className={`code-badge${org.status === 'Active' ? ' is-ok' : ' is-error'}`}
                  >
                    {org.status}
                  </span>
                </td>
                <td className="col-actions">
                  <RowActions
                    isOpen={openMenu === org.id}
                    status={org.status}
                    onToggle={() =>
                      setOpenMenu((prev) => (prev === org.id ? null : org.id))
                    }
                    onClose={() => setOpenMenu(null)}
                    onAssignCredits={() => {
                      setOpenMenu(null)
                      setAssigning(org)
                    }}
                    onSuspend={() => {
                      setOpenMenu(null)
                      setSuspending(org)
                    }}
                    onReactivate={() => setStatus(org.id, 'Active')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="pagination" aria-label="Pagination">
        <button type="button" className="page-nav" disabled>
          <ChevronLeftIcon /> Previous
        </button>
        <div className="page-numbers">
          {pages.map((page, index) =>
            page === '…' ? (
              <span key={`gap-${index}`} className="page-gap">
                …
              </span>
            ) : (
              <button
                type="button"
                key={page}
                className={`page-num${page === currentPage ? ' is-active' : ''}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ),
          )}
        </div>
        <button type="button" className="page-nav">
          Next <ChevronRightIcon />
        </button>
      </nav>

      {addOpen ? (
        <AddOrganizationModal onClose={() => setAddOpen(false)} onAdd={addOrg} />
      ) : null}

      {assigning ? (
        <AssignCreditsModal
          org={assigning}
          onClose={() => setAssigning(null)}
          onAssign={(amount) => assignCredits(assigning.id, amount)}
        />
      ) : null}

      {suspending ? (
        <ConfirmModal
          message="Are you sure you want to suspend organization?"
          confirmLabel="Suspend"
          onCancel={() => setSuspending(null)}
          onConfirm={() => {
            setStatus(suspending.id, 'Suspended')
            setSuspending(null)
          }}
        />
      ) : null}
    </div>
  )
}

function AddOrganizationModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (business: string, email: string) => void
}) {
  const [business, setBusiness] = useState('')
  const [email, setEmail] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const canSubmit = business.trim() !== '' && email.trim() !== ''

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-org-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="add-org-title" className="modal-title">
            Add Organization
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Business Name</label>
            <input
              className="modal-input"
              placeholder="E.g. Memmcol"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label>Email Address</label>
            <input
              className="modal-input"
              type="email"
              placeholder="E.g. memmcoltechnical@memmcol.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-primary btn-block"
            disabled={!canSubmit}
            onClick={() => canSubmit && onAdd(business.trim(), email.trim())}
          >
            Add Organization
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignCreditsModal({
  org,
  onClose,
  onAssign,
}: {
  org: Organization
  onClose: () => void
  onAssign: (amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const parsed = Number(amount.replace(/[^\d]/g, ''))
  const canSubmit = parsed > 0

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-credits-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <div>
            <h2 id="assign-credits-title" className="modal-title">
              Assign Credits
            </h2>
            <p className="modal-subtitle">
              Top up API credits for {org.business} — current balance:{' '}
              {org.credits.toLocaleString()} credits.
            </p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Credits</label>
            <input
              className="modal-input"
              inputMode="numeric"
              placeholder="E.g. 500,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canSubmit}
              onClick={() => canSubmit && onAssign(parsed)}
            >
              Assign Credits
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RowActions({
  isOpen,
  status,
  onToggle,
  onClose,
  onAssignCredits,
  onSuspend,
  onReactivate,
}: {
  isOpen: boolean
  status: OrgStatus
  onToggle: () => void
  onClose: () => void
  onAssignCredits: () => void
  onSuspend: () => void
  onReactivate: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, onClose, isOpen)
  const { anchorRef, menuStyle } = useAnchoredMenu(isOpen)

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="row-kebab"
        aria-label="Row actions"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <KebabIcon />
      </button>
      {isOpen ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button type="button" className="row-menu-item" role="menuitem" onClick={onAssignCredits}>
            <CoinsIcon /> Assign Credits
          </button>
          {status === 'Active' ? (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onSuspend}>
              <WarnIcon /> Suspend User
            </button>
          ) : (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onReactivate}>
              <ReactivateIcon /> Reactivate User
            </button>
          )}
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

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
    </svg>
  )
}

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
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

function CoinsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </svg>
  )
}

function ReactivateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8m0 0-3.5 3.5M12 8l3.5 3.5" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

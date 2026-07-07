import { useRef, useState } from 'react'
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { adminNavItems } from '../../app/adminNav'
import { Logo } from '../../app/Logo'
import { useDismiss } from '../../app/useDismiss'
import { clearAdminSession, getAdminSession } from '../../app/adminSession'

export const Route = createFileRoute('/admin/_admin')({
  beforeLoad: () => {
    if (!getAdminSession()) {
      throw redirect({ to: '/admin/login' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="app admin">
      <aside
        className={`app-sidebar${sidebarOpen ? ' is-open' : ''}`}
        aria-label="Sidebar navigation"
      >
        <Link to="/admin/dashboard" className="app-brand" onClick={closeSidebar}>
          <Logo />
        </Link>

        <nav className="app-nav">
          {adminNavItems.map((item) =>
            item.children ? (
              <NavGroup
                key={item.to}
                item={item}
                pathname={pathname}
                onNavigate={closeSidebar}
              />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="app-nav-link"
                activeProps={{ className: 'is-active' }}
                onClick={closeSidebar}
              >
                <span className="app-nav-icon">{item.icon}</span>
                <span className="app-nav-label">{item.label}</span>
              </Link>
            ),
          )}
        </nav>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="app-scrim"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      ) : null}

      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="app-burger"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="app-header-actions">
            <button type="button" className="app-icon-btn" aria-label="Notifications">
              <BellIcon />
            </button>
            <AdminAccountMenu />
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>

        <footer className="app-footer">© 2025, Powered by MEMMCOL</footer>
      </div>
    </div>
  )
}

function AdminAccountMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)

  const session = getAdminSession()
  const email = session?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || 'A'

  const handleLogout = () => {
    clearAdminSession()
    navigate({ to: '/admin/login' })
  }

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="app-account"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="app-avatar">{initial}</span>
        <ChevronIcon />
      </button>

      {open ? (
        <div className="account-menu" role="menu">
          <div className="account-head">
            <p className="account-name">Administrator</p>
            <p className="account-email">{email}</p>
          </div>

          <div className="account-group">
            <button
              type="button"
              className="account-item is-logout"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogoutIcon /> Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof adminNavItems)[number]
  pathname: string
  onNavigate: () => void
}) {
  const isWithin = pathname.startsWith(item.to)
  const [open, setOpen] = useState(isWithin)

  return (
    <div className="app-nav-group">
      <button
        type="button"
        className={`app-nav-link app-nav-toggle${isWithin ? ' is-within' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="app-nav-icon">{item.icon}</span>
        <span className="app-nav-label">{item.label}</span>
        <span className={`app-nav-caret${open ? ' is-open' : ''}`} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="app-subnav">
          {item.children?.map((child) => (
            <Link
              key={child.to}
              to={child.to}
              className="app-subnav-link"
              activeProps={{ className: 'is-active' }}
              onClick={onNavigate}
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

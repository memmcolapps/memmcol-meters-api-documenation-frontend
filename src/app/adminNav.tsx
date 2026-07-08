import type { NavItem } from './nav'

/**
 * Single source of truth for the admin sidebar — kept separate from the
 * customer `navItems` so the two shells never leak into each other.
 * Add a module here and create the matching route file under
 * `src/routes/admin/_admin/<module>.tsx` — the sidebar updates automatically.
 * Items with `children` become expandable groups; create the child
 * routes under `src/routes/admin/_admin/<module>/<child>.tsx`.
 */
export const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  {
    to: '/admin/organization-management',
    label: 'Organization Management',
    icon: <OrgIcon />,
  },
  { to: '/admin/api-management', label: 'API Management', icon: <ApiIcon /> },
  {
    to: '/admin/meter-integration',
    label: 'Meter Integration',
    icon: <MeterIntegrationIcon />,
  },
  { to: '/admin/request-logs', label: 'Request Logs', icon: <RequestLogsIcon /> },
  {
    to: '/admin/incident-report',
    label: 'Incident Report',
    icon: <IncidentIcon />,
  },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: <AuditIcon /> },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    children: [
      { to: '/admin/settings/user-management', label: 'User Management' },
      { to: '/admin/settings/plans', label: 'Plans & Pricing' },
      { to: '/admin/settings/profile', label: 'Profile' },
    ],
  },
]

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function OrgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17.8 14.1a6.5 6.5 0 0 1 3.7 5.9" />
    </svg>
  )
}

function ApiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8 20 3m-3.5 3.5 3 3M13.5 9.5l2.5 2.5" />
    </svg>
  )
}

function MeterIntegrationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="7" cy="17" r="2.2" />
    </svg>
  )
}

function RequestLogsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h3l2.5-8 4 16 2.5-8H21" />
    </svg>
  )
}

function IncidentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.4" r="0.4" fill="currentColor" />
    </svg>
  )
}

function AuditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l1.5-2 1.5 3 1.5-4 1.5 3H16" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

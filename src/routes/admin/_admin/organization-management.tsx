import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_admin/organization-management')({
  component: OrganizationManagementPage,
})

function OrganizationManagementPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Organization Management</h1>
        <p className="dash-subtitle">
          View and manage organizations onboarded to the platform.
        </p>
      </header>
    </div>
  )
}

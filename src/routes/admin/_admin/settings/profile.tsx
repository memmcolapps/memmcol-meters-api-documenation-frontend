import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_admin/settings/profile')({
  component: AdminProfilePage,
})

function AdminProfilePage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Profile</h1>
        <p className="dash-subtitle">Manage your admin account details.</p>
      </header>
    </div>
  )
}

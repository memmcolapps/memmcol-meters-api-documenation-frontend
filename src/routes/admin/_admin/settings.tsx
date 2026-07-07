import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_admin/settings')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  return (
    <div className="dash">
      <header className="dash-head">
        <h1 className="dash-title">Settings</h1>
        <p className="dash-subtitle">Manage admin preferences and configuration.</p>
      </header>
    </div>
  )
}

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seededAdminApis, type AdminApi } from '../../../../app/adminApis'

export const Route = createFileRoute('/admin/_admin/api-management/$apiId')({
  component: ApiViewPage,
})

function ApiViewPage() {
  const { apiId } = Route.useParams()
  const [api, setApi] = useState<AdminApi | undefined>(() =>
    seededAdminApis.find((item) => item.id === apiId),
  )

  if (!api) {
    return (
      <div className="dash">
        <header className="dash-head">
          <h1 className="dash-title">API Management</h1>
          <p className="dash-subtitle">This API could not be found.</p>
        </header>
      </div>
    )
  }

  return <ApiView api={api} onUpdate={setApi} />
}

function ApiView({
  api,
  onUpdate,
}: {
  api: AdminApi
  onUpdate: (api: AdminApi) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(api)

  const set = (key: keyof AdminApi, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const toggleEdit = () => {
    if (editing) {
      onUpdate(draft)
      setEditing(false)
    } else {
      setDraft(api)
      setEditing(true)
    }
  }

  const togglePublication = () => {
    onUpdate({
      ...api,
      publication: api.publication === 'Published' ? 'Unpublished' : 'Published',
    })
  }

  const shown = editing ? draft : api

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">API Management</h1>
          <p className="dash-subtitle">
            Create, publish and manage API services available to customers.
          </p>
        </div>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          APIs
        </button>
      </div>

      <div className="api-view-actions">
        <button
          type="button"
          className={editing ? 'btn-primary' : 'btn-neutral'}
          onClick={toggleEdit}
        >
          {editing ? 'Save' : 'Edit'}
        </button>
        <button type="button" className="btn-warn-outline" onClick={togglePublication}>
          {api.publication === 'Published' ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      <div className="api-view">
        <div className="modal-field">
          <label>API Name</label>
          <input
            className="modal-input"
            value={shown.name}
            readOnly={!editing}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>Route URL</label>
          <input
            className="modal-input"
            value={shown.route}
            readOnly={!editing}
            onChange={(e) => set('route', e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>Cost per Call (credits)</label>
          <input
            className="modal-input"
            value={shown.cost}
            readOnly={!editing}
            onChange={(e) => set('cost', e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>Sample Payload</label>
          <textarea
            className="modal-input api-view-code"
            rows={5}
            value={shown.samplePayload}
            readOnly={!editing}
            onChange={(e) => set('samplePayload', e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>Sample Request</label>
          <textarea
            className="modal-input api-view-code"
            rows={5}
            value={shown.sampleRequest}
            readOnly={!editing}
            onChange={(e) => set('sampleRequest', e.target.value)}
          />
        </div>

        <div className="modal-field api-view-docs-field">
          <label>Documentation</label>
          {editing ? (
            <textarea
              className="modal-input"
              rows={12}
              value={draft.documentation}
              onChange={(e) => set('documentation', e.target.value)}
            />
          ) : (
            <div className="api-view-docs">
              {api.documentation.split('\n\n').map((block, blockIndex) => (
                <p key={blockIndex}>
                  {block.split('\n').map((line, lineIndex, lines) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < lines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

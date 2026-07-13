import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AsyncState, MutationError } from '../../../../app/AsyncState'
import { type AdminApi } from '../../../../app/adminApis'
import {
  useAdminApi,
  useUpdateAdminApi,
} from '../../../../features/admin-apis/adminApiQueries'

export const Route = createFileRoute('/admin/_admin/api-management/$apiId')({
  component: ApiViewPage,
})

function ApiViewPage() {
  const { apiId } = Route.useParams()
  const apiQuery = useAdminApi(apiId)

  if (apiQuery.isPending || apiQuery.error) {
    return (
      <div className="dash">
        <AsyncState
          isPending={apiQuery.isPending}
          error={apiQuery.error}
          onRetry={() => void apiQuery.refetch()}
        >
          {null}
        </AsyncState>
      </div>
    )
  }

  return <ApiView api={apiQuery.data} />
}

function ApiView({ api }: { api: AdminApi }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(api)
  const updateApi = useUpdateAdminApi()

  const set = (key: keyof AdminApi, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const toggleEdit = () => {
    if (editing) {
      updateApi.mutate(
        { id: api.id, data: draft },
        { onSuccess: () => setEditing(false) },
      )
    } else {
      setDraft(api)
      setEditing(true)
    }
  }

  const togglePublication = () => {
    updateApi.mutate({
      id: api.id,
      data: {
        publication: api.publication === 'Published' ? 'Unpublished' : 'Published',
      },
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

      <MutationError error={updateApi.error} />

      <div className="api-view-actions">
        <button
          type="button"
          className={editing ? 'btn-primary' : 'btn-neutral'}
          onClick={toggleEdit}
          disabled={updateApi.isPending}
        >
          {updateApi.isPending ? 'Saving…' : editing ? 'Save' : 'Edit'}
        </button>
        <button type="button" className="btn-warn-outline" onClick={togglePublication} disabled={updateApi.isPending}>
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

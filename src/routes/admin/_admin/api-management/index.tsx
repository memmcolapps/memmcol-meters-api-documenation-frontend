import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../app/useAnchoredMenu'
import { ConfirmModal } from '../../../../app/ConfirmModal'
import { AsyncState, MutationError } from '../../../../app/AsyncState'
import { formatAddedDate } from '../../../../app/adminMeters'
import { type AdminApi } from '../../../../app/adminApis'
import {
  useAdminApis,
  useCreateAdminApi,
  useUpdateAdminApi,
} from '../../../../features/admin-apis/adminApiQueries'

type ApiFormValues = Pick<
  AdminApi,
  'name' | 'route' | 'cost' | 'samplePayload' | 'sampleRequest' | 'documentation'
>

type FormModalState = { mode: 'add' } | { mode: 'edit'; api: AdminApi }

export const Route = createFileRoute('/admin/_admin/api-management/')({
  component: ApiManagementPage,
})

function ApiManagementPage() {
  const navigate = useNavigate()
  const apisQuery = useAdminApis()
  const createApi = useCreateAdminApi()
  const updateApi = useUpdateAdminApi()
  const apis = apisQuery.data ?? []
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [formModal, setFormModal] = useState<FormModalState | null>(null)
  const [publishing, setPublishing] = useState<AdminApi | null>(null)
  const [deprecating, setDeprecating] = useState<AdminApi | null>(null)

  const goToApi = (id: string) => {
    navigate({ to: '/admin/api-management/$apiId', params: { apiId: id } })
  }

  const togglePublication = (api: AdminApi, onSuccess?: () => void) => {
    updateApi.mutate(
      {
        id: api.id,
        data: {
          publication:
            api.publication === 'Published' ? 'Unpublished' : 'Published',
        },
      },
      { onSuccess },
    )
  }

  const setStatus = (
    id: string,
    status: AdminApi['status'],
    onSuccess?: () => void,
  ) => {
    updateApi.mutate({ id, data: { status } }, { onSuccess })
    setOpenMenu(null)
  }

  const query = search.trim().toLowerCase()
  const visibleApis = query
    ? apis.filter((api) =>
        `${api.name} ${api.route} ${api.addedBy}`.toLowerCase().includes(query),
      )
    : apis

  if (apisQuery.isPending || apisQuery.error) {
    return (
      <div className="dash">
        <AsyncState
          isPending={apisQuery.isPending}
          error={apisQuery.error}
          onRetry={() => void apisQuery.refetch()}
        >
          {null}
        </AsyncState>
      </div>
    )
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">API Management</h1>
          <p className="dash-subtitle">
            Create, publish and manage API services available to customers.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setFormModal({ mode: 'add' })}
        >
          Add New API <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          APIs
        </button>
      </div>

      <MutationError error={createApi.error ?? updateApi.error} />

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search API..."
              aria-label="Search APIs"
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
              <th>API Name</th>
              <th>Route URL</th>
              <th>Added By</th>
              <th>Added Date</th>
              <th>Status</th>
              <th>Publication</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleApis.map((api, index) => (
              <tr key={api.id}>
                <td className="col-check">
                  <input type="checkbox" aria-label={`Select API ${index + 1}`} />
                </td>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>{api.name}</td>
                <td className="cell-truncate">{api.route}</td>
                <td>{api.addedBy}</td>
                <td>{api.addedDate}</td>
                <td>
                  <span
                    className={`code-badge${api.status === 'Active' ? ' is-ok' : ' is-error'}`}
                  >
                    {api.status}
                  </span>
                </td>
                <td>
                  <span
                    className={`code-badge${api.publication === 'Published' ? ' is-ok' : ' is-warn'}`}
                  >
                    {api.publication}
                  </span>
                </td>
                <td className="col-actions">
                  <RowActions
                    isOpen={openMenu === api.id}
                    api={api}
                    onToggle={() =>
                      setOpenMenu((prev) => (prev === api.id ? null : api.id))
                    }
                    onClose={() => setOpenMenu(null)}
                    onView={() => goToApi(api.id)}
                    onEdit={() => {
                      setOpenMenu(null)
                      setFormModal({ mode: 'edit', api })
                    }}
                    onTogglePublication={() => {
                      setOpenMenu(null)
                      setPublishing(api)
                    }}
                    onActivate={() => setStatus(api.id, 'Active')}
                    onDeprecate={() => {
                      setOpenMenu(null)
                      setDeprecating(api)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formModal ? (
        <ApiFormModal
          title={formModal.mode === 'add' ? 'Add API' : 'Edit API'}
          submitLabel={formModal.mode === 'add' ? 'Add API' : 'Save Changes'}
          initial={formModal.mode === 'edit' ? formModal.api : undefined}
          isSubmitting={createApi.isPending || updateApi.isPending}
          onClose={() => setFormModal(null)}
          onSubmit={(values) => {
            if (formModal.mode === 'add') {
              createApi.mutate(
                {
                  ...values,
                  snippetLang: 'TypeScript',
                  addedBy: 'Admin',
                  addedDate: formatAddedDate(),
                  status: 'Active',
                  publication: 'Unpublished',
                },
                { onSuccess: () => setFormModal(null) },
              )
            } else {
              const editedId = formModal.api.id
              updateApi.mutate(
                { id: editedId, data: values },
                { onSuccess: () => setFormModal(null) },
              )
            }
          }}
        />
      ) : null}

      {publishing ? (
        <ConfirmModal
          tone={publishing.publication === 'Published' ? 'danger' : 'primary'}
          message={`Are you sure you want to ${
            publishing.publication === 'Published' ? 'unpublish' : 'publish'
          } API?`}
          confirmLabel={
            publishing.publication === 'Published' ? 'Unpublish' : 'Publish'
          }
          onCancel={() => setPublishing(null)}
          onConfirm={() => {
            togglePublication(publishing, () => setPublishing(null))
          }}
        />
      ) : null}

      {deprecating ? (
        <ConfirmModal
          message={`Are you sure you want to deprecate ${deprecating.name}?`}
          confirmLabel="Deprecate"
          onCancel={() => setDeprecating(null)}
          onConfirm={() => {
            setStatus(deprecating.id, 'Deprecated', () => setDeprecating(null))
          }}
        />
      ) : null}
    </div>
  )
}

function ApiFormModal({
  title,
  submitLabel,
  initial,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  initial?: ApiFormValues
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ApiFormValues) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<ApiFormValues>({
    name: initial?.name ?? '',
    route: initial?.route ?? '',
    cost: initial?.cost ?? '',
    samplePayload: initial?.samplePayload ?? '',
    sampleRequest: initial?.sampleRequest ?? '',
    documentation: initial?.documentation ?? '',
  })
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onClose)

  const set = (key: keyof ApiFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const canAdvance =
    form.name.trim() !== '' && form.route.trim() !== '' && form.cost.trim() !== ''

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="api-form-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="api-form-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose} disabled={isSubmitting}>
            <CloseIcon />
          </button>
        </div>

        {step === 1 ? (
          <div className="modal-body">
            <div className="modal-field">
              <label>API Name</label>
              <input
                className="modal-input"
                placeholder="E.g. Vend Token"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label>Route URL</label>
              <input
                className="modal-input"
                placeholder="E.g. www.memmserve.com/vend-token"
                value={form.route}
                onChange={(e) => set('route', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label>Cost per Call (credits)</label>
              <input
                className="modal-input"
                inputMode="numeric"
                placeholder="E.g. 2"
                value={form.cost}
                onChange={(e) => set('cost', e.target.value)}
              />
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-neutral" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!canAdvance}
                onClick={() => canAdvance && setStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="modal-field">
              <label>Sample Payload</label>
              <textarea
                className="modal-input api-view-code"
                rows={5}
                placeholder={'{\n  "productId": "PROD-101"\n}'}
                value={form.samplePayload}
                onChange={(e) => set('samplePayload', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label>Sample Request</label>
              <textarea
                className="modal-input api-view-code"
                rows={5}
                placeholder={'{\n  "productId": "PROD-101"\n}'}
                value={form.sampleRequest}
                onChange={(e) => set('sampleRequest', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label>Documentation</label>
              <textarea
                className="modal-input"
                rows={8}
                placeholder="Describe how customers should use this API"
                value={form.documentation}
                onChange={(e) => set('documentation', e.target.value)}
              />
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-neutral" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </button>
              <button type="button" className="btn-primary" onClick={() => onSubmit(form)} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RowActions({
  isOpen,
  api,
  onToggle,
  onClose,
  onView,
  onEdit,
  onTogglePublication,
  onActivate,
  onDeprecate,
}: {
  isOpen: boolean
  api: AdminApi
  onToggle: () => void
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onTogglePublication: () => void
  onActivate: () => void
  onDeprecate: () => void
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
          <button type="button" className="row-menu-item" role="menuitem" onClick={onView}>
            <ClipboardIcon /> View API
          </button>
          <button type="button" className="row-menu-item" role="menuitem" onClick={onEdit}>
            <PencilIcon /> Edit API
          </button>
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onTogglePublication}
          >
            {api.publication === 'Published' ? (
              <>
                <CloudDownIcon /> Unpublish
              </>
            ) : (
              <>
                <CloudUpIcon /> Publish
              </>
            )}
          </button>
          {api.status === 'Active' ? (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onDeprecate}>
              <TrashIcon /> Deprecate API
            </button>
          ) : (
            <button type="button" className="row-menu-item" role="menuitem" onClick={onActivate}>
              <BadgeCheckIcon /> Activate API
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

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4.5V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v1" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function CloudUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19" />
      <path d="M12 18v-6m0 0-2.5 2.5M12 12l2.5 2.5" />
    </svg>
  )
}

function CloudDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19" />
      <path d="M12 12v6m0 0-2.5-2.5M12 18l2.5-2.5" />
    </svg>
  )
}

function BadgeCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

import { useDeferredValue, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDismiss } from '../../../../app/useDismiss'
import { useAnchoredMenu } from '../../../../app/useAnchoredMenu'
import { AsyncState } from '../../../../app/AsyncState'
import {
  MeterFormModal,
  type MeterFormField,
  type MeterFormValues,
} from '../../../../app/MeterFormModal'
import { useToast } from '../../../../app/toastContext'
import {
  formatAddedDate,
} from '../../../../app/adminMeters'
import {
  getMeterIntegrationError,
  useCreateMeterIntegration,
  useMeterIntegrations,
  type MeterIntegrationStatus,
} from '../../../../features/admin-meters/adminMeterQueries'

export const Route = createFileRoute('/admin/_admin/meter-integration/')({
  component: MeterIntegrationPage,
})

function MeterIntegrationPage() {
  const navigate = useNavigate()
  const createMeter = useCreateMeterIntegration()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MeterIntegrationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [integrateOpen, setIntegrateOpen] = useState(false)
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Partial<Record<MeterFormField, string>>
  >({})
  const deferredSearch = useDeferredValue(search.trim())
  const metersQuery = useMeterIntegrations({
    search: deferredSearch || undefined,
    status: status || undefined,
    page,
    limit: 20,
  })
  const meters = metersQuery.data?.items ?? []
  const pagination = metersQuery.data?.pagination

  const openIntegrateModal = () => {
    createMeter.reset()
    setCreateFieldErrors({})
    setIntegrateOpen(true)
  }

  const integrateMeter = async (data: MeterFormValues) => {
    setCreateFieldErrors({})

    try {
      const integration = await createMeter.mutateAsync({
        manufacturer: data.manufacturer,
        model: data.model,
        class: data.meterClass.toLowerCase().replaceAll('-', ' '),
        category: data.category.toLowerCase().replace('-', ''),
        protocol: data.protocol,
        authenticationType: data.authenticationType,
        password: data.password,
        ...(data.description ? { description: data.description } : {}),
      })

      setIntegrateOpen(false)
      showToast({
        title: 'Meter integrated',
        message: `${integration.manufacturer} ${integration.model} is now active.`,
        variant: 'success',
      })
    } catch (error) {
      const apiError = getMeterIntegrationError(error)
      const { class: meterClassError, ...fieldErrors } = apiError.fields
      const fieldMessage = [...new Set(Object.values(apiError.fields))].join(' ')
      setCreateFieldErrors({
        ...fieldErrors,
        ...(meterClassError ? { meterClass: meterClassError } : {}),
      })
      showToast({
        title: apiError.message,
        message: [fieldMessage, apiError.requestId ? `Request ID: ${apiError.requestId}` : '']
          .filter(Boolean)
          .join(' · ') || undefined,
        variant: 'error',
      })
    } finally {
      createMeter.reset()
    }
  }

  const goToMeter = (id: string) => {
    navigate({ to: '/admin/meter-integration/$meterId', params: { meterId: id } })
  }

  const isEmpty = !metersQuery.isPending && meters.length === 0

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Meter Integration</h1>
          <p className="dash-subtitle">
            Onboard your smart meter to enable secure remote communication and
            API integration.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openIntegrateModal}>
          Integrate Meter <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          Supported Meters
        </button>
      </div>

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search manufacturer or model..."
              aria-label="Search meters by manufacturer or model"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <SearchIcon />
          </div>
          <select
            className="filter-btn"
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as MeterIntegrationStatus | '')
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DEPRECATED">Deprecated</option>
          </select>
        </div>
      </div>

      <AsyncState
        isPending={metersQuery.isPending}
        error={metersQuery.error}
        onRetry={() => void metersQuery.refetch()}
      >
        {isEmpty ? (
          <div className="meter-empty">
            <p className="meter-empty-text">No meter integrations found.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll" aria-busy={metersQuery.isFetching}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input type="checkbox" aria-label="Select all rows" />
                    </th>
                    <th>S/N</th>
                    <th>Meter Manufacturer</th>
                    <th>Meter Model</th>
                    <th>Protocol</th>
                    <th>Authentication</th>
                    <th>OBIS Codes</th>
                    <th>Added By</th>
                    <th>Added Date</th>
                    <th>Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((meter, index) => (
                    <tr key={meter.id}>
                      <td className="col-check">
                        <input type="checkbox" aria-label={`Select meter ${index + 1}`} />
                      </td>
                      <td>
                        {String(
                          ((pagination?.page ?? page) - 1) *
                            (pagination?.limit ?? 20) +
                            index +
                            1,
                        ).padStart(2, '0')}
                      </td>
                      <td>{meter.manufacturer}</td>
                      <td>{meter.model}</td>
                      <td>{meter.protocol}</td>
                      <td>{meter.authenticationType}</td>
                      <td>{meter.obisCodeCount}</td>
                      <td>{meter.addedBy.name}</td>
                      <td>{formatAddedDate(new Date(meter.createdAt))}</td>
                      <td>
                        <span
                          className={`code-badge${meter.status === 'ACTIVE' ? ' is-ok' : ' is-error'}`}
                        >
                          {meter.status}
                        </span>
                      </td>
                      <td className="col-actions">
                        <RowActions
                          isOpen={openMenu === meter.id}
                          onToggle={() =>
                            setOpenMenu((prev) => (prev === meter.id ? null : meter.id))
                          }
                          onClose={() => setOpenMenu(null)}
                          onView={() => goToMeter(meter.id)}
                          onAddObis={() => goToMeter(meter.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Meter integration pagination">
              <button
                type="button"
                className="page-nav"
                disabled={(pagination?.page ?? page) <= 1 || metersQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="page-gap">
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                {' · '}{pagination?.total ?? meters.length} total
              </span>
              <button
                type="button"
                className="page-nav"
                disabled={
                  (pagination?.page ?? page) >= (pagination?.totalPages ?? 1) ||
                  metersQuery.isFetching
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </AsyncState>

      {integrateOpen ? (
        <MeterFormModal
          title="Integrate Meter"
          submitLabel="Integrate"
          isSubmitting={createMeter.isPending}
          fieldErrors={createFieldErrors}
          onFieldChange={(field) => {
            setCreateFieldErrors((current) => {
              if (!current[field]) return current
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onClose={() => {
            if (!createMeter.isPending) setIntegrateOpen(false)
          }}
          onSubmit={integrateMeter}
        />
      ) : null}

    </div>
  )
}

function RowActions({
  isOpen,
  onToggle,
  onClose,
  onView,
  onAddObis,
}: {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onView: () => void
  onAddObis: () => void
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
            <ClipboardIcon /> View Meter
          </button>
          <button type="button" className="row-menu-item" role="menuitem" onClick={onAddObis}>
            <PlusCircleIcon /> Add OBIS Code
          </button>
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

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
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

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

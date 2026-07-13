import type { ReactNode } from 'react'
import { getApiErrorMessage } from '../lib/api/client'

export function AsyncState({
  isPending,
  error,
  onRetry,
  children,
}: {
  isPending: boolean
  error: unknown
  onRetry?: () => void
  children: ReactNode
}) {
  if (isPending) {
    return (
      <div className="async-state" role="status" aria-live="polite">
        <span className="async-spinner" aria-hidden="true" />
        <p>Loading data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="async-state is-error" role="alert">
        <p>{getApiErrorMessage(error)}</p>
        {onRetry ? (
          <button type="button" className="btn-neutral" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    )
  }

  return children
}

export function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p className="mutation-error" role="alert">
      {getApiErrorMessage(error)}
    </p>
  )
}

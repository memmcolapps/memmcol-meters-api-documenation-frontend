import type { ErrorComponentProps } from '@tanstack/react-router'

/**
 * Last line of defence for a render that threw — most often a payload that
 * broke its declared shape. Without this the router swaps the entire document
 * for its bare-bones fallback; with it the failure stays inside the route's
 * outlet, so the nav and sidebar keep working and the user can retry the one
 * screen that broke.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="dash">
      <div className="async-state is-error" role="alert">
        <p>Something went wrong while loading this page.</p>
        {import.meta.env.DEV && error instanceof Error ? (
          <pre className="route-error-detail">{error.message}</pre>
        ) : null}
        <button type="button" className="btn-neutral" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  )
}

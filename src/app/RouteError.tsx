import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

/**
 * Last line of defence for a render that threw — most often a payload that
 * broke its declared shape. Instead of retrying the broken screen, the
 * "Try again" button sends the user back to the login page so they can
 * start fresh.
 */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const pathname = router.state.location.pathname

  if (import.meta.env.DEV) console.error(error)

  const toLogin = () => {
    const to = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    if (pathname === to) return
    void router.navigate({ to, replace: true })
  }

  return (
    <div className="dash">
      <div className="async-state is-error" role="alert">
        <p>Something went wrong while loading this page.</p>
        {import.meta.env.DEV && error instanceof Error ? (
          <pre className="route-error-detail">{error.message}</pre>
        ) : null}
        <button type="button" className="btn-neutral" onClick={toLogin}>
          Try again
        </button>
      </div>
    </div>
  )
}

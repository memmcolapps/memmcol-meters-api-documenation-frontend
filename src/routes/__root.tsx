import { Suspense, lazy } from 'react'
import {
  Link,
  Outlet,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { Logo } from '../app/Logo'

// Dev-only: stripped from the production bundle so the floating
// devtools badge never ships to users.
const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isMarketing = pathname === '/' || pathname.startsWith('/docs')

  if (!isMarketing) {
    return (
      <>
        <Outlet />
        <Suspense>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
      </>
    )
  }

  return (
    <div className="site">
      <header className="site-nav">
        <Link to="/" className="site-brand" aria-label="Momas Memmcol home">
          <Logo />
        </Link>
        <nav className="site-nav-links" aria-label="Primary navigation">
          <Link to="/login" className="button primary">
            Sign In
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <Link to="/" className="site-footer-brand" aria-label="Momas Memmcol home">
          <Logo />
        </Link>
        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link to="/">Docs</Link>
          <Link to="/login">Sign In</Link>
        </nav>
        <p className="site-footer-copy">© 2026, Powered by MEMMCOL</p>
      </footer>

      <Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </div>
  )
}

import {
  Link,
  Outlet,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Logo } from '../app/Logo'

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
        <TanStackRouterDevtools position="bottom-right" />
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
        <p className="site-footer-copy">© 2025, Powered by MEMMCOL</p>
      </footer>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}

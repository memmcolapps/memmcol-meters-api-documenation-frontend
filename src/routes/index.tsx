import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="page hero-page">
      <div className="eyebrow">Pure frontend SPA</div>
      <h1>Momas Meters documentation</h1>
      <p className="lede">
        A TanStack Router powered frontend is ready for product docs, meter
        guides, support flows, and internal reference pages.
      </p>
      <div className="actions">
        <Link to="/docs" className="button primary">
          Browse docs
        </Link>
        <a
          className="button secondary"
          href="https://tanstack.com/router/latest"
          target="_blank"
          rel="noreferrer"
        >
          TanStack Router
        </a>
      </div>
    </section>
  )
}

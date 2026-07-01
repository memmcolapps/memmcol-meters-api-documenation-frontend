import { Link, createFileRoute } from '@tanstack/react-router'
import { findApi } from '../app/apis'

export const Route = createFileRoute('/docs/$slug')({
  component: DocPage,
})

const humanize = (slug: string) =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

function DocPage() {
  const { slug } = Route.useParams()
  const api = findApi(slug)
  const title = api?.name ?? humanize(slug)

  return (
    <div className="doc-detail">
      <Link to="/" className="doc-back">
        ← Back to documentation
      </Link>
      <h1 className="doc-detail-title">{title}</h1>
      {api ? <p className="doc-detail-lede">{api.blurb}</p> : null}

      {api?.sections?.length ? (
        <div className="doc-detail-body">
          {api.sections.map((section) => (
            <section className="doc-section" key={section.heading}>
              <h2 className="doc-section-heading">{section.heading}</h2>
              <p className="doc-section-body">{section.body}</p>
            </section>
          ))}
        </div>
      ) : (
        <div className="doc-detail-placeholder">
          <p>Documentation for this section is coming soon.</p>
        </div>
      )}
    </div>
  )
}

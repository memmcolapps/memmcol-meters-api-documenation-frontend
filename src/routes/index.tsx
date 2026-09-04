import { Link, createFileRoute } from '@tanstack/react-router'
import { AsyncState } from '../app/AsyncState'
import { guides } from '../app/apis'
import { usePublicApis } from '../features/public-apis/publicApiQueries'

export const Route = createFileRoute('/')({
  component: DocsHome,
})

// Single source of truth: the strip is derived from the guides that back the
// /docs/<slug> pages, so a card can never point at a page with no content.
const gettingStarted = guides.map((guide) => ({
  slug: guide.slug,
  label: guide.name,
  hint: guide.hint ?? guide.blurb,
}))

function DocsHome() {
  const apisQuery = usePublicApis()

  const apis = apisQuery.data ?? []
  const grouped = apis.reduce<Record<string, typeof apis>>((acc, api) => {
    const category = api.category?.trim() || 'OTHER'
    ;(acc[category] ||= []).push(api)
    return acc
  }, {})
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => (a.documentationPosition ?? Infinity) - (b.documentationPosition ?? Infinity))
  }

  return (
    <div className="docs-home">
      <section className="docs-intro">
        <div className="site-eyebrow">Documentation</div>
        <h1 className="docs-intro-title">Momas Meters API Documentation</h1>
        <p className="docs-intro-lede">
          Reference and guides for integrating with the Momas metering platform.
          Browse the APIs below to read, manage, and communicate with meters. New
          here? Start with the getting-started guides.
        </p>
      </section>

      <section className="site-section" aria-labelledby="gs-title">
        <div className="site-section-head">
          <h2 id="gs-title" className="site-section-title">
            Getting started
          </h2>
        </div>
        <div className="gs-strip">
          {gettingStarted.map((item) => (
            <Link
              key={item.slug}
              to="/docs/$slug"
              params={{ slug: item.slug }}
              className="gs-card"
            >
              <span className="gs-card-label">{item.label}</span>
              <span className="gs-card-hint">{item.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="apis-title">
        <div className="site-section-head">
          <h2 id="apis-title" className="site-section-title">
            APIs
          </h2>
          <p className="site-section-sub">
            Each API is documented as a set of REST endpoints.
          </p>
        </div>

        <AsyncState
          isPending={apisQuery.isPending}
          error={apisQuery.error}
          onRetry={() => void apisQuery.refetch()}
        >
          {apis.length ? (
            Object.entries(grouped).map(([category, categoryApis]) => (
              <div className="api-category" key={category}>
                <h3 className="api-category-title">
                  {category === 'HES_AMI'
                    ? 'HES/AMI'
                    : category === 'VENDING'
                      ? 'Vending'
                      : category}
                </h3>
                <div className="api-grid" aria-busy={apisQuery.isFetching}>
                  {categoryApis.map((api) => (
                    <Link
                      key={api.id}
                      to="/docs/$slug"
                      params={{ slug: api.id }}
                      className="api-card"
                    >
                      <span className="api-card-icon" aria-hidden="true">
                        <ApiIcon />
                      </span>
                      <span className="api-card-title">{api.name}</span>
                      <span className="api-card-blurb">{api.summary}</span>
                      <span className="api-card-link">Read docs →</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="doc-detail-placeholder">
              <p>No APIs are published yet.</p>
            </div>
          )}
        </AsyncState>
      </section>
    </div>
  )
}

function ApiIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M7 12h.01M12 12h.01M17 12h.01" />
    </svg>
  )
}

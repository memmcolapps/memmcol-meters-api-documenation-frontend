import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

const sections = [
  'Installation and commissioning',
  'Meter specifications',
  'Troubleshooting',
  'Customer support workflows',
]

function DocsPage() {
  return (
    <section className="page docs-page">
      <div>
        <div className="eyebrow">Documentation index</div>
        <h1>Start organizing meter knowledge here.</h1>
        <p className="lede">
          Replace these placeholders with real guides as the documentation grows.
        </p>
      </div>

      <div className="doc-list">
        {sections.map((section) => (
          <article className="doc-card" key={section}>
            <h2>{section}</h2>
            <p>Draft page ready for content, tables, diagrams, and links.</p>
          </article>
        ))}
      </div>
    </section>
  )
}

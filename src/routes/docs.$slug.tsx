import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AsyncState } from "../app/AsyncState";
import { guides } from "../app/apis";
import {
  usePublicApi,
  type PublicApi,
} from "../features/public-apis/publicApiQueries";
import { usePublicMeterIntegrations } from "../features/public-meter-integrations/publicMeterIntegrationQueries";
import { ApiError } from "../lib/api/client";
import { formatDateTime, formatJson, formatStatusLabel } from "../lib/format";

export const Route = createFileRoute("/docs/$slug")({
  component: DocPage,
});

const humanize = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function DocPage() {
  const { slug } = Route.useParams();
  const guide = guides.find((item) => item.slug === slug);
  const apiQuery = usePublicApi(slug, !guide);

  if (guide?.slug === "supported-meters") {
    return <SupportedMetersGuide guide={guide} />;
  }
  if (guide) return <GuidePage guide={guide} />;

  return (
    <div className="doc-detail">
      <Link to="/" className="doc-back">
        ← Back to documentation
      </Link>
      <AsyncState
        isPending={apiQuery.isPending}
        error={
          apiQuery.error instanceof ApiError && apiQuery.error.status === 404
            ? new Error("This API reference could not be found.")
            : apiQuery.error
        }
        onRetry={() => void apiQuery.refetch()}
      >
        {apiQuery.data ? <ApiReference api={apiQuery.data} /> : null}
      </AsyncState>
    </div>
  );
}

function SupportedMetersGuide({ guide }: { guide: (typeof guides)[number] }) {
  const [page, setPage] = useState(1);
  const metersQuery = usePublicMeterIntegrations({ page, limit: 100 });
  const meters = metersQuery.data?.items ?? [];
  const pagination = metersQuery.data?.pagination;
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const [modelsSection, contactSection] = guide.sections ?? [];

  return (
    <div className="doc-detail">
      <Link to="/" className="doc-back">
        ← Back to documentation
      </Link>
      <h1 className="doc-detail-title">{guide.name}</h1>
      <p className="doc-detail-lede">{guide.blurb}</p>

      <div className="doc-detail-body">
        <section className="doc-section">
          <h2 className="doc-section-heading">
            {modelsSection?.heading ?? "Currently Supported Models"}
          </h2>
          <p className="doc-section-body">
            {modelsSection?.body ??
              "The meters below are fully integrated and ready to onboard."}
          </p>

          <AsyncState
            isPending={metersQuery.isPending}
            error={metersQuery.error}
            onRetry={() => void metersQuery.refetch()}
          >
            {meters.length ? (
              <>
                <div
                  className="doc-table-scroll"
                  aria-busy={metersQuery.isFetching}
                >
                  <table className="doc-section-table">
                    <thead>
                      <tr>
                        <th>Manufacturer</th>
                        <th>Model</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meters.map((meter) => (
                        <tr key={meter.id}>
                          <td>{meter.manufacturer}</td>
                          <td>{meter.model}</td>
                          <td>{formatStatusLabel(meter.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 ? (
                  <nav
                    className="doc-pagination"
                    aria-label="Supported meters pagination"
                  >
                    <button
                      type="button"
                      disabled={currentPage <= 1 || metersQuery.isFetching}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {totalPages}
                      {" · "}
                      {pagination?.total ?? meters.length} total
                    </span>
                    <button
                      type="button"
                      disabled={
                        currentPage >= totalPages || metersQuery.isFetching
                      }
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </button>
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="doc-detail-placeholder">
                <p>No supported meters are available yet.</p>
              </div>
            )}
          </AsyncState>
        </section>

        {contactSection ? (
          <section className="doc-section">
            <h2 className="doc-section-heading">{contactSection.heading}</h2>
            <p className="doc-section-body">{contactSection.body}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function GuidePage({ guide }: { guide: (typeof guides)[number] }) {
  const title = guide.name ?? humanize(guide.slug);

  return (
    <div className="doc-detail">
      <Link to="/" className="doc-back">
        ← Back to documentation
      </Link>
      <h1 className="doc-detail-title">{title}</h1>
      <p className="doc-detail-lede">{guide.blurb}</p>

      {guide.sections?.length ? (
        <div className="doc-detail-body">
          {guide.sections.map((section) => (
            <section className="doc-section" key={section.heading}>
              <h2 className="doc-section-heading">{section.heading}</h2>
              <p className="doc-section-body">{section.body}</p>
              {section.code ? (
                <pre className="api-reference-code">
                  <code>{section.code}</code>
                </pre>
              ) : null}
              {section.items?.length ? (
                <ul className="doc-section-list">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.table ? (
                <table className="doc-section-table">
                  <thead>
                    <tr>
                      {section.table.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row) => (
                      <tr key={row.join("|")}>
                        {row.map((cell, i) => (
                          <td key={section.table!.columns[i] ?? i}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <div className="doc-detail-placeholder">
          <p>Documentation for this section is coming soon.</p>
        </div>
      )}
    </div>
  );
}

function ApiReference({ api }: { api: PublicApi }) {
  const documentation = api.documentation
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <h1 className="doc-detail-title">{api.name}</h1>

      <dl className="api-reference-meta">
        <div>
          <dt>Route</dt>
          <dd>
            <code>{api.route}</code>
          </dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>{api.cost}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDateTime(api.updatedAt)}</dd>
        </div>
      </dl>

      <div className="doc-detail-body">
        <section className="doc-section">
          <h2 className="doc-section-heading">Documentation</h2>
          {documentation.map((paragraph, index) => (
            <p
              className="doc-section-body api-reference-documentation"
              key={`${index}-${paragraph.slice(0, 24)}`}
            >
              {paragraph}
            </p>
          ))}
        </section>

        <SampleBlock title="Sample Payload" value={api.samplePayload} />
        <SampleBlock title="Sample Response" value={api.sampleResponse} />
      </div>
    </>
  );
}

function SampleBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="doc-section">
      <h2 className="doc-section-heading">{title}</h2>
      <pre className="api-reference-code">
        <code>{formatJson(value)}</code>
      </pre>
    </section>
  );
}

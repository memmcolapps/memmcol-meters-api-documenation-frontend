import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AsyncState } from "../../../../app/AsyncState";
import { useToast } from "../../../../app/toastContext";
import { PLACEHOLDER, formatJson } from "../../../../lib/format";
import {
  getApiPublicationError,
  getApiUpdateError,
  useAdminApi,
  useChangeApiPublication,
  useUpdateApiService,
  type AdminApi,
  type AdminApiPublication,
} from "../../../../features/admin-apis";

type ApiEditableField =
  | "name"
  | "route"
  | "cost"
  | "samplePayload"
  | "sampleResponse"
  | "documentation";

export const Route = createFileRoute("/admin/_admin/api-management/$apiId")({
  component: ApiViewPage,
});

function ApiViewPage() {
  const { apiId } = Route.useParams();
  const apiQuery = useAdminApi(apiId);

  return (
    <AsyncState
      isPending={apiQuery.isPending}
      error={apiQuery.error}
      onRetry={() => void apiQuery.refetch()}
    >
      {apiQuery.data ? <ApiView api={apiQuery.data} /> : null}
    </AsyncState>
  );
}

type ApiDraft = Record<ApiEditableField, string>;

function createApiDraft(api: AdminApi): ApiDraft {
  return {
    name: api.name,
    route: api.route,
    cost: String(api.cost),
    samplePayload: api.samplePayload,
    sampleResponse: api.sampleResponse,
    documentation: api.documentation,
  };
}

function ApiView({ api }: { api: AdminApi }) {
  const { showToast } = useToast();
  const changePublication = useChangeApiPublication();
  const updateApi = useUpdateApiService();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ApiDraft>(() => createApiDraft(api));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ApiEditableField, string>>
  >({});

  const set = (key: ApiEditableField, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggleEdit = async () => {
    if (!editing) {
      setDraft(createApiDraft(api));
      setFieldErrors({});
      setEditing(true);
      return;
    }

    const cost = Number(draft.cost);
    if (!Number.isFinite(cost)) {
      setFieldErrors({ cost: "Cost must be a valid number." });
      return;
    }

    setFieldErrors({});
    try {
      const updatedApi = await updateApi.mutateAsync({
        apiId: api.id,
        name: draft.name,
        route: draft.route,
        cost,
        samplePayload: draft.samplePayload,
        sampleResponse: draft.sampleResponse,
        documentation: draft.documentation,
      });
      setEditing(false);
      showToast({
        title: "API updated",
        message: `${updatedApi.name} was updated successfully.`,
        variant: "success",
      });
    } catch (error) {
      const apiError = getApiUpdateError(error);
      const fields = apiError.fields as Partial<
        Record<ApiEditableField, string>
      >;
      setFieldErrors(fields);
      showToast({
        title: apiError.message,
        message:
          [
            [...new Set(Object.values(fields))].join(" "),
            apiError.requestId ? `Request ID: ${apiError.requestId}` : "",
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
        variant: "error",
      });
    }
  };

  const togglePublication = async () => {
    const publication: AdminApiPublication =
      api.publication === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";

    try {
      await changePublication.mutateAsync({
        apiId: api.id,
        publication,
      });
      showToast({
        title:
          publication === "PUBLISHED" ? "API published" : "API unpublished",
        message: `${api.name} is now ${publication.toLowerCase()}.`,
        variant: "success",
      });
    } catch (error) {
      const apiError = getApiPublicationError(error);
      const fieldMessage = [...new Set(Object.values(apiError.fields))].join(
        " ",
      );
      showToast({
        title: apiError.message,
        message:
          [
            fieldMessage,
            apiError.requestId ? `Request ID: ${apiError.requestId}` : "",
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
        variant: "error",
      });
    }
  };

  const shown = editing ? draft : createApiDraft(api);

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">API Management</h1>
          <p className="dash-subtitle">
            Create, publish and manage API services available to customers.
          </p>
        </div>
      </header>

      <div className="dash-tabs" role="tablist">
        <button
          type="button"
          className="dash-tab is-active"
          role="tab"
          aria-selected="true"
        >
          APIs
        </button>
      </div>

      <div className="api-view-actions">
        <button
          type="button"
          className={editing ? "btn-primary" : "btn-neutral"}
          disabled={updateApi.isPending}
          onClick={() => void toggleEdit()}
        >
          {updateApi.isPending ? "Please wait…" : editing ? "Save" : "Edit"}
        </button>
        <button
          type="button"
          className="btn-warn-outline"
          disabled={changePublication.isPending || updateApi.isPending}
          onClick={() => void togglePublication()}
        >
          {changePublication.isPending
            ? "Please wait…"
            : api.publication === "PUBLISHED"
              ? "Unpublish"
              : "Publish"}
        </button>
      </div>

      <div className="api-view">
        <div className="modal-field">
          <label>API Name</label>
          <input
            className="modal-input"
            value={shown.name}
            readOnly={!editing}
            disabled={updateApi.isPending}
            aria-invalid={editing && Boolean(fieldErrors.name)}
            onChange={(e) => set("name", e.target.value)}
          />
          {editing && fieldErrors.name ? (
            <span className="modal-field-error" role="alert">
              {fieldErrors.name}
            </span>
          ) : null}
        </div>

        <div className="modal-field">
          <label>Route URL</label>
          <input
            className="modal-input"
            value={shown.route}
            readOnly={!editing}
            disabled={updateApi.isPending}
            aria-invalid={editing && Boolean(fieldErrors.route)}
            onChange={(e) => set("route", e.target.value)}
          />
          {editing && fieldErrors.route ? (
            <span className="modal-field-error" role="alert">
              {fieldErrors.route}
            </span>
          ) : null}
        </div>

        <div className="modal-field">
          <label>Cost per Call (credits)</label>
          <input
            className="modal-input"
            value={String(shown.cost)}
            readOnly={!editing}
            disabled={updateApi.isPending}
            aria-invalid={editing && Boolean(fieldErrors.cost)}
            onChange={(e) => set("cost", e.target.value)}
          />
          {editing && fieldErrors.cost ? (
            <span className="modal-field-error" role="alert">
              {fieldErrors.cost}
            </span>
          ) : null}
        </div>

        <JsonField
          label="Sample Payload"
          value={shown.samplePayload}
          editing={editing}
          disabled={updateApi.isPending}
          error={editing ? fieldErrors.samplePayload : undefined}
          onChange={(value) => set("samplePayload", value)}
        />

        <JsonField
          label="Sample Response"
          value={shown.sampleResponse}
          editing={editing}
          disabled={updateApi.isPending}
          error={editing ? fieldErrors.sampleResponse : undefined}
          onChange={(value) => set("sampleResponse", value)}
        />

        <div className="modal-field api-view-docs-field">
          <label>Documentation</label>
          {editing ? (
            <textarea
              className="modal-input"
              rows={12}
              value={draft.documentation}
              disabled={updateApi.isPending}
              aria-invalid={Boolean(fieldErrors.documentation)}
              onChange={(e) => set("documentation", e.target.value)}
            />
          ) : (
            <div className="api-view-docs">
              {api.documentation.split("\n\n").map((block, blockIndex) => (
                <p key={blockIndex}>
                  {block.split("\n").map((line, lineIndex, lines) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < lines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}
          {editing && fieldErrors.documentation ? (
            <span className="modal-field-error" role="alert">
              {fieldErrors.documentation}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Sample payload and response are JSON, so they are shown as an indented code
 * block when reading and re-indented on blur when editing.
 */
function JsonField({
  label,
  value,
  editing,
  disabled,
  error,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  disabled: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="modal-field">
      <label>{label}</label>
      {editing ? (
        <textarea
          className="modal-input api-view-code"
          rows={8}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onChange(formatJson(e.target.value))}
        />
      ) : (
        <pre className="api-code-block">
          <code>{formatJson(value) || PLACEHOLDER}</code>
        </pre>
      )}
      {error ? (
        <span className="modal-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDismiss } from "../../../../app/useDismiss";
import { useAnchoredMenu } from "../../../../app/useAnchoredMenu";
import { ConfirmModal } from "../../../../app/ConfirmModal";
import { useToast } from "../../../../app/toastContext";
import { formatJson } from "../../../../lib/format";
import {
  getApiPublicationError,
  getApiStatusError,
  getApiUpdateError,
  useAdminApis,
  useChangeApiPublication,
  useChangeApiStatus,
  useCreateAdminApi,
  useUpdateApiService,
  type AdminApi,
  type AdminApiCategory,
  type AdminApiStatus,
  type CreateAdminApiInput,
  type SortOrder,
} from "../../../../features/admin-apis";

type ApiFormValues = {
  name: string;
  route: string;
  cost: string;
  category: AdminApiCategory;
  samplePayload: string;
  sampleResponse: string;
  documentation: string;
  documentationPosition: string;
};

type FormModalState = { mode: "add" } | { mode: "edit"; api: AdminApi };
type ApiStatusField = "status" | "reason";
type ApiFormField = keyof ApiFormValues;

// FILTER & SORT
type StatusType = "ACTIVE" | "DEPRECATED";
type PublicationType = "PUBLISHED" | "UNPUBLISHED";

type SortByType = "name" | "cost" | "createdAt" | "updatedAt";
type SortOrderType = "asc" | "desc";

export const Route = createFileRoute("/admin/_admin/api-management/")({
  component: ApiManagementPage,
});

function ApiManagementPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusType | never>();
  const [publication, setPublication] = useState<PublicationType | never>();
  const [sortBy, setSortBy] = useState<SortByType | never>();
  const [sortOrder, setSortOrder] = useState<SortOrderType | never>();
  const { data, isLoading } = useAdminApis({
    search: search.trim() || undefined,
    status: status || undefined,
    publication: publication || undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
    page,
    limit: 20,
  });
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const positionQuery = useAdminApis({
    status: "ACTIVE",
    limit: 100,
  });
  const activeCount =
    positionQuery.data?.items.filter((api) => api.status === "ACTIVE").length ??
    0;
  const createApi = useCreateAdminApi();
  const updateApi = useUpdateApiService();
  const changePublication = useChangeApiPublication();
  const changeStatus = useChangeApiStatus();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [publishing, setPublishing] = useState<AdminApi | null>(null);
  const [deprecating, setDeprecating] = useState<AdminApi | null>(null);
  const [statusFieldErrors, setStatusFieldErrors] = useState<
    Partial<Record<ApiStatusField, string>>
  >({});
  const [formFieldErrors, setFormFieldErrors] = useState<
    Partial<Record<ApiFormField, string>>
  >({});

  const goToApi = (id: string) => {
    navigate({ to: "/admin/api-management/$apiId", params: { apiId: id } });
  };

  const updatePublication = async (api: AdminApi) => {
    const publication =
      api.publication === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";

    try {
      await changePublication.mutateAsync({
        apiId: api.id,
        publication,
      });
      setOpenMenu(null);
      setPublishing(null);
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

  const updateStatus = async (
    api: AdminApi,
    status: AdminApiStatus,
    reason?: string,
  ) => {
    if (status === "DEPRECATED" && !reason?.trim()) {
      setStatusFieldErrors({
        reason: "Reason is required when deprecating an API service.",
      });
      return;
    }

    setStatusFieldErrors({});
    try {
      await changeStatus.mutateAsync({
        apiId: api.id,
        status,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      });
      setOpenMenu(null);
      setDeprecating(null);
      showToast({
        title: status === "ACTIVE" ? "API activated" : "API deprecated",
        message:
          status === "ACTIVE"
            ? `${api.name} is active and remains unpublished.`
            : `${api.name} was deprecated and unpublished.`,
        variant: "success",
      });
    } catch (error) {
      const apiError = getApiStatusError(error);
      const fields = apiError.fields as Partial<Record<ApiStatusField, string>>;
      setStatusFieldErrors(fields);
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

  const submitApiForm = async (values: ApiFormValues) => {
    if (!formModal) return;

    const cost = Number(values.cost);
    if (!Number.isFinite(cost)) {
      setFormFieldErrors({ cost: "Cost must be a valid number." });
      return;
    }

    const payload: CreateAdminApiInput = {
      name: values.name,
      route: values.route,
      cost,
      category: values.category,
      samplePayload: values.samplePayload,
      sampleResponse: values.sampleResponse,
      documentation: values.documentation,
      documentationPosition: values.documentationPosition,
    };

    setFormFieldErrors({});
    try {
      if (formModal.mode === "add") {
        const createdApi = await createApi.mutateAsync(payload);
        showToast({
          title: "API created",
          message: `${createdApi.name} was created successfully.`,
          variant: "success",
        });
      } else {
        const updatedApi = await updateApi.mutateAsync({
          apiId: formModal.api.id,
          ...payload,
        });
        showToast({
          title: "API updated",
          message: `${updatedApi.name} was updated successfully.`,
          variant: "success",
        });
      }
      setFormModal(null);
    } catch (error) {
      const apiError = getApiUpdateError(error);
      const fields = apiError.fields as Partial<Record<ApiFormField, string>>;
      setFormFieldErrors(fields);
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

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">API Management</h1>
          <p className="dash-subtitle">
            Create, publish and manage API services available to customers.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setFormFieldErrors({});
            setFormModal({ mode: "add" });
          }}
        >
          Add New API <PlusIcon />
        </button>
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

      <div className="dash-toolbar">
        <div className="dash-filters">
          <div className="table-search">
            <input
              type="search"
              placeholder="Search API..."
              aria-label="Search APIs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <SearchIcon />
          </div>
          <select
            className="filter-btn"
            aria-label="Filter APIs by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusType | never);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DEPRECATED">Deprecated</option>
          </select>
          <select
            className="filter-btn"
            aria-label="Filter APIs by publication"
            value={publication}
            onChange={(event) => {
              setPublication(event.target.value as PublicationType | never);
              setPage(1);
            }}
          >
            <option value="">All Publications</option>
            <option value="PUBLISHED">Published</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>
          <select
            className="filter-btn"
            aria-label="Sort APIs"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as SortByType | never);
              setPage(1);
            }}
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="name">Name</option>
            <option value="cost">Cost</option>
          </select>
          <select
            className="filter-btn"
            aria-label="Order APIs"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as SortOrder | never);
              setPage(1);
            }}
          >
            <option value="">Order By</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          {/* <button type="button" className="filter-btn">
            Filter <ChevronRightIcon />
          </button>
          <button type="button" className="filter-btn">
            Sort <SortIcon />
          </button> */}
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-check">
                <input type="checkbox" aria-label="Select all rows" />
              </th>
              <th>S/N</th>
              <th>API Name</th>
              <th>Route URL</th>
              <th>Category</th>
              <th>Added By</th>
              <th>Added Date</th>
              <th>Status</th>
              <th>Publication</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  Loading APIs...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No APIs found.
                </td>
              </tr>
            ) : (
              items.map((api, index) => (
                <tr key={api.id}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      aria-label={`Select API ${index + 1}`}
                    />
                  </td>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>{api.name}</td>
                  <td className="cell-truncate">{api.route}</td>
                  <td>
                    <span className="code-badge">
                      {api.category === "HES_AMI" ? "HES/AMI" : "Vending"}
                    </span>
                  </td>
                  <td>{api.addedBy.name}</td>
                  <td>{new Date(api.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`code-badge${api.status === "ACTIVE" ? " is-ok" : " is-error"}`}
                    >
                      {api.status === "ACTIVE" ? "Active" : "Deprecated"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`code-badge${api.publication === "PUBLISHED" ? " is-ok" : " is-warn"}`}
                    >
                      {api.publication === "PUBLISHED"
                        ? "Published"
                        : "Unpublished"}
                    </span>
                  </td>
                  <td className="col-actions">
                    <RowActions
                      isOpen={openMenu === api.id}
                      api={api}
                      onToggle={() =>
                        setOpenMenu((prev) => (prev === api.id ? null : api.id))
                      }
                      onClose={() => setOpenMenu(null)}
                      onView={() => goToApi(api.id)}
                      onEdit={() => {
                        setOpenMenu(null);
                        updateApi.reset();
                        setFormFieldErrors({});
                        setFormModal({ mode: "edit", api });
                      }}
                      onTogglePublication={() => {
                        setOpenMenu(null);
                        changePublication.reset();
                        setPublishing(api);
                      }}
                      onActivate={() => {
                        setOpenMenu(null);
                        void updateStatus(api, "ACTIVE");
                      }}
                      onDeprecate={() => {
                        setOpenMenu(null);
                        changeStatus.reset();
                        setStatusFieldErrors({});
                        setDeprecating(api);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="pagination">
          <button
            type="button"
            className="btn-neutral"
            disabled={pagination.page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total)
          </span>
          <button
            type="button"
            className="btn-neutral"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      {formModal ? (
        <ApiFormModal
          title={formModal.mode === "add" ? "Add API" : "Edit API"}
          submitLabel={formModal.mode === "add" ? "Add API" : "Save Changes"}
          positionCount={
            (activeCount || 1) + (formModal.mode === "add" ? 1 : 0)
          }
          initial={
            formModal.mode === "edit"
              ? {
                  name: formModal.api.name,
                  route: formModal.api.route,
                  cost: String(formModal.api.cost),
                  category: formModal.api.category,
                  samplePayload: formModal.api.samplePayload,
                  sampleResponse: formModal.api.sampleResponse,
                  documentation: formModal.api.documentation,
                  documentationPosition: formModal.api.documentationPosition,
                }
              : undefined
          }
          isSubmitting={
            formModal.mode === "add" ? createApi.isPending : updateApi.isPending
          }
          fieldErrors={formFieldErrors}
          onFieldChange={(field) => {
            setFormFieldErrors((current) => {
              if (!current[field]) return current;
              const next = { ...current };
              delete next[field];
              return next;
            });
          }}
          onClose={() => {
            if (!createApi.isPending && !updateApi.isPending)
              setFormModal(null);
          }}
          onSubmit={(values) => void submitApiForm(values)}
        />
      ) : null}

      {publishing ? (
        <ConfirmModal
          tone={publishing.publication === "PUBLISHED" ? "danger" : "primary"}
          message={`Are you sure you want to ${
            publishing.publication === "PUBLISHED" ? "unpublish" : "publish"
          } API?`}
          confirmLabel={
            publishing.publication === "PUBLISHED" ? "Unpublish" : "Publish"
          }
          isSubmitting={changePublication.isPending}
          onCancel={() => {
            if (!changePublication.isPending) setPublishing(null);
          }}
          onConfirm={() => void updatePublication(publishing)}
        />
      ) : null}

      {deprecating ? (
        <DeprecateApiModal
          api={deprecating}
          isSubmitting={changeStatus.isPending}
          fieldErrors={statusFieldErrors}
          onReasonChange={() => {
            setStatusFieldErrors((current) => {
              if (!current.reason) return current;
              const next = { ...current };
              delete next.reason;
              return next;
            });
          }}
          onCancel={() => {
            if (!changeStatus.isPending) setDeprecating(null);
          }}
          onConfirm={(reason) =>
            void updateStatus(deprecating, "DEPRECATED", reason)
          }
        />
      ) : null}
    </div>
  );
}

function DeprecateApiModal({
  api,
  isSubmitting,
  fieldErrors,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  api: AdminApi;
  isSubmitting: boolean;
  fieldErrors: Partial<Record<ApiStatusField, string>>;
  onReasonChange: () => void;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  useDismiss(modalRef, () => {
    if (!isSubmitting) onCancel();
  });

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deprecate-api-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="deprecate-api-title" className="modal-title">
            Deprecate API
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          {fieldErrors.status ? (
            <p className="modal-field-error" role="alert">
              {fieldErrors.status}
            </p>
          ) : null}
          <p className="confirm-message">
            Deprecating {api.name} will automatically unpublish it.
          </p>
          <div className="modal-field">
            <label htmlFor="api-deprecation-reason">
              Reason <span className="req">*</span>
            </label>
            <textarea
              id="api-deprecation-reason"
              className="modal-input"
              rows={4}
              placeholder="E.g. Replaced by version 2."
              value={reason}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.reason)}
              aria-describedby={
                fieldErrors.reason ? "api-deprecation-reason-error" : undefined
              }
              onChange={(event) => {
                setReason(event.target.value);
                onReasonChange();
              }}
            />
            {fieldErrors.reason ? (
              <p
                id="api-deprecation-reason-error"
                className="modal-field-error"
                role="alert"
              >
                {fieldErrors.reason}
              </p>
            ) : null}
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn-neutral"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger-solid"
              disabled={isSubmitting}
              onClick={() => onConfirm(reason)}
            >
              {isSubmitting ? "Please wait…" : "Deprecate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiFormModal({
  title,
  submitLabel,
  initial,
  isSubmitting,
  fieldErrors,
  onFieldChange,
  onClose,
  onSubmit,
  positionCount,
}: {
  title: string;
  submitLabel: string;
  initial?: ApiFormValues;
  isSubmitting: boolean;
  fieldErrors: Partial<Record<ApiFormField, string>>;
  onFieldChange: (field: ApiFormField) => void;
  onClose: () => void;
  onSubmit: (values: ApiFormValues) => void;
  positionCount: number;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<ApiFormValues>({
    name: initial?.name ?? "",
    route: initial?.route ?? "",
    cost: initial?.cost ?? "",
    category: initial?.category ?? "VENDING",
    samplePayload: formatJson(initial?.samplePayload),
    sampleResponse: formatJson(initial?.sampleResponse),
    documentation: initial?.documentation ?? "",
    documentationPosition: initial?.documentationPosition ?? "1",
  });
  const modalRef = useRef<HTMLDivElement>(null);
  useDismiss(modalRef, () => {
    if (!isSubmitting) onClose();
  });

  const positionTouched = useRef(Boolean(initial));

  useEffect(() => {
    if (fieldErrors.name || fieldErrors.route || fieldErrors.cost) setStep(1);
  }, [fieldErrors]);

  useEffect(() => {
    if (!positionTouched.current) {
      setForm((current) => ({
        ...current,
        documentationPosition: String(positionCount),
      }));
    }
  }, [positionCount]);

  const set = (key: ApiFormField, value: string) => {
    if (key === "documentationPosition") positionTouched.current = true;
    setForm((current) => ({ ...current, [key]: value }));
    onFieldChange(key);
  };

  const canAdvance =
    form.name.trim() !== "" &&
    form.route.trim() !== "" &&
    form.cost.trim() !== "";

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-form-title"
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="api-form-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {step === 1 ? (
          <div className="modal-body">
            <div className="modal-field">
              <label>API Name</label>
              <input
                className="modal-input"
                placeholder="E.g. Vend Token"
                value={form.name}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(e) => set("name", e.target.value)}
              />
              {fieldErrors.name ? (
                <span className="modal-field-error" role="alert">
                  {fieldErrors.name}
                </span>
              ) : null}
            </div>
            <div className="modal-field">
              <label>Route URL</label>
              <input
                className="modal-input"
                placeholder="E.g. www.memmserve.com/vend-token"
                value={form.route}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.route)}
                onChange={(e) => set("route", e.target.value)}
              />
              {fieldErrors.route ? (
                <span className="modal-field-error" role="alert">
                  {fieldErrors.route}
                </span>
              ) : null}
            </div>
            <div className="modal-field">
              <label>Cost per Call (credits)</label>
              <input
                className="modal-input"
                inputMode="numeric"
                placeholder="E.g. 2"
                value={form.cost}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.cost)}
                onChange={(e) => set("cost", e.target.value)}
              />
              {fieldErrors.cost ? (
                <span className="modal-field-error" role="alert">
                  {fieldErrors.cost}
                </span>
              ) : null}
            </div>
            <div className="modal-field">
              <label>Category</label>
              <select
                className="modal-input"
                value={form.category}
                disabled={isSubmitting}
                onChange={(e) =>
                  set("category", e.target.value as AdminApiCategory)
                }
              >
                <option value="VENDING">Vending</option>
                <option value="HES_AMI">HES/AMI</option>
              </select>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn-neutral"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!canAdvance || isSubmitting}
                onClick={() => canAdvance && setStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="modal-field">
              <label>Sample Payload</label>
              <textarea
                className="modal-input api-view-code"
                rows={8}
                placeholder={'{\n  "productId": "PROD-101"\n}'}
                value={form.samplePayload}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.samplePayload)}
                onChange={(e) => set("samplePayload", e.target.value)}
                onBlur={(e) => set("samplePayload", formatJson(e.target.value))}
              />
              {fieldErrors.samplePayload ? (
                <span className="modal-field-error" role="alert">
                  {fieldErrors.samplePayload}
                </span>
              ) : null}
            </div>
            <div className="modal-field">
              <label>Sample Response</label>
              <textarea
                className="modal-input api-view-code"
                rows={8}
                placeholder={'{\n  "productId": "PROD-101"\n}'}
                value={form.sampleResponse}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.sampleResponse)}
                onChange={(e) => set("sampleResponse", e.target.value)}
                onBlur={(e) =>
                  set("sampleResponse", formatJson(e.target.value))
                }
              />
              {fieldErrors.sampleResponse ? (
                <span className="modal-field-error" role="alert">
                  {fieldErrors.sampleResponse}
                </span>
              ) : null}
            </div>
            <div className="modal-field">
              <label>Documentation</label>
              <textarea
                className="modal-input"
                rows={8}
                placeholder="Describe how customers should use this API"
                value={form.documentation}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.documentation)}
                onChange={(e) => set("documentation", e.target.value)}
              />
              {fieldErrors.documentation ? (
                <span className="modal-field-error" role="alert">
                  {fieldErrors.documentation}
                </span>
              ) : null}
            </div>
            <div className="modal-field">
              <label>Documentation Position</label>
              <select
                className="modal-input"
                value={form.documentationPosition}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.documentationPosition)}
                aria-describedby={
                  fieldErrors.documentationPosition
                    ? "api-documentation-position-error"
                    : undefined
                }
                onChange={(e) => set("documentationPosition", e.target.value)}
              >
                {Array.from({ length: positionCount }, (_, index) => {
                  const position = index + 1;
                  const label =
                    position === positionCount ? `${position} (Last)` : position;
                  return (
                    <option key={position} value={String(position)}>
                      {label}
                    </option>
                  );
                })}
              </select>
              {fieldErrors.documentationPosition ? (
                <span
                  id="api-documentation-position-error"
                  className="modal-field-error"
                  role="alert"
                >
                  {fieldErrors.documentationPosition}
                </span>
              ) : null}
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn-neutral"
                disabled={isSubmitting}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={isSubmitting}
                onClick={() => onSubmit(form)}
              >
                {isSubmitting ? "Please wait…" : submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RowActions({
  isOpen,
  api,
  onToggle,
  onClose,
  onView,
  onEdit,
  onTogglePublication,
  onActivate,
  onDeprecate,
}: {
  isOpen: boolean;
  api: AdminApi;
  onToggle: () => void;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onTogglePublication: () => void;
  onActivate: () => void;
  onDeprecate: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose, isOpen);
  const { anchorRef, menuStyle } = useAnchoredMenu(isOpen);

  return (
    <div className="row-actions" ref={ref}>
      <button
        type="button"
        ref={anchorRef}
        className="row-kebab"
        aria-label="Row actions"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <KebabIcon />
      </button>
      {isOpen ? (
        <div className="row-menu" style={menuStyle} role="menu">
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onView}
          >
            <ClipboardIcon /> View API
          </button>
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onEdit}
          >
            <PencilIcon /> Edit API
          </button>
          <button
            type="button"
            className="row-menu-item"
            role="menuitem"
            onClick={onTogglePublication}
          >
            {api.publication === "PUBLISHED" ? (
              <>
                <CloudDownIcon /> Unpublish
              </>
            ) : (
              <>
                <CloudUpIcon /> Publish
              </>
            )}
          </button>
          {api.status === "ACTIVE" ? (
            <button
              type="button"
              className="row-menu-item"
              role="menuitem"
              onClick={onDeprecate}
            >
              <TrashIcon /> Deprecate API
            </button>
          ) : (
            <button
              type="button"
              className="row-menu-item"
              role="menuitem"
              onClick={onActivate}
            >
              <BadgeCheckIcon /> Activate API
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4.5V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v1" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function CloudUpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19" />
      <path d="M12 18v-6m0 0-2.5 2.5M12 12l2.5 2.5" />
    </svg>
  );
}

function CloudDownIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19" />
      <path d="M12 12v6m0 0-2.5-2.5M12 18l2.5-2.5" />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

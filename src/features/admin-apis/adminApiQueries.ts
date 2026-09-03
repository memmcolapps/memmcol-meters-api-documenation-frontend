import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiRequest } from "../../lib/api/client";
import { publicApiKeys } from "../public-apis/publicApiQueries";

export type AdminApiStatus = "ACTIVE" | "DEPRECATED";
export type AdminApiPublication = "PUBLISHED" | "UNPUBLISHED";
export type AdminApiCategory = "HES_AMI" | "VENDING";
export type AdminApiSortBy = "name" | "cost" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export type AdminApiAddedBy = {
  id: string;
  name: string;
};

export type AdminApi = {
  id: string;
  name: string;
  route: string;
  cost: number;
  category: AdminApiCategory;
  samplePayload: string;
  sampleResponse: string;
  documentation: string;
  documentationPosition: string;
  status: AdminApiStatus;
  publication: AdminApiPublication;
  addedBy: AdminApiAddedBy;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminApiInput = {
  name: string;
  route: string;
  cost: number;
  category: AdminApiCategory;
  samplePayload: string;
  sampleResponse: string;
  documentation: string;
  documentationPosition: string;
};

export type UpdateAdminApiInput = Partial<CreateAdminApiInput> & {
  status?: AdminApiStatus;
  publication?: AdminApiPublication;
};

export type ChangeApiPublicationInput = {
  apiId: string;
  publication: AdminApiPublication;
};

export type ChangeApiStatusInput = {
  apiId: string;
  status: AdminApiStatus;
  reason?: string;
};

export type UpdateApiServiceInput = Partial<CreateAdminApiInput> & {
  apiId: string;
};

export type AdminApiListQuery = {
  search?: string;
  status?: AdminApiStatus;
  publication?: AdminApiPublication;
  page?: number;
  limit?: number;
  sortBy?: AdminApiSortBy;
  sortOrder?: SortOrder;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminApiResponse = {
  api: AdminApi;
};

type AdminApiListResponse = {
  items: AdminApi[];
  pagination: Pagination;
};

type ApiPublicationUpdate = Pick<AdminApi, "id" | "publication" | "updatedAt">;

type ApiStatusUpdate = Pick<
  AdminApi,
  "id" | "status" | "publication" | "updatedAt"
> & {
  statusReason?: string;
};

type ApiServiceUpdate = Pick<
  AdminApi,
  "id" | "name" | "route" | "cost" | "status" | "publication" | "updatedAt"
>;

type ChangeApiPublicationResponse = {
  api: ApiPublicationUpdate;
};

type ChangeApiStatusResponse = {
  api: ApiStatusUpdate;
};

type UpdateApiServiceResponse = {
  api: ApiServiceUpdate;
};

type AdminApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
};

export const adminApiKeys = {
  all: ["admin-apis"] as const,
  lists: () => ["admin-apis", "list"] as const,
  list: (query?: AdminApiListQuery) => ["admin-apis", "list", query] as const,
  detail: (id: string) => ["admin-apis", "detail", id] as const,
};

function listAdminApis(query?: AdminApiListQuery) {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.status) params.set("status", query.status);
  if (query?.publication) params.set("publication", query.publication);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.sortBy) params.set("sortBy", query.sortBy);
  if (query?.sortOrder) params.set("sortOrder", query.sortOrder);
  const qs = params.toString();
  return apiRequest<AdminApiListResponse>(`/admin/apis${qs ? `?${qs}` : ""}`);
}

function getAdminApi(id: string) {
  return apiRequest<AdminApiResponse>(`/admin/apis/${encodeURIComponent(id)}`);
}

function createAdminApi(input: CreateAdminApiInput) {
  return apiRequest<AdminApiResponse>("/admin/apis", {
    method: "POST",
    json: input,
  });
}

function updateAdminApi(id: string, input: UpdateAdminApiInput) {
  return apiRequest<AdminApiResponse>(`/admin/apis/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: input,
  });
}

async function changeApiPublication(input: ChangeApiPublicationInput) {
  const response = await apiRequest<ChangeApiPublicationResponse>(
    `/admin/apis/${encodeURIComponent(input.apiId)}/publication`,
    {
      method: "PATCH",
      json: {
        publication: input.publication,
      },
    },
  );
  return response.api;
}

async function changeApiStatus(input: ChangeApiStatusInput) {
  const response = await apiRequest<ChangeApiStatusResponse>(
    `/admin/apis/${encodeURIComponent(input.apiId)}/status`,
    {
      method: "PATCH",
      json: {
        status: input.status,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    },
  );
  return response.api;
}

async function updateApiService(input: UpdateApiServiceInput) {
  const { apiId, ...updates } = input;
  const response = await apiRequest<UpdateApiServiceResponse>(
    `/admin/apis/${encodeURIComponent(apiId)}`,
    {
      method: "PATCH",
      json: updates,
    },
  );
  return response.api;
}

function deleteAdminApi(id: string) {
  return apiRequest<void>(`/admin/apis/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function useAdminApis(query?: AdminApiListQuery) {
  return useQuery({
    queryKey: adminApiKeys.list(query),
    queryFn: async () => {
      const res = await listAdminApis(query);
      return { items: res.items, pagination: res.pagination };
    },
  });
}

export function useAdminApi(id: string) {
  return useQuery({
    queryKey: adminApiKeys.detail(id),
    queryFn: async () => {
      const res = await getAdminApi(id);
      return res.api;
    },
    refetchOnMount: "always",
  });
}

export function useCreateAdminApi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAdminApiInput) => {
      const res = await createAdminApi(input);
      return res.api;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.all });
    },
  });
}

export function useUpdateAdminApi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAdminApiInput;
    }) => {
      const res = await updateAdminApi(id, input);
      return res.api;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.all });
      queryClient.invalidateQueries({
        queryKey: adminApiKeys.detail(variables.id),
      });
    },
  });
}

export function useChangeApiPublication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeApiPublication,
    onSuccess: async (api) => {
      queryClient.setQueryData<AdminApi>(
        adminApiKeys.detail(api.id),
        (current) => (current ? { ...current, ...api } : current),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminApiKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: publicApiKeys.all }),
      ]);
    },
  });
}

export function useChangeApiStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeApiStatus,
    onSuccess: async (api) => {
      queryClient.setQueryData<AdminApi>(
        adminApiKeys.detail(api.id),
        (current) => (current ? { ...current, ...api } : current),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminApiKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: publicApiKeys.all }),
      ]);
    },
  });
}

export function useUpdateApiService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApiService,
    onSuccess: async (api, input) => {
      const submittedUpdates: Partial<AdminApi> = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.route !== undefined ? { route: input.route } : {}),
        ...(input.cost !== undefined ? { cost: input.cost } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.samplePayload !== undefined
          ? { samplePayload: input.samplePayload }
          : {}),
        ...(input.sampleResponse !== undefined
          ? { sampleResponse: input.sampleResponse }
          : {}),
        ...(input.documentation !== undefined
          ? { documentation: input.documentation }
          : {}),
        ...(input.documentationPosition !== undefined
          ? { documentationPosition: input.documentationPosition }
          : {}),
      };
      queryClient.setQueryData<AdminApi>(
        adminApiKeys.detail(api.id),
        (current) =>
          current ? { ...current, ...submittedUpdates, ...api } : current,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminApiKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: publicApiKeys.all }),
      ]);
    },
  });
}

export function useDeleteAdminApi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAdminApi(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.all });
      queryClient.invalidateQueries({ queryKey: publicApiKeys.all });
    },
  });
}

function getAdminApiMutationError(error: unknown, fallback: string) {
  const payload =
    error instanceof ApiError
      ? (error.details as AdminApiErrorPayload | undefined)
      : undefined;

  return {
    status: error instanceof ApiError ? error.status : undefined,
    code: payload?.error?.code,
    message:
      payload?.error?.message ??
      (error instanceof Error ? error.message : fallback),
    fields: payload?.error?.fields ?? {},
    requestId: payload?.error?.requestId,
  };
}

export function getApiPublicationError(error: unknown) {
  return getAdminApiMutationError(
    error,
    "The API publication could not be changed.",
  );
}

export function getApiStatusError(error: unknown) {
  return getAdminApiMutationError(
    error,
    "The API status could not be changed.",
  );
}

export function getApiUpdateError(error: unknown) {
  return getAdminApiMutationError(
    error,
    "The API service could not be updated.",
  );
}

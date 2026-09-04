import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/api/client";

export type PublicApiListItem = {
  id: string;
  name: string;
  route: string;
  summary: string;
  category?: string;
  documentationPosition?: number;
  updatedAt: string;
};

export type PublicApi = {
  id: string;
  name: string;
  route: string;
  cost: number;
  sampleResponse: string;
  samplePayload: string;
  documentation: string;
  updatedAt: string;
};

type PublicApiListResponse = {
  items?: PublicApiListItem[];
  /** Temporary compatibility with the currently deployed singular response key. */
  item?: PublicApiListItem[];
};

type PublicApiResponse =
  | {
      api: PublicApi;
    }
  | PublicApi;

export const publicApiKeys = {
  all: ["public-apis"] as const,
  list: () => ["public-apis", "list"] as const,
  detail: (apiId: string) => ["public-apis", "detail", apiId] as const,
};

function listPublicApis() {
  return apiRequest<PublicApiListResponse>("/public/apis", {
    auth: "none",
    // React Query owns the five-minute freshness window. When it does refetch
    // (including after publish/unpublish), revalidate the HTTP cache by ETag.
    cache: "no-cache",
  });
}

function getPublicApi(apiId: string) {
  return apiRequest<PublicApiResponse>(
    `/public/apis/${encodeURIComponent(apiId)}`,
    { auth: "none", cache: "no-cache" },
  );
}

export function usePublicApis() {
  return useQuery({
    queryKey: publicApiKeys.list(),
    queryFn: async () => {
      const response = await listPublicApis();
      if (Array.isArray(response.items)) return response.items;
      return Array.isArray(response.item) ? response.item : [];
    },
    staleTime: 300_000,
  });
}

export function usePublicApi(apiId: string, enabled = true) {
  return useQuery({
    queryKey: publicApiKeys.detail(apiId),
    queryFn: async () => {
      const response = await getPublicApi(apiId);
      return "api" in response ? response.api : response;
    },
    enabled,
    staleTime: 300_000,
  });
}

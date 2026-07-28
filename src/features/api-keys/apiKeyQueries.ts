import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api/client'

export type ApiKeyEnvironment = 'LIVE' | 'TEST'
export type ApiKeyStatus = 'ACTIVE' | 'REVOKED'

export type CreateApiKeyInput = {
  name: string
  environment: ApiKeyEnvironment
  expiresAt: string | null
}

export type GeneratedApiKey = {
  id: string
  name: string
  environment: ApiKeyEnvironment
  secret: string
  maskedKey: string
  status: ApiKeyStatus
  expiresAt: string | null
  createdAt: string
}

export type ApiKeySummary = Omit<GeneratedApiKey, 'secret'>

/**
 * Test keys come back in full because they carry no production access, while
 * live keys only ever expose `maskedKey`.
 */
export type ApiKey = {
  id: string
  name: string
  environment: ApiKeyEnvironment
  Key?: string
  maskedKey?: string
  status: ApiKeyStatus
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

export type ApiKeysResponse = {
  items: ApiKey[]
}

export const apiKeyKeys = {
  all: ['api-keys'] as const,
  list: () => ['api-keys', 'list'] as const,
}

export function getApiKeys() {
  return apiRequest<ApiKeysResponse>('/api-keys')
}

export function getApiKeyValue(apiKey: ApiKey) {
  return apiKey.Key ?? apiKey.maskedKey ?? ''
}

export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.list(),
    queryFn: getApiKeys,
  })
}

async function createApiKey(input: CreateApiKeyInput) {
  return apiRequest<GeneratedApiKey>('/api-keys', {
    method: 'POST',
    json: input,
  })
}

async function revokeApiKey(apiKeyId: string) {
  await apiRequest<void>(`/api-keys/${encodeURIComponent(apiKeyId)}`, {
    method: 'DELETE',
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: apiKeyKeys.all,
    }),
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: apiKeyKeys.all,
    }),
  })
}

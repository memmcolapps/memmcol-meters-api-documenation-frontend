import { useMutation } from '@tanstack/react-query'
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
  return useMutation({
    mutationFn: createApiKey,
  })
}

export function useRevokeApiKey() {
  return useMutation({
    mutationFn: revokeApiKey,
  })
}

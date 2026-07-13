import { ApiError, apiRequest } from './client'

type Entity = { id: string }

export type CrudService<TEntity extends Entity, TCreate, TUpdate> = {
  list: () => Promise<TEntity[]>
  get: (id: string) => Promise<TEntity>
  create: (data: TCreate) => Promise<TEntity>
  update: (id: string, data: TUpdate) => Promise<TEntity>
}

type DataEnvelope<T> = T | { data: T }

function unwrap<T>(response: DataEnvelope<T>) {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response
  ) {
    return response.data
  }
  return response
}

export function createRestCrudService<
  TEntity extends Entity,
  TCreate,
  TUpdate,
>(path: string): CrudService<TEntity, TCreate, TUpdate> {
  return {
    async list() {
      return unwrap(await apiRequest<DataEnvelope<TEntity[]>>(path))
    },
    async get(id) {
      return unwrap(
        await apiRequest<DataEnvelope<TEntity>>(`${path}/${encodeURIComponent(id)}`),
      )
    },
    async create(data) {
      return unwrap(
        await apiRequest<DataEnvelope<TEntity>>(path, {
          method: 'POST',
          json: data,
        }),
      )
    },
    async update(id, data) {
      return unwrap(
        await apiRequest<DataEnvelope<TEntity>>(`${path}/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          json: data,
        }),
      )
    },
  }
}

export function createMemoryCrudService<
  TEntity extends Entity,
  TCreate,
  TUpdate extends Partial<TEntity>,
>(seed: TEntity[]): CrudService<TEntity, TCreate, TUpdate> {
  let records = structuredClone(seed)

  const find = (id: string) => records.find((record) => record.id === id)

  return {
    async list() {
      return structuredClone(records)
    },
    async get(id) {
      const record = find(id)
      if (!record) throw new ApiError('This record could not be found.', 404)
      return structuredClone(record)
    },
    async create(data) {
      const record = {
        ...data,
        id: crypto.randomUUID(),
      } as unknown as TEntity
      records = [...records, record]
      return structuredClone(record)
    },
    async update(id, data) {
      const current = find(id)
      if (!current) throw new ApiError('This record could not be found.', 404)

      const updated = { ...current, ...data, id } as TEntity
      records = records.map((record) => (record.id === id ? updated : record))
      return structuredClone(updated)
    },
  }
}

export function createCrudQueryKeys(resource: string) {
  return {
    all: [resource] as const,
    list: () => [resource, 'list'] as const,
    detail: (id: string) => [resource, 'detail', id] as const,
  }
}

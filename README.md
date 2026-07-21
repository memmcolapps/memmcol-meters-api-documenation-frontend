# Momas Meters Portal

React 19 + TypeScript + Vite application using TanStack Router for navigation and
TanStack Query for remote/server state.

## Run locally

```bash
npm install
npm run dev
```

Without environment configuration, the API Management screens use the local
in-memory adapter seeded from `src/app/adminApis.ts`. This keeps frontend work
independent of backend availability while exercising the same queries, mutations,
loading states, and error states as the real transport.

To use the backend, copy `.env.example` to `.env.local`, set the API base URL, and
disable the mock adapter:

```bash
VITE_API_BASE_URL=/powerhub/v1/api
VITE_USE_MOCK_API=false
```

The API Management feature currently expects:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/admin/apis` | List APIs |
| `POST` | `/admin/apis` | Create an API |
| `GET` | `/admin/apis/:id` | Get one API |
| `PATCH` | `/admin/apis/:id` | Update fields, status, or publication |

Responses may be the resource directly or wrapped as `{ "data": ... }`. Failed
responses should preferably contain a `message` string. Authentication uses the
server-issued HttpOnly session cookie; the client does not store or send bearer
tokens.

## Data-flow structure

- `src/lib/api/client.ts` owns HTTP headers, auth, JSON parsing, and normalized errors.
- `src/lib/api/crud.ts` provides reusable REST CRUD and in-memory adapters.
- `src/lib/queryClient.ts` owns global cache defaults.
- `src/features/<feature>` owns feature query keys, typed queries, and mutations.
- Route components keep only temporary UI state such as search text and open modals.

Use the API Management feature as the reference when connecting meters, plans, and
the remaining seeded screens.

The Meter Integration form consumes the admin creation endpoint directly:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/admin/meter-integrations` | Create a supported meter integration |

The response is expected as `{ "meterIntegration": { ... } }`. Validation errors
from `error.fields` are displayed on the matching form controls. The optional
password is sent only in the create request and is not retained in client-side
meter state.

## Checks

```bash
npm run lint
npm run build
```

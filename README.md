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
| `GET` | `/admin/meter-integrations` | List and filter paginated meter integrations |
| `POST` | `/admin/meter-integrations` | Create a supported meter integration |
| `GET` | `/admin/meter-integrations/:meterIntegrationId/obis-codes` | Search, filter, and paginate OBIS/action codes |
| `POST` | `/admin/meter-integrations/:meterIntegrationId/obis-codes` | Add an OBIS/action code to a meter integration |
| `PATCH` | `/admin/meter-integrations/:meterIntegrationId/obis-codes/:obisCodeId` | Update an OBIS/action code |
| `PATCH` | `/admin/meter-integrations/:meterIntegrationId/obis-codes/:obisCodeId/status` | Activate or deprecate an OBIS/action code |
| `POST` | `/admin/meter-integrations/:meterIntegrationId/obis-codes/upload` | Upload OBIS/action codes from CSV using append or replace mode |

The response is expected as `{ "meterIntegration": { ... } }`. Validation errors
from `error.fields` are displayed on the matching form controls. The optional
password is sent only in the create request and is not retained in client-side
meter state.

The OBIS form uses the returned `obisCode` as the source of truth. No seeded or
mock OBIS records are used.

CSV uploads are sent as `multipart/form-data` with `file` and `mode` fields. The
mode must be `append` or `replace`.

The customer meter form creates a meter using the selected integration ID:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/meters` | Create a meter and submit its key-change values |
| `GET` | `/meters/export` | Export all meters matching the active filters as CSV |

`meterNumber`, `simNumber`, and `meterTypeId` are sent as strings so identifier
formatting, including leading zeroes, is preserved. Meter types are loaded from
the active meter integrations returned by `GET /organisation/meter-integration`.
Meter exports include the active search, status, and sort filters without page or
page-size parameters.

Billing credit plans are created and consumed through these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/admin/billing/plans` | Search, filter, and paginate admin billing plans |
| `POST` | `/admin/billing/plans` | Create a billing credit plan |
| `PATCH` | `/admin/billing/plans/:planId` | Update billing plan details |
| `PATCH` | `/admin/billing/plans/:planId/status` | Activate or deactivate a billing plan |
| `GET` | `/billing/plans` | List customer-visible billing plans |

Plan amounts and credit quantities are represented as numbers. The customer
billing page also filters the list to `ACTIVE` plans before rendering it.

## Checks

```bash
npm run lint
npm run build
```

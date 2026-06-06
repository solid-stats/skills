# Data flow — TanStack Query + Router

How server data moves through the app. The headline rule (ratified): **route loaders prefetch into
the Query cache; components read the same key with `useQuery`.** This is what gives SSR, stale-while-
revalidate, and instant restore on Back. All server access goes through **`openapi-fetch` +
`openapi-react-query`** typed by the generated OpenAPI `paths` — never raw `fetch`, never a
hand-written DTO.

## The typed client

```ts
// shared/api/client.ts
import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';
import type { paths } from '@/shared/api/generated';   // openapi-typescript output

const fetchClient = createFetchClient<paths>({ baseUrl: env.API_URL });
fetchClient.use(authMiddleware, errorNormalizeMiddleware);   // session headers, stable error codes
export const $api = createClient(fetchClient);
```

- `openapi-fetch` is the thin typed client (centralizes base URL, auth/session headers via middleware,
  error normalization, SSE wiring). `openapi-react-query` wraps it with TanStack Query, typed by
  `paths` — method + path + params are checked against the generated schema.
- **No raw `fetch` in components/hooks; no hand-written request/response DTOs.** Path/query params go
  through the typed `params` arg, never string interpolation.
- The generated `paths` come from `openapi-typescript` against the live `server-2` schema; CI fails on
  stale generated types (brief).

## queryOptions as the shared unit

Wrap `$api.queryOptions(...)` in a thin **per-domain factory**, and share the result between the loader
and the component — `openapi-react-query` derives the query key (method + path + params), so there is
no hand-written key or `queryFn`.

```ts
// shared/api/players/playerQueries.ts
export const playerQueries = {
  list: (search: PlayerListSearch) =>
    $api.queryOptions('get', '/players', { params: { query: search } }),
  detail: (slug: string) =>
    $api.queryOptions('get', '/players/{slug}', { params: { path: { slug } } }),
};
```

```ts
// src/routes/.../players.tsx — loader prefetches
loader: ({ context, deps }) => context.queryClient.ensureQueryData(playerQueries.list(deps.search)),
```

```ts
// component reads the same options
const { data } = useQuery(playerQueries.list(search));
```

Rules:

- Components/loaders call the **domain factory** (`playerQueries.*`), not raw `$api.queryOptions('get',
  '/players', …)` sprinkled around — one place owns each resource's options.
- The loader uses `ensureQueryData` (prefetch + return cached) or `prefetchQuery` (fire-and-forget for
  secondary data); the component always reads via `useQuery(sameOptions)`.
- Query keys are owned by `openapi-react-query` (method + path + params); invalidate via the same
  method+path so invalidation stays precise.

## Mutations

- Mutations use `$api.useMutation('post', '/...')`. On success, **invalidate** the affected query keys
  (`queryClient.invalidateQueries`, keyed by the method+path of the read).
- Optimistic updates only **where safe** (brief): `onMutate`/rollback for low-risk, reversible changes;
  never optimistically apply a moderation decision or a correction the server must validate/recalculate.
- Errors surface through the app error/notification system with stable error codes (see `errors.md`),
  not raw error text inline.

## SSR & hydration

- TanStack Start runs loaders on the server; the `QueryClient` is dehydrated on the server and hydrated
  on the client, so prefetched data is in the initial HTML (SEO/LCP) and the client doesn't re-fetch on
  mount. SEO-critical/LCP data must be prefetched in the loader, never fetched client-only.

## Cache lifetimes (policy)

- Public stats use a **long `staleTime`** (brief: long public cache + SSE freshness); set explicit
  `staleTime`/`gcTime` per query family — don't rely on defaults.
- `gcTime` must outlive a list→detail→back round-trip so list data restores from cache instantly.
- Auth/session and mutation-sensitive data use short `staleTime`. Exact numbers per family are set at
  implementation (a brief follow-up) — the convention is "explicit, per-family, documented."

## The list → detail → back contract

Satisfied by the combination: loader `ensureQueryData` (re-uses cached list data, no refetch) + a
`gcTime` that survives the detour + Router scroll/virtualization restoration (`routing.md`) + shareable
state in the URL (`state.md`). A change that breaks any of these — a client-only fetch on the list, too
short a `gcTime`, a blocking loader on Back — is a defect.

Review flags:

- Raw `fetch` or a hand-written DTO instead of `$api` / generated types.
- `$api.queryOptions(...)` called inline in components instead of a domain factory.
- Optimistic update on a moderation/correction action that the server must validate.
- SEO/LCP data fetched client-only instead of prefetched in the loader.
- A query family with no explicit `staleTime`/`gcTime`.

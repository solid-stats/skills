# Routing & search params

TanStack Router, file-based in `src/routes`. Routes are thin (loader + delegate to a `src/pages` page);
search params are typed and the single source of truth for shareable state.

## Routes

- File-based routes in `src/routes`; each route holds its definition, `loader` (prefetch — see
  `data-flow.md`), `beforeLoad` guards, `head`/meta, and a thin component that renders a `src/pages`
  page. No feature/business logic in the route file.
- Route-level **code splitting** and **preloading on intent** (hover/viewport) are enabled for catalog
  and detail flows (brief: fast list→detail).
- Each route declares an `errorComponent`, a `pendingComponent` (with a min-show to avoid flash), and
  a `notFoundComponent`; slow secondary data streams via `defer` + `Await` — this is how replay pages
  keep LCP (summary first, timeline progressive). See `errors.md` and `performance.md`.
- **Scroll restoration** is enabled at the router level; virtualized row position is restored on Back
  (the signature requirement). Don't hand-manage scroll.

## Search params (single source of truth)

- Every route that carries shareable state declares a **`validateSearch`** schema built with
  **`zod/v4-mini`**; reads use the typed `useSearch`/`Route.useSearch`, and writes use the typed
  `navigate({ search })` — **never** hand-built URL strings or `as` casts on routes.
- Shareable state (search, filters, sort, cursor/page) lives here and nowhere else (see `state.md`).
  The UI reacts to the URL; it does not also write a mirror store.
- Keep volatile/arbitrary search/sort/cursor URLs out of the indexable set (see `seo.md`): curated
  indexable filter URLs + `noindex`/canonical for volatile states, to avoid crawl traps.

## Auth & role gates

- Auth and role checks happen at the **route boundary** (`beforeLoad`/loader) **before** role-sensitive
  data is fetched — never as an afterthought in the page component.
- Unauthenticated access to a gated route redirects to login with a validated `redirect` return param,
  returning the user to the original flow after Steam OAuth.
- Unauthorized (wrong role) access shows a contextual **403** with missing-rights context and recovery
  actions (brief), not a blank or a generic error.

## Localized routes (`/ru` `/en`)

- Public localized routes are prefixed `/ru/...` and `/en/...`. First visit to `/` redirects by browser
  language preference where possible, with an explicit switcher and a persisted user choice.
- Each indexable page emits canonical + `hreflang` for its locale pair (see `seo.md`).
- Dates/times are localized; ops/moderation contexts expose UTC in a secondary hint where useful.

Review flags:

- A route file containing feature/business logic instead of delegating to a `src/pages` page.
- Hand-built hrefs / `as Route` casts instead of typed `navigate`/route links.
- Shareable state read from or written somewhere other than typed search params.
- Auth/role checks in the page component instead of the route boundary; role-sensitive data fetched
  before the gate.
- A volatile filter/sort/cursor URL left indexable (crawl-trap risk).

> **Validation:** all route search schemas use **`zod/v4-mini`** — the bundle-conscious Zod v4 build,
> consistent with the TypeScript conventions (`typescript.md`) and the CWV/bundle budgets. Pass the
> mini schema to `validateSearch` directly (Zod v4/mini implements Standard Schema) or via
> `@tanstack/zod-adapter` when you want `fallback` / `stripSearchParams`.

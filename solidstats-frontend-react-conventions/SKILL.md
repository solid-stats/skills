---
name: solidstats-frontend-react-conventions
description: >
  The complete ruleset for writing code in the SolidStats `web` frontend (TanStack Start / React /
  TSX). Covers FSD layers and slices, component shape (server/client boundary), the TanStack Query +
  Router data flow (loader-prefetch into the Query cache), state boundaries (URL / Router / Query /
  Nano Stores), routing and search params, typed ICU localization (`/ru` `/en`), TypeScript strictness
  with generated OpenAPI types as the source of truth, vanilla-extract styling, accessibility
  (WCAG 2.2 AA), performance/Core Web Vitals budgets, SSR/SEO, SSE realtime, errors, tests, and the
  SolidStats domain. Consult this whenever creating a feature/page/component, modifying UI, adding a
  data fetch, wiring routing, touching localization, or deciding where a file lives — before writing
  any TS/TSX in `web`. It is the rule source that solidstats-frontend-react-code-review enforces.
  Triggers: "add a feature", "new page", "new component", "fetch data", "wire a route",
  "where should this go", "follow the conventions", "напиши фичу", "добавь страницу",
  "как тут принято", "новый компонент".
---

# SolidStats Frontend Conventions — TanStack Start / React

Authoritative guide for writing code in the SolidStats `web` frontend. The **product ground truth is
`gsd-briefs/web.md`** (scope, quality bar, stack decisions, design direction) and the repo config
(`tsconfig.json`, ESLint, `package.json`). If this skill contradicts those, they win — flag the drift.
This skill is the rule source that
[`solidstats-frontend-react-code-review`](../solidstats-frontend-react-code-review/SKILL.md) enforces
and [`solidstats-frontend-react-tests`](../solidstats-frontend-react-tests/SKILL.md) assumes.

> **Stack (locked by the brief):** TanStack Start (SSR) + Router + Query + Table · Nano Stores (light
> client state only) · vanilla-extract · Ark UI (headless primitives) · Lucide (the only icon set) ·
> typed ICU i18n (`/ru` `/en`) · `openapi-typescript` paths + a typed thin client (`openapi-fetch` /
> `openapi-react-query`) · Node/Docker · SSE realtime · **TanStack Form** (request steppers) ·
> **Vite+** (`vp check`: Oxlint + Oxfmt + tsgo) for lint/format/type-check.
> **Quality order:** UX continuity → accessibility (WCAG 2.2 AA) → SEO → CWV (LCP≤2.5s, INP≤200ms,
> CLS≤0.02) → visual polish. **Signature requirement:** list → filter/sort → deep scroll → detail →
> Back restores table state, scroll, virtualized position, and cache with **no** blocking reload or CLS.

The architecture is taken from the estesis FSD frontend conventions, retargeted to TanStack (the data
layer is the one real change: MobX/RequestStore → TanStack Query + Router + Nano Stores).

## 1. Architecture: layers

Three root layers:

- **`src/routes`** — the TanStack Router file-based route tree: route definitions, **loaders**
  (prefetch into the Query cache), SSR/`head`/meta, route-level guards. Route files stay thin — a
  loader plus a render that delegates to a page in `src/pages`.
- **`src/pages`** — page implementations composed by route entries. (TanStack keeps the route tree in
  `src/routes`, so `pages` is free here — it was `pagesUI` in estesis only because Next reserves
  `pages`; we use the cleaner name.)
- **`src/shared`** — reusable components, query hooks / the typed API client, Nano stores, i18n,
  generated types, business helpers.

UI layers inside `pages` / `shared` (FSD): **pages · widgets · composites · actions · displays ·
layouts · wrappers · lib**. Layer rules, slice rules, and the uikit-vs-feature boundary live in
`references/patterns/architecture.md`.

## 2. Slices & entrypoints

A **slice** is a PascalCase folder with a React component and an `index.ts` entrypoint; consumers
import only from `index.ts`. Component files carry a layer suffix (`PlayerTableWidget`,
`ApplyFiltersAction`, `RankDisplay`, `PageLayout`). Segments: `ui/`, `lib/`, `business/`, `api/`.
Full rules in `architecture.md`.

## 3. Component shape

- Components are **named functions** with a typed `Props`; no `observer()` (no MobX). Props order is
  **system props (`children`, `className`, `style`) first**, then values → booleans → callbacks.
- Server vs client per TanStack Start: SEO-critical/LCP content renders on the server; client
  components own interactivity and read the Query cache with `useQuery`.
- Memoize callbacks passed to children (`useCallback`); never pass a fresh inline object/array as a
  prop. JSX conditionals use explicit ternaries returning `null`. Icons are **Lucide** components,
  renamed to PascalCase locals; icon-only controls need accessible names. Buttons default to
  `type="button"`. Prefer variants/composition over many boolean props (YAGNI). Detail in
  `references/patterns/component-shape.md`.

## 4. Data flow — TanStack Query + Router

- **Loaders prefetch into the Query cache** (`queryClient.ensureQueryData(opts)`); components read the
  same key with `useQuery`. This gives SSR, stale-while-revalidate, and instant restore on Back.
- All server access goes through a **typed thin client over the generated OpenAPI types** — no raw
  scattered `fetch`, no hand-written DTOs. Query hooks are named `useFetch<Name>` / `useSubmit<Name>`;
  query keys are structured and centralized. Public lists use **cursor pagination** with server-driven
  filter/sort. Detail in `references/patterns/data-flow.md`.

## 5. State boundaries

Each kind of state has exactly one home (brief):

- **URL / Router search params** — shareable state: search, filters, sorting, cursor/page. Single
  source of truth; the UI reacts to the URL, never writes both.
- **TanStack Query cache** — server data (and its freshness/preservation on Back).
- **Nano Stores** — lightweight client-only state that belongs in none of the above (e.g. table
  density toggle, ephemeral UI).
- **Ephemeral/component state** — scroll position, virtualized row position (restored by Router).

Detail in `references/patterns/state.md`.

## 6. Routing & search params

Typed TanStack Router routes; search params validated and treated as the single source of truth;
scroll/virtualization restoration on Back; auth/role gates at the route/loader boundary before
role-sensitive data loads; localized `/ru` `/en` routes. Detail in `references/patterns/routing.md`.

## 7. Localization

Typed, ICU-capable i18n, RU + EN from the start; `/ru` `/en` route prefixes; no hardcoded UI strings;
keys structured by domain/layer; the component-level `const ln` aliasing convention. Detail in
`references/patterns/localization.md`.

## 8. TypeScript

`type` not `interface`; no `any`, no non-null assertions, no unexplained `as`. **Generated OpenAPI
types are the source of truth** — never hand-write DTOs; regenerate on schema change; CI fails on
stale types. `noUncheckedIndexedAccess` on. **Backend-driven value maps are `Record<Enum, …>`** so a
backend enum change breaks `tsc`. Model (server shape) → Data (app shape) processed at the boundary.
Detail in `references/patterns/typescript.md`.

## 9. Styling (vanilla-extract)

Colocated `<ComponentName>Style.css.ts`; tokens + a first-class dark/light theme contract; `clsx` for
class composition; no `transition: all`; Lucide-only icons; stable dimensions for tables/cards/
skeletons (no CLS); no nested cards / ornamental gradients. Detail in
`references/patterns/styling.md`.

## 10. Accessibility

WCAG 2.2 AA minimum: visible focus, full keyboard support (menus, tables, dialogs, filters), no
keyboard traps, skip links + landmarks, one meaningful H1, contrast (4.5:1 / 3:1), never color-alone,
accessible names on icon controls, labeled fields with announced errors, live regions for async/SSE
without stealing focus, focus management on route change, 44×44 touch targets. Ark UI provides the
accessible primitives. Detail in `references/patterns/a11y.md`.

## 11. Performance & Core Web Vitals

Budgets (brief): LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.02 (≤ 0.05 critical). Route-level splitting;
virtualize large tables (keep keyboard/SR usable); render-stable props; reserve space for async
content; LCP content in initial HTML; `transform`/`opacity` animations respecting
`prefers-reduced-motion`; bundle budgets enforced in CI; third-party scripts blocked by default.
Detail in `references/patterns/performance.md`.

## 12. Rendering & SEO

SEO-critical public pages return meaningful server-rendered HTML before JS; unique titles/meta;
canonical URLs; sitemap/robots (segmented sitemap index for replay pages); structured data
(`VideoGame`/`BreadcrumbList`/`ItemList`); `/ru` `/en` canonical + hreflang; no crawl traps from
volatile filter/sort URLs (curated indexable URLs + noindex/canonical). Detail in
`references/patterns/seo.md`.

## 13. Realtime (SSE)

SSE by default (WebSocket only for client→server live messaging). Updates must not reorder or insert
above the viewport or cause CLS; per-page merge discipline — small local changes auto-merge with a
notice, large recalcs require explicit confirm; reconnect/offline/timeout/stale states are visible,
accessible, and testable. Detail in `references/patterns/realtime.md`.

## 14. Errors

Stable, unique error codes; recovery copy distinguishes user-action errors from application/server
errors (the latter carry a contact path + request/debug id); stale/offline/timeout data is explicitly
labeled. Detail in `references/patterns/errors.md`.

## 15. Tests

Playwright covers components and critical journeys (incl. list→detail→back restoration, SSE behavior,
a11y via axe); Vitest covers hooks and pure logic — do **not** write RTL tests that render components
and assert DOM. Detail and the CI gate live in
[`solidstats-frontend-react-tests`](../solidstats-frontend-react-tests/SKILL.md) on top of
[`solidstats-process-testing-standards`](../solidstats-process-testing-standards/SKILL.md);
`references/patterns/tests.md` holds the conventions summary.

## 16. Domain rules

Players/squads/rotations/commander/bounty surfaces; slug-only current-owner routes (replay = ID);
visible provenance (last-updated, unknown/conflict badges); masked SteamID (last 4); bounty formula
breakdown; separate guided request flows (identity, kills, teamkills, remove-from-replay, commander
dispute) with `server-2` drafts; risk+age moderation queue with immutable audit timeline. Detail in
`references/patterns/domain-rules.md`.

## 16.1 Security (SSR server)

The Node SSR server sets a Content-Security-Policy + security headers; secrets are server-only and
never read at module scope in client-reachable code; evidence uploads are content-validated. Detail in
`references/patterns/security.md`.

## 17. Reference files

The sections above are the authoritative summary. Load the specific file from `references/patterns/`
that matches the code you're touching — not all at once. Use `references/project-patterns.md` (the
index mapping `src/` paths → pattern files) to decide scope.

| File | Covers |
|---|---|
| `architecture.md` | Root/UI layers, slices/entrypoints, uikit-vs-feature boundary. |
| `component-shape.md` | Component shape, props order, server/client boundary, Lucide icons. |
| `forms.md` | TanStack Form for the request steppers — validation, drafts, SSR, field subscription. |
| `data-flow.md` | Query + Router loader-prefetch, the typed thin client, query keys, mutations, pagination. |
| `state.md` | URL/Router vs Query cache vs Nano Stores boundaries. |
| `routing.md` | Typed routes, search-param single-source-of-truth, scroll restoration, auth/role gates, `/ru` `/en`. |
| `localization.md` | Typed ICU i18n, `/ru` `/en`, key structure, `const ln` aliasing. |
| `typescript.md` | Generated-types source of truth, backend-enum `Record` safety, Model/Data boundary, strictness. |
| `styling.md` | vanilla-extract file naming, tokens, theme contract, stable dimensions. |
| `a11y.md` | WCAG 2.2 AA controls, keyboard/focus, dialogs (Ark UI), live regions, contrast, touch targets. |
| `performance.md` | CWV budgets, splitting, virtualization, render stability, images, reduced-motion, bundle budgets. |
| `seo.md` | SSR for indexable pages, titles/meta, canonical/sitemap/structured-data, `/ru` `/en` hreflang, crawl-trap avoidance. |
| `realtime.md` | SSE per-page merge discipline, no-CLS updates, reconnect/offline/stale states. |
| `errors.md` | Stable error codes, recovery copy, user-vs-app distinction. |
| `security.md` | SSR-server CSP/headers, env/secret handling, upload content-validation. |
| `tests.md` | Playwright-for-components / Vitest-for-hooks split, CI gate summary. |
| `domain-rules.md` | Players/squads/rotations/commander/bounty, slug model, provenance, request/moderation flows. |
| `../project-patterns.md` (at `references/`, not `patterns/`) | Index: `src/` path → pattern files, with common search commands. |

## 18. Companion skills

Apply alongside this skill: `solidstats-process-review-standards` + `solidstats-frontend-react-code-review`
(review), `solidstats-process-testing-standards` + `solidstats-frontend-react-tests` (tests). The
external `tanstack-start` and `openapi-to-typescript` skills remain the framework/tool references
(not vendored here).

## 19. Quick checklist

1. File lives in the right layer/slice/segment; no upward imports; slice has an `index.ts` public surface.
2. Component is a named function (no `observer`); props system-first; no inline object/array props.
3. Data is fetched via a loader `ensureQueryData` prefetch + `useQuery`, through the typed thin client; no hand-written DTOs.
4. Shareable state is in the URL (single source of truth); ephemeral state isn't; Back restores table+scroll+cache.
5. Types: `type` over `interface`; generated OpenAPI types used; backend enum maps are `Record<Enum,…>` so `tsc` breaks on change.
6. Styles in colocated `<Name>Style.css.ts`; tokens/theme contract; stable dimensions; no `transition: all`; Lucide icons only.
7. a11y: focus, keyboard, accessible names, labeled fields, contrast, 44×44 targets; Ark UI primitives.
8. CWV budgets respected; LCP in initial HTML; reserved space (no CLS); route-split heavy code.
9. SEO: SSR meaningful HTML for indexable pages; titles/meta/canonical; `/ru` `/en` hreflang.
10. UI strings localized (typed ICU, `const ln`); no hardcoded copy.

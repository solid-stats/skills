# Performance & Core Web Vitals

Budgets (brief, 75th-percentile targets): **LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.02** (must not exceed
0.05 on critical journeys). Bundle budgets are defined and enforced in CI. CWV sits just below
accessibility in the quality order.

## Layout stability (CLS)

- **Reserve space for all async content** — images, media, tables, skeletons, fonts, SSE updates. No
  image/media/table/skeleton/font/hydration/SSE update may cause avoidable layout shift.
- Skeletons reserve the **final** layout dimensions. Components keep **stable dimensions** (see
  `styling.md`). SSE updates must not insert/reorder above the viewport (see `realtime.md`).

## LCP

- LCP content is in the **initial server-rendered HTML** and does not wait for a client-side fetch
  (prefetch in the loader — see `data-flow.md`). Critical fonts/images are loaded deliberately; avoid
  unnecessary preloads.

## INP

- Keep interaction handlers short; defer non-critical work (transitions / scheduling) so INP stays in
  budget. CPU-heavy transforms move off the main thread or are chunked when datasets require it.
- Filtering/searching uses debouncing or transitions where needed.

## Bundles & loading

- **Route-level code splitting** for heavy catalog/table/detail/moderation/admin code; preload on
  intent. Content-hashed static assets use long-lived immutable caching.
- **Bundle budgets enforced in CI**; **third-party scripts blocked by default** unless a phase
  justifies them. No heavy dependency statically imported into shared/common paths (lazy-load it).
- Prefer `zod/v4-mini` and other bundle-conscious choices (see `typescript.md`).

## Rendering stability

- Props passed to children are render-stable: memoize handlers (`useCallback`); never pass a fresh
  inline object/array (`copy={{…}}`) — split into primitives or `useMemo` (see `component-shape.md`).
- **Virtualize** large tables/lists (10k–100k rows) while keeping keyboard and screen-reader behavior
  usable.
- Effects clean up listeners, timers, `IntersectionObserver`/`ResizeObserver`, media handlers, and
  object URLs; cleanup is correct under React StrictMode remounts.

## Motion

- Animations use **`transform`/`opacity`** only and respect `prefers-reduced-motion`.

Review flags:

- Async content without reserved space (CLS); a skeleton that doesn't match final dimensions.
- LCP content behind a client-only fetch; an unnecessary preload.
- A long interaction handler doing heavy work on the main thread; un-debounced filter/search.
- A heavy dep statically imported into a shared path; a route not split where it should be.
- A fresh inline object/array prop; an un-virtualized 10k+ row table; a missing effect cleanup.
- Animation on a non-`transform`/`opacity` property or ignoring `prefers-reduced-motion`.

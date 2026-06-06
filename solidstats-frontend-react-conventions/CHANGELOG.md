# Changelog — solidstats-frontend-react-conventions

## 2026-06-06 — Initial
- Full modular conventions skill for the `web` frontend (TanStack Start / React), mirroring the estesis
  VC conventions structure (spine `SKILL.md` + `references/patterns/*` + a `project-patterns.md`
  index). Grounded in `gsd-briefs/web.md` (the product ground truth).
- **Architecture taken from estesis FSD**, retargeted to TanStack: root layers `src/routes` (thin
  loaders) → `src/pages` (page impls; renamed from estesis `pagesUI` since TanStack frees the `pages`
  name) → `src/shared`; UI layers (pages/widgets/composites/actions/displays/layouts/wrappers/lib);
  slices (PascalCase + `index.ts` + layer suffix + `ui/lib/business/api` segments).
- **Data layer is the one real swap from estesis** (MobX/RequestStore → TanStack): loaders prefetch
  into the Query cache (`ensureQueryData`) and components read the same `queryOptions`; the typed client
  is **openapi-fetch + openapi-react-query** over `openapi-typescript` paths; cursor pagination; the
  list→detail→back contract.
- **User-ratified decisions:** `src/routes` entry layer; full modular structure; openapi-fetch +
  openapi-react-query; `zod/v4-mini` for `validateSearch` and runtime validation; the vanilla-extract
  token contract (`contract`/`dark`/`light`/`tokens`, semantic-only color, tabular numerals, density).
- Pattern files: architecture, component-shape, data-flow, state, routing, localization, typescript,
  styling, a11y, performance, seo, realtime, errors, tests, domain-rules, + the project-patterns index.
- a11y / performance / seo / realtime / errors / domain-rules transcribe the brief's WCAG 2.2 AA, CWV
  budgets (LCP≤2.5s/INP≤200ms/CLS≤0.02), SEO/SSR, SSE merge discipline, error-code, and SolidStats
  domain rules. Tests delegate to `solidstats-frontend-react-tests` + `solidstats-process-testing-standards`.
- Authored collaboratively — the user drove (frontend is their domain), unlike the backend/parser
  clusters.

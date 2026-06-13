# Changelog — solidstats-frontend-react-conventions

## 2026-06-13 — Dedup `typescript.md` against solidstats-shared-ts-standards (taxonomy V5)

- `typescript.md`: the **Derivation & utilities** library block (`es-toolkit` / `type-fest` /
  `day.js` / `nanoid`) and the restated TS baseline rules (no `any`, no `interface`, no `!`,
  `noUncheckedIndexedAccess` handling) are replaced with short pointers to
  `solidstats-shared-ts-standards` §B/§F — the canonical tri-repo home. The web nuances
  (dayjs i18n wrapping + per-slice plugin loading, nanoid's ephemeral client-only scope)
  moved into §F as one-liners.
- Kept only the genuinely web-specific additions: naming (`as const` value sets, `Schema`
  suffix), the `switch`/branching rule, slice-type composition from a model, domain ID
  property references, and the generated-types boundary. The `Record<Enum,…>` rule and the
  Vite+ type-check line now cite the §A/§B baseline; the review flags for baseline/utility
  violations cite §B/§F instead of restating them.

## 2026-06-07 — Add `day.js` + `nanoid` to utilities
- `typescript.md`: added **`day.js`** (date parse/format/manipulate over `Date` math / Moment.js;
  ~2 KB core, opt-in plugins) and **`nanoid`** (ephemeral client-only ids over `Math.random`/
  `Date.now`) to **Derivation & utilities**, with matching review flags.

## 2026-06-07 — Utility & type library recommendation
- `typescript.md`: reworked **Derivation** → **Derivation & utilities** — `type-fest` is now an active
  recommendation (corrected the example list; dropped the non-existent `Modify`), and added
  `es-toolkit` as the runtime utility lib (tree-shakeable, bundle/CWV-friendly) to use before
  hand-rolling helpers or adding `lodash`. Added a matching review flag.

## 2026-06-06 — Follow-up (user directives)
- Added `references/patterns/forms.md` — **TanStack Form** for the request steppers (zod/v4-mini,
  live-after-submit validation, SSR drafts, field-level subscription).
- Added the **Vite+** lint/format/type-check baseline to `typescript.md` (Oxlint + Oxfmt + tsgo via
  `vp check`, strict-but-sane) + the stack line.
- Expanded the evidence-upload spec in `security.md` (magic-bytes validation, both-side limits, EXIF
  strip, no-SVG, accessible drop-zone/progress, object-URL cleanup, safe external links).

## 2026-06-06 — Analysis fixes (see .planning/SKILLS-ANALYSIS.md)
- Added `references/patterns/security.md` (SSR CSP/headers, env/secret leakage, upload
  content-validation) + a spine §16.1 and the reference-map entry.
- Added hydration-safety (localization.md), font-loading strategy (performance.md), and route
  `errorComponent`/`pendingComponent`/`notFoundComponent` + `defer` streaming (routing.md).
- Corrected: SSE attributed to the client module, not openapi-fetch (data-flow.md); `validateSearch`
  wiring note — Standard Schema / `@tanstack/zod-adapter` (routing.md); stack line clarified
  (openapi-fetch *is* the thin client); `project-patterns.md` path noted (it lives in `references/`).

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
  domain rules. Tests delegate to `solidstats-frontend-react-tests` + `solidstats-shared-testing-standards`.
- Authored collaboratively — the user drove (frontend is their domain), unlike the backend/parser
  clusters.

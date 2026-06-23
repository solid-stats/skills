# Changelog — solidstats-frontend-react-conventions

## 2026-06-23 — Document the merge-free `tailwind-variants/lite` override caveat (promoted)

- `references/patterns/styling.md`: under *Utilities, not arbitrary values*, note that this repo imports
  `tv` from `tailwind-variants/lite` (no `tailwind-merge`), so conflicting utilities are not deduped — a
  passed `className` override does not reliably beat the variant's base (CSS source order wins), and
  mutually-exclusive utilities must be held as variants or forced with `!important`. Added the matching
  review flag. Caused a real silently-wrong render (a ghost button's `bg-transparent` ate a `bg-surface-3`
  override).
- Promoted from corrections-log `SC-2026-06-23-c1de` (caused-bug · fact).

## 2026-06-23 — `cursor-pointer` on every interactive element (promoted)

- `references/patterns/styling.md`: under *Design direction (enforced)*, every interactive control
  (button, link, icon-button, segmented / sort member, pager, tab, show-more) carries
  **`cursor-pointer`** — a deliberate product decision that overrides the native `<button>`
  default-arrow convention (and Tailwind v4 preflight). The single owner is the shared `Button` /
  `Link` `control` `tv()` recipe; cursor is never set per call-site. `disabled` keeps
  `pointer-events-none` (no pointer on a disabled control), never `cursor-not-allowed`. Added the
  matching review flag. Mirrors the `DESIGN.md` → Components → Buttons + Do's note.
- Promoted from corrections-log `SC-2026-06-23-c5a1` (gap · preference · generalized — owner mandate).

## 2026-06-23 — Mandate a shared Button/Link base primitive (promoted)

- `references/patterns/component-shape.md`: under *Icons & controls*, interactive controls must render
  through the canonical `Button` / `Link` primitive — one source for the ≥44px hit area and the focus
  ring (`focus-visible:shadow-(--shadow-ring)`) — never a hand-rolled `<button>`/`<a>` that
  re-implements the recipe. `DESIGN.md` defines the `button-primary`/`-secondary`/`-ghost` recipes;
  the primitive graduates them. Added the matching review flag (hand-rolled control duplicating the
  primitive's hit area / focus ring). Without it ~7 KIT controls reinvented the control and the focus
  treatment had already drifted (one on `focus-visible:outline-*`, the rest on the ring token).
- Promoted from corrections-log `SC-2026-06-23-0c01` (gap, fact@1). Pairs with the design-review
  Pillar-6 focus-ring observation.

## 2026-06-20 — Styling retargeted: vanilla-extract → Tailwind v4 (dark-only)

- The brief now locks **Tailwind v4** — tokens generated from a `@google/design.md` `DESIGN.md` into the
  `@theme` block — and a **dark-only** system, replacing the vanilla-extract theme-contract direction.
  Rewrote `references/patterns/styling.md` end to end: `@theme` tokens as the single source of truth
  (never a hand-edited parallel CSS), **no arbitrary values**, `tailwind-variants` for variants/recipes,
  Tailwind's stock 4px spacing, z-index from a token scale. Removed the `*.css.ts` /
  `createThemeContract` / dark+light model and the draft-era "open call to confirm" note.
- `SKILL.md`: §9 plus the description, stack line, reference-index row, and quick-checklist item
  retargeted to Tailwind; §18 now cross-refs `solidstats-frontend-react-design` / `-design-review`
  (design governs the visual system, these conventions govern the code).
- `references/project-patterns.md`: the `*.css.ts` path mapping → `src/styles/theme.css`; added an
  arbitrary-Tailwind-value smell search.
- Breakpoints and content width are **not** restated here — the single source is
  `solidstats-frontend-react-design/references/design-system.md`.

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

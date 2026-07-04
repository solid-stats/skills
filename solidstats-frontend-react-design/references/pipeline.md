# SolidStats Design Pipeline Overlay

This file adds SolidStats-specific inputs to the global `design` workflow. It does not redefine the
generic prototype structure, implementation surface spec, or production review checklist.

## 1. Prototype Stage

Global owner: `design/references/visual-prototype.md`.

Local workspace: `web/.visual-prototypes/`.

Local additions for `BRIEF.md`, prototype slices, `ITERATIONS.md`, and accepted `SUMMARY.md`:

- `DESIGN.md`, generated `theme.css`, accepted Ladle UIKIT decisions, and `.design/CLAUDE.md` as
  visual inputs;
- `server-2` shapes or known OpenAPI paths that affect visible fields;
- SolidStats roles that affect layout: signed-out visitor, player, moderator, admin;
- representative replay-derived values and min/max data volumes;
- data-trust states: provenance, freshness, Known, Unknown, Conflict, stale;
- RU/EN copy risks, long player/squad names, localized dates and numbers;
- stats-product density: enough rows, comparisons, filters, and numeric columns to make the layout
  honest.

Prototype artifacts remain disposable. Do not import production components and do not port prototype
source into `packages/design`.

## 2. Implementation Surface Spec

Global owner: `design/references/implementation-surface-spec.md`.

SolidStats overlay: [`implementation-surface-overlay.md`](implementation-surface-overlay.md).

Start only after the relevant prototype slice has an accepted `SUMMARY.md`. The spec belongs to app
development and may become GSD `CONTEXT` and `VALIDATION`; it is not a prototype artifact.

Add SolidStats-specific acceptance for:

- real API fields and typed client paths from `server-2`;
- domain formulas and internally consistent fixture data;
- role differences and denied states;
- freshness/SSE/cache behavior;
- RU/EN typed ICU strings;
- public stats continuity: SSR before JS, no CLS, Back restores table state, scroll, virtualized
  position, and Query cache.

## 3. Ladle Catalog

Implement accepted directions in the durable Ladle UIKIT catalog on the real stack:

- Ark UI headless primitives;
- Tailwind v4 utilities from generated theme tokens;
- Lucide icons only;
- dark-only SolidStats visual system;
- colocated stories covering component states, data volumes, and important variants.

Ladle is the component catalog and the Playwright isolation harness. The story is the seed of the
production route, not a throwaway demo.

## 4. Production Review

Global owner: `design/references/production-review.md`.

SolidStats owner: `solidstats-frontend-react-design-review`.

Run the global production baseline first, then add SolidStats overlay checks:

- token adherence to `DESIGN.md`/`theme.css`, no arbitrary Tailwind values;
- real-width screenshots at project breakpoints from `references/design-system.md`;
- structural parity with accepted hi-fi or `SUMMARY.md` where relevant;
- data-trust, freshness, role, RU/EN, and replay-formula correctness;
- public-page SEO/SSR/cache/back-navigation behavior.

## 5. Route Graduation

Pages compose catalogued components into TanStack Start routes per
`solidstats-frontend-react-conventions`: loaders, Query cache prefill, SSR/head/meta, route splitting,
FSD placement, and typed API boundaries.

Commit the implementation spec with the code it governs. If the work creates a durable SolidStats
design rule, record it in `web/.design/CLAUDE.md` so later surfaces inherit it.

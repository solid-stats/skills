# SolidStats Design Pipeline Overlay

This file adds SolidStats-specific inputs to the global `design` workflow. It does not redefine the
generic prototype structure, implementation surface spec, or production review checklist.

## 1. Prototype Stage

**As of 2026-08-01, this stage runs in the live Claude Design project** ("Solid Stats — Design
System"), not `design/references/visual-prototype.md`'s in-repo `BRIEF.md`/`ITERATIONS.md`/
`SUMMARY.md` slice structure. That in-repo workflow at `web/.visual-prototypes/` (adopted
2026-07-04) is itself superseded, for the same reason it replaced package-based Ladle prototyping:
iterating on prototypes as in-repo code cost too much time and tokens. See `web/.planning/PROJECT.md`
for the decision log.

Bring these SolidStats concerns into each surface designed in Claude Design:

- `DESIGN.md`, generated `theme.css`, and `.design/CLAUDE.md` as visual inputs;
- `server-2` shapes or known OpenAPI paths that affect visible fields;
- SolidStats roles that affect layout: signed-out visitor, player, moderator, admin;
- representative replay-derived values and min/max data volumes;
- data-trust states: provenance, freshness, Known, Unknown, Conflict, stale;
- RU/EN copy risks, long player/squad names, localized dates and numbers;
- stats-product density: enough rows, comparisons, filters, and numeric columns to make the layout
  honest.

Pull the accepted surface locally with `DesignSync` only once it's ready to spec. Do not port
Claude Design's fake-stack mockup code directly into the app — surfaces are rebuilt natively.

## 2. Implementation Surface Spec

Global owner: `design/references/implementation-surface-spec.md`.

SolidStats overlay: [`implementation-surface-overlay.md`](implementation-surface-overlay.md).

Start only after the relevant surface is accepted in Claude Design. The spec belongs to app
development and may become GSD `CONTEXT` and `VALIDATION`; it is not a prototype artifact.

Add SolidStats-specific acceptance for:

- real API fields and typed client paths from `server-2`;
- domain formulas and internally consistent fixture data;
- role differences and denied states;
- freshness/SSE/cache behavior;
- RU/EN typed ICU strings;
- public stats continuity: SSR before JS, no CLS, Back restores table state, scroll, virtualized
  position, and Query cache.

## 3. Build (optionally via a Ladle catalog)

`web` is single-package with no active Ladle catalog today; one may return later as a component
isolation harness, but it is optional, not a required stage (`.legacy/ladle-design/` holds the
retired package-based catalog). Build accepted directions in `src/` on the real stack either way:

- Ark UI headless primitives;
- Tailwind v4 utilities from generated theme tokens;
- Lucide icons only;
- dark-only SolidStats visual system;
- component states, data volumes, and important variants covered by tests or stories.

If a Ladle catalog is in use, colocated stories are the component catalog and the Playwright
isolation harness, and the story is the seed of the production route, not a throwaway demo.

## 4. Production Review

Global owner: `design/references/production-review.md`.

SolidStats owner: `solidstats-frontend-react-design-review`.

Run the global production baseline first, then add SolidStats overlay checks:

- token adherence to `DESIGN.md`/`theme.css`, no arbitrary Tailwind values;
- real-width screenshots at project breakpoints from `references/design-system.md`;
- structural parity with the accepted Claude Design surface;
- data-trust, freshness, role, RU/EN, and replay-formula correctness;
- public-page SEO/SSR/cache/back-navigation behavior.

## 5. Route Graduation

Pages compose catalogued components into TanStack Start routes per
`solidstats-frontend-react-conventions`: loaders, Query cache prefill, SSR/head/meta, route splitting,
FSD placement, and typed API boundaries.

Commit the implementation spec with the code it governs. If the work creates a durable SolidStats
design rule, record it in `web/.design/CLAUDE.md` so later surfaces inherit it.

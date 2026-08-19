# SolidStats Design Pipeline Overlay

This file adds SolidStats inputs to the global `design` workflow. It does not redefine the generic
prototype documents, implementation surface spec, or production review checklist.

## 1. Prototype Stage

Use the global `design/references/visual-prototype.md` workflow:

1. Write `BRIEF.md` under `web/.visual-prototypes/<slice>/`.
2. Design and review the slice in Penpot `App Design`
   (`5954a801-37cf-8094-8008-81f63a8ba3d3`).
3. Record passes in `ITERATIONS.md`.
4. Accept the slice in local `SUMMARY.md`.
5. File the accepted summary in the SolidStats MemPalace `design` room with the local path and
   Penpot page/board references.

Use one Penpot page per application page. State, role, breakpoint, and flow variants are boards on
that page. Screens must use connected `SolidStats UIKit`
(`3be9e5e1-190f-8090-8008-724cff55ab11`) instances and token references.

Bring these SolidStats concerns into each surface:

- `DESIGN.md` and generated `theme.css`;
- `server-2` fields or known OpenAPI paths;
- signed-out visitor, player, moderator, and admin roles;
- representative replay-derived values and min/max data volumes;
- provenance, freshness, Known, Unknown, Conflict, and stale states;
- RU/EN copy risks, long player/squad names, localized dates and numbers;
- enough rows, comparisons, filters, and numeric columns to make density honest.

## 2. Implementation Surface Spec

Global owner: `design/references/implementation-surface-spec.md`.

SolidStats overlay:
[`implementation-surface-overlay.md`](implementation-surface-overlay.md).

Start only after the relevant local `SUMMARY.md` is accepted. Add:

- real API fields and typed client paths from `server-2`;
- domain formulas and internally consistent fixture data;
- role differences and denied states;
- freshness/SSE/cache behavior;
- RU/EN typed ICU strings;
- public stats continuity: SSR before JS, no CLS, and Back restoring filters, sorting, scroll,
  virtualized position, and Query cache.

## 3. Ladle Catalog

Ladle is mandatory for the UIKit. Build the fresh catalog under `src/shared/uikit/`;
`.legacy/ladle-design/` is reference only. Implement accepted directions with:

- Ark UI headless primitives;
- Tailwind v4 utilities from generated theme tokens;
- Lucide icons only;
- the dark-only SolidStats visual system;
- colocated stories covering component states, data volumes, and important variants;
- component tests alongside the story.

## 4. Production Review

Run the global `design/references/production-review.md` baseline, then the
`solidstats-frontend-react-design-review` overlay:

- token adherence to `DESIGN.md` and `theme.css`;
- parity with the accepted Penpot boards and local `SUMMARY.md`;
- real-width screenshots at project breakpoints;
- data-trust, freshness, role, RU/EN, and replay-formula correctness;
- public-page SEO, SSR, cache, and back-navigation behavior.

## 5. Route Graduation

Pages compose catalogued components into TanStack Start routes per
`solidstats-frontend-react-conventions`: loaders, Query cache prefill, SSR/head/meta, route
splitting, FSD placement, and typed API boundaries.

Commit the implementation spec with the code it governs. Durable accepted visual decisions remain
in the slice `SUMMARY.md` and its SolidStats MemPalace summary.

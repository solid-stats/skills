---
name: solidstats-frontend-react-design
description: >
  SolidStats-specific overlay for the global `design` skill when creating, prototyping, or
  implementing UI for the `web` frontend. The global skill owns the generic workflow:
  discussion -> non-GSD brief -> visual prototype -> accepted design -> implementation
  surface spec -> production review. This skill adds only SolidStats inputs and rules:
  DESIGN.md/theme.css, the live Claude Design project as the prototype tool, .design/CLAUDE.md,
  server-2 OpenAPI shapes, roles, data trust, replay-derived numbers, RU/EN copy fit, and the dark
  stats-product visual language. Use this with the global `design` skill for any SolidStats web
  design task.
  Triggers: "SolidStats UI", "web design", "new SolidStats screen", "prototype SolidStats",
  "Claude Design", "DESIGN.md", "stats screen", "спроектируй экран SolidStats",
  "прототип SolidStats", "дизайн SolidStats".
---

# SolidStats Frontend Design Overlay

This skill is not the generic design workflow. Read the global `design` skill first, then apply this
overlay for the SolidStats `web` repo.

- New or substantially recomposed UI: designed in the live Claude Design project (see Stage
  Boundary below), not via global `design/references/visual-prototype.md`'s in-repo slice structure.
- Accepted design moving into app development: global
  `design/references/implementation-surface-spec.md` owns the base implementation contract; this
  skill's [`references/implementation-surface-overlay.md`](references/implementation-surface-overlay.md)
  adds SolidStats fields.
- Implemented UIKit and routes (built, tested, and catalogued as Ladle stories first): global
  `design/references/production-review.md` owns the production review baseline;
  `solidstats-frontend-react-design-review` adds the SolidStats overlay.
- Code-level HOW lives in
  [`solidstats-frontend-react-conventions`](../solidstats-frontend-react-conventions/SKILL.md).

## Stage Boundary

SolidStats UI work has two separate stages:

1. **Prototype stage (2026-08-01)** - design the surface directly in the live Claude Design
   project ("Solid Stats — Design System"), then pull the accepted result locally with
   `DesignSync` once it's ready to spec. This replaced the in-repo `web/.visual-prototypes/`
   workflow (2026-07-04), which itself replaced package-based Ladle prototyping (2026-06) — both
   were dropped because iterating on prototypes as in-repo code cost too much time and tokens.
2. **Implementation stage** - GSD may start after a surface is accepted in Claude Design:
   implementation surface spec -> build the UIKit in Ladle (components implemented, tested, and
   catalogued as colocated stories) -> production review -> TanStack Start route.

GSD does not participate in prototyping. A design can be split by page, flow, role, breakpoint
family, or hard layout problem, same as the in-repo slices were.

## Locked Stack And Quality Order

Stack: TanStack Start SSR + Router + Query + Table, Ark UI headless primitives, Tailwind v4 theme
tokens only, Lucide icons only, typed ICU i18n (`/ru` and `/en`), dark-only gunmetal theme,
Node/Docker, SSE realtime.

Quality order from the product brief: UX continuity -> accessibility -> SEO -> Core Web Vitals and
bundle budgets -> visual polish. Prototype review covers only visual/layout quality; production
review covers the full quality bar.

## SolidStats Inputs

Use these as the local source material:

- the live Claude Design project "Solid Stats — Design System" as the active design source, synced
  locally with `DesignSync`;
- repo-root `DESIGN.md` as the token/design-system source of truth;
- generated `src/styles/theme.css` as build output, never hand-edited (`web` is single-package —
  there is no `packages/design`);
- `web/.design/CLAUDE.md` for live domain/design rules and learned surface notes;
- `web/.design/hifi/*` and `.legacy/ladle-design/` only as frozen historical visual/code reference,
  never as portable code — see `web/.design/README.md`;
- `server-2` OpenAPI types for real API fields;
- SolidStats roles: signed-out visitor, player, moderator, admin;
- replay-derived formulas and representative values;
- RU/EN typed ICU strings, long Russian labels, localized dates and numbers.

## Prototype Overlay

The active prototype surface is the live Claude Design project. `checklist.design` intake and the
Selectel readiness baseline still apply. Add these SolidStats concerns to each surface designed
there:

- stats/operations density: enough rows, columns, comparisons, and counts to test the layout;
- first-viewport priority: identity and headline stats high, secondary detail lower;
- data trust: provenance, freshness, Known/Unknown/Conflict/stale states where numbers can be
  disputed;
- roles that change layout or permissions;
- RU/EN copy fit, especially long Russian labels and player/squad names;
- replay-derived values that obey real formulas instead of decorative random data;
- visual adherence to `DESIGN.md` and generated `theme.css`.

Do not port Claude Design's fake-stack mockup code directly into the app — surfaces are rebuilt
natively on the real stack. The accepted surface and screenshots (pulled via `DesignSync`) are the
handoff, not the mockup source.

## Implementation Overlay

After a surface is accepted in Claude Design, start from global
`design/references/implementation-surface-spec.md`, then fill the SolidStats additions from
[`references/implementation-surface-overlay.md`](references/implementation-surface-overlay.md):

- real `server-2` OpenAPI fields and cache/live boundaries;
- domain formulas such as Score and K-D so fixture data is internally consistent;
- role differences for visitor/player/moderator/admin;
- freshness, provenance, and data-trust states;
- RU/EN strings, ICU pluralization, and localized numbers/dates;
- SolidStats public-page continuity such as SSR before JS and Back restoring table state, scroll,
  virtualized position, and Query cache.

The durable implementation is built in `src/` on the real stack. Ladle is mandatory for the UIKit:
shared components are implemented, tested, and catalogued as colocated stories there before pages
compose them into routes — see `.planning/PROJECT.md` in `web`. The retired package-based catalog at
`.legacy/ladle-design/` is reference only; the new one is built fresh under `src/shared/uikit/`.

## Non-Negotiable SolidStats Design Rules

- Lay pages as full-width stacked sections. Avoid two mismatched-height columns unless the content is
  naturally equal.
- Section order follows information priority. Headline data sits high, right after identity and top
  stats.
- Design overflow and edge states, not only the happy path. Every list answers what happens at 0,
  few, many, and limit-reached.
- No nested scroll on mobile. Use top-N plus "show all" rather than scroll-in-card on narrow widths.
- Data trust is a designed layer: provenance, freshness, Known/Unknown/Conflict/stale states are
  first-class UI, not decorative badges.
- Never color-alone. Pair semantic color with an icon or label. Use tabular mono for numbers.
- RU and EN are both real product copy. Check long labels, pluralization, and status symmetry.

## Reference Index

- [`references/design-system.md`](references/design-system.md) - SolidStats `DESIGN.md` and token
  workflow notes.
- [`references/pipeline.md`](references/pipeline.md) - SolidStats overlay across prototype,
  implementation, Ladle, review, and route graduation.
- [`references/implementation-surface-overlay.md`](references/implementation-surface-overlay.md) -
  SolidStats additions to the global implementation surface spec.

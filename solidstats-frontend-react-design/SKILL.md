---
name: solidstats-frontend-react-design
description: >
  SolidStats-specific overlay for the global `design` skill when creating, prototyping, or
  implementing UI for the `web` frontend. The global skill owns the generic workflow:
  discussion -> non-GSD brief -> visual prototype -> accepted SUMMARY.md -> implementation
  surface spec -> production review. This skill adds only SolidStats inputs and rules:
  DESIGN.md/theme.css, Ladle UIKIT, .design/CLAUDE.md, server-2 OpenAPI shapes, roles, data
  trust, replay-derived numbers, RU/EN copy fit, and the dark stats-product visual language.
  Use this with the global `design` skill for any SolidStats web design task.
  Triggers: "SolidStats UI", "web design", "new SolidStats screen", "prototype SolidStats",
  "Ladle UIKIT", "DESIGN.md", "stats screen", "спроектируй экран SolidStats",
  "прототип SolidStats", "UIKIT SolidStats".
---

# SolidStats Frontend Design Overlay

This skill is not the generic design workflow. Read the global `design` skill first, then apply this
overlay for the SolidStats `web` repo.

- New or substantially recomposed UI: global `design/references/visual-prototype.md` owns the
  prototype stage.
- Accepted prototype moving into app development: global
  `design/references/implementation-surface-spec.md` owns the base implementation contract; this
  skill's [`references/implementation-surface-overlay.md`](references/implementation-surface-overlay.md)
  adds SolidStats fields.
- Implemented Ladle stories or routes: global `design/references/production-review.md` owns the
  production review baseline; `solidstats-frontend-react-design-review` adds the SolidStats overlay.
- Code-level HOW lives in
  [`solidstats-frontend-react-conventions`](../solidstats-frontend-react-conventions/SKILL.md).

## Stage Boundary

SolidStats UI work has two separate stages:

1. **Prototype stage** - discussion -> non-GSD `BRIEF.md` -> one or more
   `web/.visual-prototypes/` slices -> `ITERATIONS.md` -> accepted `SUMMARY.md`.
2. **Implementation stage** - GSD may start after accepted `SUMMARY.md`: implementation surface
   spec -> durable Ladle/UIKIT story -> production review -> TanStack Start route.

GSD does not participate in prototyping. A prototype can be split by page, flow, role, breakpoint
family, or hard layout problem.

## Locked Stack And Quality Order

Stack: TanStack Start SSR + Router + Query + Table, Ark UI headless primitives, Tailwind v4 theme
tokens only, Lucide icons only, typed ICU i18n (`/ru` and `/en`), dark-only gunmetal theme,
Node/Docker, SSE realtime.

Quality order from the product brief: UX continuity -> accessibility -> SEO -> Core Web Vitals and
bundle budgets -> visual polish. Prototype review covers only visual/layout quality; production
review covers the full quality bar.

## SolidStats Inputs

Use these as the local source material:

- repo-root `DESIGN.md` as the token/design-system source of truth;
- generated `packages/design/src/styles/theme.css` as build output, never hand-edited;
- colocated Ladle stories in `packages/design/src/shared/uikit/` as the durable UIKIT catalog;
- `web/.design/CLAUDE.md` for live domain/design rules and learned surface notes;
- `web/.design/hifi/*` only as frozen historical visual reference, never as portable code;
- `server-2` OpenAPI types for real API fields;
- SolidStats roles: signed-out visitor, player, moderator, admin;
- replay-derived formulas and representative values;
- RU/EN typed ICU strings, long Russian labels, localized dates and numbers.

## Prototype Overlay

The active prototype workspace is `web/.visual-prototypes/`. The global `design` skill owns the
standard directory structure and docs (`BRIEF.md`, `ITERATIONS.md`, `SUMMARY.md`), `checklist.design`
intake, and the Selectel readiness baseline. Add these SolidStats concerns to each relevant slice:

- stats/operations density: enough rows, columns, comparisons, and counts to test the layout;
- first-viewport priority: identity and headline stats high, secondary detail lower;
- data trust: provenance, freshness, Known/Unknown/Conflict/stale states where numbers can be
  disputed;
- roles that change layout or permissions;
- RU/EN copy fit, especially long Russian labels and player/squad names;
- replay-derived values that obey real formulas instead of decorative random data;
- visual adherence to `DESIGN.md`, generated `theme.css`, and accepted Ladle UIKIT decisions.

Do not import production components into prototypes and do not port prototype source into
`packages/design`. The accepted `SUMMARY.md` and screenshots are the handoff, not the throwaway
source code.

## Implementation Overlay

After a prototype slice is accepted, start from global
`design/references/implementation-surface-spec.md`, then fill the SolidStats additions from
[`references/implementation-surface-overlay.md`](references/implementation-surface-overlay.md):

- real `server-2` OpenAPI fields and cache/live boundaries;
- domain formulas such as Score and K-D so fixture data is internally consistent;
- role differences for visitor/player/moderator/admin;
- freshness, provenance, and data-trust states;
- RU/EN strings, ICU pluralization, and localized numbers/dates;
- SolidStats public-page continuity such as SSR before JS and Back restoring table state, scroll,
  virtualized position, and Query cache.

The durable implementation starts in Ladle on the real stack. Ladle stories are the UIKIT catalog,
the component isolation harness, and the seed of production routes.

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

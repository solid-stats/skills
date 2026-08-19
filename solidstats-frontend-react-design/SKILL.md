---
name: solidstats-frontend-react-design
description: >
  SolidStats-specific overlay for the global `design` skill when creating, prototyping, or
  implementing UI for the `web` frontend. The global skill owns the generic workflow:
  discussion → local brief → Penpot prototype → accepted summary → implementation surface
  spec → production review. This skill adds the SolidStats Penpot files, DESIGN.md/theme.css,
  server-2 OpenAPI shapes, roles, data trust, replay-derived numbers, RU/EN copy fit, and the dark
  stats-product visual language. Use it with the global `design` skill for any SolidStats web
  design task.
  Triggers: "SolidStats UI", "web design", "new SolidStats screen", "prototype SolidStats",
  "Penpot", "App Design", "DESIGN.md", "stats screen", "спроектируй экран SolidStats",
  "прототип SolidStats", "дизайн SolidStats".
---

# SolidStats Frontend Design Overlay

Read the global `design` skill first, then apply this overlay for the SolidStats `web` repo.

- New or substantially recomposed UI: use the global visual-prototype workflow, with local slice
  documents under `web/.visual-prototypes/` and the visual artifact in Penpot `App Design`.
- Accepted design moving into app development: global
  `design/references/implementation-surface-spec.md` owns the base contract; this skill's
  [implementation overlay](references/implementation-surface-overlay.md) adds SolidStats fields.
- Implemented UIKit and routes: global `design/references/production-review.md` owns the baseline;
  `solidstats-frontend-react-design-review` adds the SolidStats overlay.
- Code-level HOW lives in
  [`solidstats-frontend-react-conventions`](../solidstats-frontend-react-conventions/SKILL.md).

## Stage Boundary

SolidStats UI work has two separate stages:

1. **Prototype stage (2026-08-19)** — write `BRIEF.md` and `ITERATIONS.md` under
   `web/.visual-prototypes/<slice>/`, then design and review the screens in Penpot `App Design`
   (`5954a801-37cf-8094-8008-81f63a8ba3d3`). Use one Penpot page per application page. Assemble
   screens from connected `SolidStats UIKit` instances and token references. Once accepted, write
   the local `SUMMARY.md` and file its summary in the SolidStats MemPalace `design` room.
2. **Implementation stage** — GSD may start after the local summary is accepted: implementation
   surface spec -> build the UIKit in Ladle -> production review -> TanStack Start route.

GSD does not participate in prototyping. A slice can cover one page, flow, role, breakpoint family,
or hard layout problem.

## Locked Stack And Quality Order

Stack: TanStack Start SSR + Router + Query + Table, Ark UI headless primitives, Tailwind v4 theme
tokens only, Lucide icons only, typed ICU i18n (`/ru` and `/en`), dark-only gunmetal theme,
Node/Docker, SSE realtime.

Quality order from the product brief: UX continuity -> accessibility -> SEO -> Core Web Vitals and
bundle budgets -> visual polish. Prototype review covers visual/layout quality; production review
covers the full quality bar.

## SolidStats Inputs

- Penpot `App Design` (`5954a801-37cf-8094-8008-81f63a8ba3d3`) is the active screen-design file.
- Penpot `SolidStats UIKit` (`3be9e5e1-190f-8090-8008-724cff55ab11`) is the connected shared
  component and token library.
- Repo-root `DESIGN.md` is the token/design-system source of truth.
- Generated `src/styles/theme.css` is build output and is never hand-edited.
- `web/.visual-prototypes/<slice>/` stores `BRIEF.md`, `ITERATIONS.md`, and `SUMMARY.md`.
- The SolidStats MemPalace `design` room stores accepted summary recall, not draft iterations.
- `web/.design/` and `.legacy/ladle-design/` are frozen historical references, never portable
  code or active design authority.
- `server-2` OpenAPI types provide real API fields.
- Roles are signed-out visitor, player, moderator, and admin.
- Fixture values obey replay-derived formulas.
- RU/EN typed ICU strings must fit long Russian labels and localized dates/numbers.

## Prototype Overlay

Apply the global checklist intake and Selectel readiness baseline, then add:

- enough rows, columns, comparisons, and counts to test stats/operations density;
- identity and headline stats high in the first viewport;
- provenance, freshness, Known/Unknown/Conflict/stale states where numbers can be disputed;
- role variants that change layout or permissions;
- RU/EN copy fit, especially long Russian labels and player/squad names;
- internally consistent replay-derived values;
- visual adherence to `DESIGN.md`, generated `theme.css`, and connected UIKit instances.

The Penpot page maps to the application page. Put state, role, breakpoint, and flow boards on that
page with clear names; do not create a separate Penpot file per slice.

## Implementation Overlay

After a local `SUMMARY.md` is accepted, use global
`design/references/implementation-surface-spec.md`, then add:

- real `server-2` OpenAPI fields and cache/live boundaries;
- domain formulas such as Score and K-D;
- visitor/player/moderator/admin differences;
- freshness, provenance, and data-trust states;
- RU/EN strings, ICU pluralization, and localized numbers/dates;
- SSR before JS and Back restoring table state, scroll, virtualized position, and Query cache.

The durable implementation is built in `src/` on the real stack. Ladle is mandatory for the
UIKit: shared components are implemented, tested, and catalogued as colocated stories before pages
compose them into routes. The retired catalog at `.legacy/ladle-design/` is reference only.

## Non-Negotiable SolidStats Design Rules

- Lay pages as full-width stacked sections. Avoid mismatched-height columns unless the content is
  naturally equal.
- Section order follows information priority. Headline data sits high, after identity and top stats.
- Design overflow and edge states. Every list answers what happens at 0, few, many, and the limit.
- No nested scroll on mobile. Use top-N plus "show all" on narrow widths.
- Data trust is a designed layer, not decorative badges.
- Never rely on color alone. Pair semantic color with an icon or label.
- Use tabular mono for numbers.
- RU and EN are both real product copy.

## Reference Index

- [`references/design-system.md`](references/design-system.md) — SolidStats token workflow.
- [`references/pipeline.md`](references/pipeline.md) — prototype, implementation, Ladle, review,
  and route graduation.
- [`references/implementation-surface-overlay.md`](references/implementation-surface-overlay.md) —
  SolidStats additions to the global implementation surface spec.

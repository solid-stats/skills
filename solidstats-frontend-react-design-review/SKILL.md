---
name: solidstats-frontend-react-design-review
description: >
  SolidStats-specific overlay for reviewing the `web` frontend UI. Use it with the global
  `design` skill: prototype review uses the global visual-prototype baseline plus this overlay;
  production review uses the global production-review baseline plus this overlay and
  solidstats-shared-review-standards. This skill adds SolidStats concerns only: DESIGN.md/theme.css
  token adherence, no arbitrary Tailwind values, project breakpoints, Ladle/UIKIT parity, data trust,
  replay-derived numbers, roles, RU/EN copy, public stats SSR/Back continuity, and dark stats-product
  visual language. Code-level defects go to solidstats-frontend-react-code-review.
  Triggers: "review SolidStats UI", "design review web", "UI audit SolidStats", "visual QA",
  "check SolidStats screen", "проверь UI SolidStats", "ревью дизайна SolidStats",
  "визуальное ревью web".
---

# SolidStats Frontend Design Review Overlay

This skill is not the generic UI review baseline. Read the global `design` skill first:

- prototype artifacts: `design/references/visual-prototype.md`;
- implemented Ladle stories/routes: `design/references/production-review.md`;
- visual evidence: `design/references/visual-evidence.md`.

For production review, also read
[`solidstats-shared-review-standards`](../solidstats-shared-review-standards/SKILL.md) for severity,
report shape, verdict rules, and read-only default. Code-level bugs, typing, routing, state machines,
and data flow belong to `solidstats-frontend-react-code-review`.

## Review Modes

**Prototype review** applies to `web/.visual-prototypes/` and other disposable mockups. Run the
global prototype review baseline, then add SolidStats checks for stats density, data trust, roles,
RU/EN copy fit, `DESIGN.md` visual adherence, and UIKIT consistency. Skip production gates:
`design.md lint`, axe, keyboard behavior, Ark behavior, exact Tailwind merge behavior, CLS tooling,
tests, SEO, and component API correctness. Return one decision: iterate, accept for `SUMMARY.md`, or
reject.

**Production review** applies to durable Ladle stories and TanStack Start routes. Run the global
production review baseline first, then apply the SolidStats overlay below. Map findings into the
shared review-standards format or the GSD `UI-REVIEW.md` artifact when GSD owns the phase.

Prototype approval is not production approval. It only accepts the visual direction for
`SUMMARY.md`.

## SolidStats Production Overlay

### 1. Token And System Adherence

- `DESIGN.md` is the source of truth; generated `theme.css` is build output.
- No arbitrary Tailwind values (`bg-[#...]`, `p-[7px]`, `text-[13px]`, `w-[317px]`).
- Dark-only gunmetal theme, one cyan interactive accent, Lucide icons only.
- Tabular mono numbers; numeric table columns are right-aligned.
- Semantic color is never color-alone: pair it with an icon and/or label.

### 2. Project Widths And Accepted Visual Direction

- Use the project breakpoint/content-width strategy from
  `solidstats-frontend-react-design/references/design-system.md`, including 1920, 2560, 4K, and
  ultrawide checks where relevant.
- Assert the rendered container width, not only the browser/device-frame viewport.
- Compare against accepted `SUMMARY.md`; use `.design/hifi/*` only when it is the named historical
  reference for the surface.
- Check structural parity: dropped or invented elements, affordances, controls, density choices, and
  interaction model are findings even when spacing looks polished.

### 3. SolidStats States And Data Volumes

- Render state/data variants at real content width, not only inside narrow matrix cells.
- Verify forced visual-state cells against real pseudo-states when the story uses hardcoded
  `data-state` or class overrides.
- Loading skeletons reserve the final height and table geometry.
- Back restores table state, sorting/filtering, scroll offset, virtualized position, and Query cache
  without blocking reload or visible jump.
- SSE updates do not steal focus, reorder above the viewport, or shift layout.

### 4. Domain, Trust, And Roles

- Data trust is present and honest: provenance, freshness, Known, Unknown, Conflict, stale.
- Unknown is not rendered as `0` or a plain dash when the distinction matters.
- Mock numbers obey SolidStats formulas and do not contradict known real data.
- Role variants are visually covered where they affect layout or permissions: visitor, player,
  moderator, admin.
- Pending workflow events render as quiet inline state unless the action is blocking.

### 5. RU/EN And Status Vocabulary

- RU and EN both read naturally and fit at the narrowest relevant width.
- ICU plurals, localized numbers, and dates are used where applicable.
- Status vocabulary is fixed and symmetric across languages.
- Outcome/status badges match the `DESIGN.md` recipe; flag asymmetric copy such as a bare RU win
  letter paired with an abbreviated loss string.

### 6. Public Stats Pages

- Primary public stats are present in SSR HTML before client JS.
- Public/shareable routes have route-specific head metadata.
- JSON-LD is used only where it fits the entity.
- Canonical/noindex choices do not contradict the page's public purpose.

## Reference

- [`references/checklist.md`](references/checklist.md) - the SolidStats overlay checklist. Global
  `design` owns `checklist.design`, Selectel readiness, and the generic production-review pillars.

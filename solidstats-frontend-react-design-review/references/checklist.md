# SolidStats Design Review Overlay Checklist

The global `design` skill owns the generic prototype review baseline, `checklist.design`, Selectel
readiness, and production-review pillars. This checklist adds only SolidStats-specific checks.
Report production findings in the `solidstats-shared-review-standards` format.

## Prototype Review

Use for `web/.visual-prototypes/` and other prototype-stage mockups after the global prototype
baseline.

- [ ] Density fits a stats/operations product: useful rows, columns, counts, filters, and
      comparisons are visible without making the screen cramped.
- [ ] First viewport spends space on identity, headline stats, and the user's next action.
- [ ] Data trust is visible where numbers can be disputed: provenance, freshness,
      Known/Unknown/Conflict/stale.
- [ ] RU/EN copy, long names, numbers, and labels fit without clipping or awkward wrapping.
- [ ] Relevant role variants are represented: signed-out visitor, player, moderator, admin.
- [ ] Visual language follows `DESIGN.md`/UIKIT by eye: dark gunmetal, one cyan accent, Lucide-style
      iconography, tabular numbers, known card/table density.
- [ ] Decision is explicit: iterate, accept for `SUMMARY.md`, or reject.

## Production Review Overlay

Run after the global production-review baseline.

### Token And Visual System

- [ ] `DESIGN.md` is the source of truth; generated `theme.css` has not been hand-edited.
- [ ] No arbitrary Tailwind values in the reviewed surface.
- [ ] Dark-only gunmetal theme; no light-mode artifacts.
- [ ] Cyan is the single interactive accent and is not used as generic decoration.
- [ ] Lucide icons only; no emoji or ad-hoc Unicode glyphs as UI icons.
- [ ] Tabular mono for all numbers; numeric columns right-aligned.
- [ ] Semantic color is paired with icon and/or label.

### Project Widths And Structural Parity

- [ ] Rendered at the project breakpoints from `solidstats-frontend-react-design/references/design-system.md`,
      including wide desktop and ultrawide where relevant.
- [ ] Container width is asserted; device-frame viewport width is not trusted as content width.
- [ ] No label collisions, orphan tiles, clipped text, fake gutters, or trailing-gap air.
- [ ] Accepted `SUMMARY.md` structure is preserved.
- [ ] `.design/hifi/*` parity is checked only when that historical reference is explicitly named:
      dropped and invented elements/controls are both findings.

### States, Data Volumes, And Continuity

- [ ] State and data-volume variants render at real content width.
- [ ] Forced state-matrix cells are compared to real pseudo-states before approval.
- [ ] Loading skeletons reserve final table/card geometry and do not create scroll or CLS.
- [ ] Back restores filters, sort, scroll offset, virtualized position, and Query cache.
- [ ] SSE updates do not steal focus, reorder above the viewport, or shift layout.
- [ ] Mobile has no nested scroll; desktop table scroll is inside the table/card with sticky header.

### Domain And Trust

- [ ] Provenance is close to disputed numbers: source, replay count, last update.
- [ ] Freshness states are explicit: Up to date, Stale, Offline, Reconnecting.
- [ ] Known, Unknown, Conflict, and stale render as distinct designed states.
- [ ] Unknown is not displayed as `0` or a plain dash when it changes meaning.
- [ ] Mock/demo values obey Score/K-D and other SolidStats formulas.
- [ ] Role variants affecting UI are covered: visitor, player, moderator, admin.

### RU/EN And Public Stats

- [ ] RU and EN both read naturally and fit at narrow widths.
- [ ] ICU plurals, localized numbers, and localized dates are used where relevant.
- [ ] Status/outcome vocabulary is symmetric across languages and matches `DESIGN.md` recipes.
- [ ] Public stats content is present in SSR HTML before client JS.
- [ ] Public/shareable pages have correct route head metadata and canonical/noindex behavior.

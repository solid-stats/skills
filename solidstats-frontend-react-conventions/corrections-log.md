# Corrections log — solidstats-frontend-react-conventions

Append-only journal of agent-discovered divergences (process-skill-feedback SKILL.md §H). One block
per correction. Schema: `solidstats-process-skill-feedback/references/journal-schema.md`.

### SC-2026-06-23-0c01 · gap · fact · component-shape

```yaml
id: SC-2026-06-23-0c01
date: 2026-06-23
target_skill: solidstats-frontend-react-conventions
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "component-shape / styling"
topic: shared-interactive-base
dev_change: >
  Conventions has no rule mandating a shared interactive base primitive (Button / Link), even though
  DESIGN.md defines `button-primary` / `button-secondary` / `button-ghost` recipes. Result: across the
  KIT catalog ~7 components hand-roll their own `<button>` / `<a>` with duplicated class strings —
  NavBar/MobileTabBar items, Th sort button, DensityToggle, Pagination, Toast action, EmptyState/
  ErrorState actions, CompactList show-more — each re-implementing the ≥44px hit area + the focus ring,
  and they have already DRIFTED (Toast action uses `focus-visible:outline-*`, the rest use
  `focus-visible:shadow-(--shadow-ring)`). Conventions should mandate consuming a shared Button/Link
  primitive for interactive controls (one canonical focus ring + hit area), and `*-code-review` should
  flag hand-rolled `<button>`/`<a>` that duplicate it.
code:
  file: "packages/design/src/shared/uikit/Toast/Toast.tsx"
  line: 1
  source: agent-snippet
  status: negative-example
  snippet: |
    // Toast action: focus-visible:outline-2 focus-visible:outline-primary   (drift)
    // Th / DensityToggle / Pagination / NavBar: focus-visible:shadow-(--shadow-ring)
rationale: >
  DESIGN.md prescribes button recipes but no primitive graduates them, so every component reinvents
  the control and the focus treatment has already diverged — a canonical gap, fact (promote@1).
  Pairs with the design-review Pillar-6 focus-ring-consistency observation.
status: promoted
signature: "gap|component-shape|mandate a shared Button/Link base; forbid hand-rolled duplicated controls"
```

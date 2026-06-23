# Corrections log — solidstats-frontend-react-design-review

Append-only journal of agent-discovered divergences (SKILL.md §H). One block per correction; PROMOTE
clusters and proposes rule edits. Schema: `solidstats-process-skill-feedback/references/journal-schema.md`.

### SC-2026-06-23-0d01 · gap · fact · Pillar 2

```yaml
id: SC-2026-06-23-0d01
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 2"
topic: hi-fi-conformance
dev_change: >
  Pillar 2's hi-fi check ("Matches the hi-fi / DESIGN.md intent — spacing rhythm, hierarchy, density")
  only catches spacing/hierarchy/density, so it missed STRUCTURAL element/affordance/model divergence
  from the binding `.design/hifi/*` reference (D-11). In Phase-2 it APPROVED KIT-01 nav-shell and
  KIT-02 data-table per-family, but UAT found both diverged structurally: nav dropped the Brand + the
  right utility cluster (search/lang/account) + the universal account affordance + the mobile 5th
  account tab (`shell.jsx`); the table INVENTED a DensityToggle (hi-fi derives density by device:
  `const density = device==='desktop' ? 'comfortable' : 'compact'`) and a Prev/Next Pagination with an
  «Это всё» marker (hi-fi has NO pager — total-in-caption + mobile show-more); the Skeleton used an
  opacity pulse vs the hi-fi's sweep shimmer (`@keyframes sk-sweep { transform: translateX(100%) }`,
  players.css). The pillar must require structural PARITY against `.design/hifi/*`: enumerate the
  reference's elements/affordances/model and flag every dropped OR invented one before APPROVE.
code:
  file: ".design/hifi/shell.jsx"
  line: 1
  source: agent-snippet
  status: positive-example
  snippet: |
    // shell.jsx: [Brand] [nav-links] [nav-right: search · lang · Account/SignIn]; mobile tabbar + 5th account tab
    // players.jsx L318: const density = (device === 'desktop' && !winMobile) ? 'comfortable' : 'compact'  (no DensityToggle, no pager)
rationale: >
  Canonical, objectively-checkable check that the skill lacks at adequate depth — a fact (promote@1).
  D-11 makes `.design/hifi/*` the binding semantic source, so structural conformance is not taste.
status: promoted
signature: "gap|Pillar 2|hi-fi structural element/affordance/model parity, not just spacing"
```

### SC-2026-06-23-0d02 · gap · fact · Pillar 4

```yaml
id: SC-2026-06-23-0d02
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 4"
topic: render-states
dev_change: >
  Pillar 4 (component states) was satisfied by the STORY declaring a state matrix, not by rendering
  and visually verifying each state cell. KIT-02 Table shipped APPROVED with broken ×7 states: the
  SELECTED row breaks the table-fixed column layout (a `position:relative` `<tr>` with an abspos
  `before:` bar shifts the cells); FOCUSED is pixel-identical to ENABLED (the row recipe maps
  `focused: ""` and has no `focus-within` styling); the LOADING cell renders real data, not the
  Skeleton (the story calls `dataTable(...)` without the `loading` flag). The pillar must RENDER each
  declared state and confirm it is correct + visually distinct — not trust the matrix's existence.
code:
  file: "packages/design/src/shared/uikit/Table/TableRow.tsx"
  line: 1
  source: agent-snippet
  status: negative-example
  snippet: |
    state: { enabled: "", hover: "...", pressed: "...", focused: "", selected: "", disabled: "..." }
    selected: { true: "bg-primary-weak before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary" }
rationale: >
  The skill granted APPROVE while three of seven states were visibly broken — a methodological gap,
  fact (promote@1): the pillar must exercise states, not read the spec.
status: promoted
signature: "gap|Pillar 4|render & verify each component state, don't trust the matrix exists"
```

### SC-2026-06-23-0d03 · gap · fact · Pillar 4

```yaml
id: SC-2026-06-23-0d03
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 4"
topic: render-data-volumes
dev_change: >
  Same root as 0d02 for data-volume states. KIT-02 CompactRow/DataVolumes shipped APPROVED while
  completely broken — no rows render at all (the `CompactList` is placed inside narrow `StateMatrix`
  grid cells where the wide row content collapses; captions wrap to three lines, cards are empty tall
  boxes). And the Table few-vs-limit-reached volumes are visually indistinguishable. The pillar must
  RENDER each ×4 data-volume at a REAL width (full-width labelled sections, not the shared narrow
  StateMatrix grid) and confirm rows actually appear and the volumes read differently.
code:
  file: "packages/design/src/shared/uikit/CompactRow/CompactRow.stories.tsx"
  line: 1
  source: agent-snippet
  status: negative-example
  snippet: |
    // DataVolumes wraps each <CompactList> in a narrow <StateCell> → rows do not render (verified via screenshot)
rationale: >
  APPROVE shipped a catalog page with zero visible rows — a fact, fixable at one occurrence: the
  pillar must render data-volumes at real width.
status: promoted
signature: "gap|Pillar 4|render each data-volume at real width, confirm rows actually appear"
```

### SC-2026-06-23-0d04 · gap · fact · Pillar 2

```yaml
id: SC-2026-06-23-0d04
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 2"
topic: measure-not-eyeball
dev_change: >
  APPROVE relied on declarative proxies (axe-clean, "box reserved") instead of MEASURING rendered
  pixels, so it missed: a permanent ~1–2px scrollbar on every Table AND on the loading Skeleton (the
  reserved viewport height `HEADER_H + visibleRows*ROW_H` ignores per-row/header border widths under
  border-collapse) — a skeleton must never scroll; a StatTile loading skeleton that omits the delta
  row → CLS when delta tiles load; and an INVISIBLE focus (SkipLink stays clipped on focus, see the
  tests-skill correction) plus FOCUSED==ENABLED — both axe-clean yet not visibly focused. Pillars 2/3
  must MEASURE: assert no stray scroll (scrollHeight ≤ clientHeight), skeleton box == final box, and
  that focus produces a visible computed change — axe-clean ≠ visible focus; box-reserved ≠ no scroll.
code:
  file: "packages/design/src/shared/uikit/Table/Table.tsx"
  line: 1
  source: agent-snippet
  status: negative-example
  snippet: |
    const viewportStyle = { height: `${HEADER_H + visibleRows * rowHeight}px` }  // ignores border widths → stray scroll
rationale: >
  Multiple shipped CLS/scroll/focus defects that a measured check catches and an eyeballed one does
  not — a methodological fact (promote@1).
status: promoted
signature: "gap|Pillar 2|measure CLS/scroll/focus pixels, don't trust axe-clean or box-reserved"
```

### SC-2026-06-23-0d05 · gap · fact · Pillar 5

```yaml
id: SC-2026-06-23-0d05
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 5"
topic: intermediate-breakpoints
dev_change: >
  Pillar 5 reviewed the mobile floor (360) and desktop but missed the INTERMEDIATE range: the desktop
  NavBar switches on at `@md` (container 448px) yet does not fit its 6 links + brand + right cluster
  until ~1024px, so it overflows at 640px and 768px (a dead zone). Also a CompactRow layout defect
  (huge vertical gap between nickname and squad from a `min-h-11` on the inline name) was missed. The
  pillar must review at the documented project breakpoints INCLUDING the mid-range (768, 1024), not
  just 360 + a wide desktop.
code:
  file: "packages/design/src/shared/uikit/AppShell/AppShell.tsx"
  line: 1
  source: agent-snippet
  status: negative-example
  snippet: |
    <div className="hidden @md:block"><NavBar .../></div>   // @md = 448px container → desktop nav shown but overflows at 640/768
rationale: >
  A real overflow at documented breakpoints the review should cover — fact, fixable at one occurrence.
status: promoted
signature: "gap|Pillar 5|review intermediate breakpoints (768/1024), not just 360 + desktop"
```

### SC-2026-06-23-0d06 · gap · fact · Pillar 6

```yaml
id: SC-2026-06-23-0d06
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 6"
topic: copy-vs-design-md
dev_change: >
  Pillar 6 (system & domain adherence) checks the status vocabulary but not OUTCOME copy against the
  DESIGN.md recipe, nor RU/EN symmetry. DESIGN.md `badge-outcome-*` specifies "W/L", but the shipped
  Badge renders RU `outcomeWin="П"` / `outcomeLoss="пор."` — asymmetric (bare letter vs abbreviation
  with a period) and divergent from the W/L the system prescribes. The pillar should check rendered
  copy against the DESIGN.md component recipe and flag RU/EN asymmetry.
code:
  file: "packages/design/src/shared/uikit/_fixtures/strings.ts"
  line: 69
  source: agent-snippet
  status: negative-example
  snippet: |
    outcomeWin: { ru: "П", en: "W" },
    outcomeLoss: { ru: "пор.", en: "L" },
rationale: >
  DESIGN.md is the authority and says W/L; the shipped copy diverges and is internally asymmetric —
  fact (promote@1).
status: promoted
signature: "gap|Pillar 6|check outcome/status copy vs DESIGN.md recipe + RU/EN symmetry"
```

### SC-2026-06-23-0d07 · gap · fact · Pillar 4

```yaml
id: SC-2026-06-23-0d07
date: 2026-06-23
target_skill: solidstats-frontend-react-design-review
repo: web
source: agent-discovered
signal: gap
class: fact
generalized: true
section: "Pillar 4"
topic: forced-state-cells-can-be-fake
dev_change: >
  Pillar 4 says component states must be "rendered and visually verified — not trusted from the story
  matrix's existence", but it assumes that if you render and look, you see the truth. You may not: a
  StateMatrix "hover/pressed/focused" cell forces the state via a hardcoded `data-state` / `className`
  override that does NOT mirror the live recipe. It can be variant-agnostic (one grey `bg-surface-3`
  for every variant's "hover") and, in the merge-free `tv()/lite` build, the override can even lose to
  the base and render the RESTING style. So a forced cell can be rendered, visually distinct, and
  still WRONG. Verified: a Button matrix rendered primary "hover" as grey, never the real cyan
  `primary-hover`, and the 02-07 design-review passed on those fake cells. Pillar 4 (and Pillar 2's
  "measure, don't eyeball") should require verifying each forced / `data-state` cell against the REAL
  pseudo-state — force `:hover` / `:active` via CDP `forcePseudoState`, or hover a real control and read
  computed styles — and treat a forced matrix as decorative until proven to mirror the recipe.
code:
  file: "packages/design/src/shared/uikit/Button/Button.stories.tsx"
  line: 1
  source: head-besteffort
  status: positive-example
  snippet: |
    // HEAD shows the FIXED version (commit 4a2cddf): forced cells render the recipe's real per-variant
    // tokens via control.ts FORCED_STATE. The pre-fix anti-pattern was a hardcoded variant-agnostic
    // FORCED map: { hover: "bg-surface-3 text-text-primary", pressed: "translate-y-px bg-surface-2 ...", ... }.
rationale: >
  A review gate that reads forced cells passes on fake states — a methodology gap, verified by a real
  missed review (fact, promote@1). Generalized: applies to any forced state matrix, not just buttons.
  Additive: extend Pillar 4 with the forced-cell caveat + the verify-against-real-pseudo-state check.
status: promoted
signature: "gap|Pillar 4|forced/data-state story cells can be fake — verify each against the real rendered :hover/:active, not the cell's colour"
```

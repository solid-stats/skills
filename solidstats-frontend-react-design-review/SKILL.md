---
name: solidstats-frontend-react-design-review
description: >
  Pedantic UI / visual / UX review for the SolidStats `web` frontend — the design counterpart to
  code review. It audits a built or prototyped surface against the design system and the surface
  spec across seven pillars: token + contrast correctness (`@google/design.md lint`), the real-width
  visual at the project breakpoints (Playwright), accessibility (axe-core, WCAG 2.2 AA), the ×5 scenario endings
  and ×4 data-volume states, responsiveness + layout, design-system + domain adherence, and SEO for public pages
  (dark-only, one cyan accent, Lucide, tabular mono, NO arbitrary Tailwind values, first-class
  freshness / provenance / Unknown / Conflict states, RU+EN). It is the SolidStats project overlay
  for the GSD UI review (`gsd-ui-review`). It hard-requires `solidstats-shared-review-standards`
  (severity buckets, report format, verdict rules) and enforces the rules defined by
  `solidstats-frontend-react-design`; code-level defects (bugs, types, data flow) go to
  `solidstats-frontend-react-code-review` instead. Use this whenever reviewing, auditing, or QA-ing
  any web UI surface — proactively, even when the task doesn't say "design review"; trustworthy,
  on-system UI is worth a few tokens.
  Triggers: "review my UI", "design review", "UI audit", "visual QA", "check the screen", "does this
  match the design", "is this accessible", "review the overview page", "check responsiveness",
  "проверь UI/экран", "ревью дизайна", "визуальное ревью", "UI-аудит", "соответствует ли дизайну",
  "проверь доступность", "проверь адаптивность".
---

# SolidStats Frontend Design Review — UI / Visual / UX

The design counterpart to `solidstats-frontend-react-code-review`. It judges whether a surface
**looks, behaves, reflows, and reads** correctly — against the design system and the surface spec.
It is the SolidStats **project overlay for the GSD UI review** (`gsd-ui-review`): when GSD runs the
UI review, follow this skill's pillars and map findings into the GSD `UI-REVIEW.md` artifact.

This skill is **not** standalone in two ways:

- **Format is delegated.** It hard-requires
  [`solidstats-shared-review-standards`](../solidstats-shared-review-standards/SKILL.md) — read it
  first. That owns the severity buckets (🔴🟠🟡🔵), the report shape (`file:line` → what's wrong →
  why → fix, continuous numbering), the verdict rules (APPROVE / REQUEST CHANGES / BLOCK), scope
  discipline, and the read-only default. This skill adds only the *visual/UX* gate.
- **Rules are delegated.** The standard it enforces is
  [`solidstats-frontend-react-design`](../solidstats-frontend-react-design/SKILL.md) (the design
  system + the surface spec). A finding cites a rule there, not personal taste. Code-level defects
  belong to `solidstats-frontend-react-code-review`; if a finding is "this state machine is wrong,"
  that's code review — keep this review on the *design surface*.

> **Boundary:** read-only by default (per shared-review-standards §H) — report, don't edit, unless
> the developer asks. Order findings by user impact: broken state / inaccessible → wrong at real
> width → off-system → polish.

## The seven pillars

Check every pillar; the full per-pillar checklist (checklist.design component checks + the Selectel
handoff checklist + the SolidStats specifics) is in
[`references/checklist.md`](references/checklist.md). Run the tooling first, then read against the
spec.

### 1. Tokens & contrast — `@google/design.md`

- `npx @google/design.md lint DESIGN.md` passes: structure valid, **no broken `{token}` references,
  WCAG contrast ratios met**. A contrast failure is 🔴.
- `npx @google/design.md diff` shows no unintended token regression if the system changed.
- **No arbitrary Tailwind values** in the surface (`bg-[#…]`, `p-[7px]`, `text-[13px]`) — every
  value is a theme token. Arbitrary values bypass the token SoT and silently re-introduce drift; flag
  each one.

### 2. Real-width visual — Playwright at the project breakpoints

Render the surface and screenshot at every project breakpoint (the canonical set + content-width
strategy live in `solidstats-frontend-react-design` → `references/design-system.md` — the single
source). The device-frame iframe lies about viewport width — assert the **container** width. Check against the hi-fi / `DESIGN.md`:

- No layout breakage, label collisions, orphan tiles, or trailing-gap "air" (the two-mismatched-
  columns bug — see pillar 5).
- **Structural parity with `.design/hifi/*`** (the binding semantic reference, D-11) — enumerate the
  reference's elements, affordances, and interaction model and flag every one **dropped OR invented**,
  not just spacing/hierarchy/density. (A nav that drops the Brand / utility cluster, a table that
  invents a control the hi-fi derives by device, are structural divergences even when the spacing is
  right.)
- **Measure, don't eyeball** — assert no stray scroll (`scrollHeight ≤ clientHeight`, the loading
  skeleton included — a skeleton must never scroll), the skeleton box equals the final box, and that
  focus produces a visible computed change. axe-clean ≠ visible focus; box-reserved ≠ no scroll.
- **CLS = 0** (zero layout shift, no exceptions) — every async region reserves its final height;
  skeletons match the final colgroup / header / row height; nothing reflows after first paint. Any
  measurable shift is 🔴. Animations must use only `transform`/`opacity` (never layout properties).
- **CWV via Chrome DevTools MCP** — `performance_start_trace` measures LCP ≤ 2.5s, INP ≤ 200ms,
  CLS = 0; `performance_analyze_insight` names the element behind any layout shift (the free,
  official MCP — that "which element shifted" insight is how you drive CLS to 0).
- **Back restores table state + scroll + virtualized position + cache** with no blocking reload and
  no jump (the brief's signature continuity requirement) — this is 🔴 if broken.

### 3. Accessibility — axe-core + WCAG 2.2 AA, plus specific AAA

**Target: WCAG 2.2 AA baseline, plus these AAA criteria** (adopted because they are cheap and
high-value for this product):

- **2.5.5 Target Size (Enhanced)** — 44×44 touch targets (AA's `2.5.8` needs only 24×24).
- **2.4.13 Focus Appearance** — enhanced focus-indicator size/contrast, beyond `2.4.7` Focus Visible.
- **2.4.12 Focus Not Obscured (Enhanced)** — a focused element is never tucked under a sticky
  header/footer or an Ark UI overlay (`scroll-margin`; verify floating layers don't cover the trigger).
- **2.1.3 Keyboard (No Exception)** — fully keyboard-operable, no exceptions.
- **2.4.10 Section Headings** — real `<h2>/<h3>` per section (not styled `<div>`s) on multi-panel
  admin / moderation / request pages; heading-jump is how non-visual users traverse dense routes.
- **2.4.8 Location** — breadcrumbs show where you are in the set.
- **2.3.3 Animation from Interactions** — honor `prefers-reduced-motion` (Tailwind `motion-reduce:`)
  across interaction-triggered motion (chart / sort / expand / route transitions); essential motion
  (loading state) is exempt.
- **2.2.3 No Timing** — no time limits on reading or interacting.
- **3.3.6 Error Prevention (All)** — *scoped to the correction-request flow*: Reversible / Checked /
  Confirmed (Zod + a review step). Don't bolt confirmations onto trivial filters.
- **3.2.5 Change on Request** — *a compliance check, not a feature*: never auto-navigate or change
  context without user action (auto-refreshing data in place is fine; auto-redirect / re-focus is not).

We deliberately do **not** adopt **1.4.6 Contrast (Enhanced)** (7:1) or **1.4.8 Visual Presentation** —
both fight the dense dark theme and wide tables; **1.4.3 Contrast (Minimum)** (4.5:1) stays the
baseline. Also rejected on cost/benefit for a bilingual milsim-jargon app: **2.4.9** Link Purpose
(Link Only), **3.1.3–3.1.6** (reading level / jargon), **1.3.6** Identify Purpose. (`axe-core` is the
free MPL-2.0 engine via `@axe-core/playwright` — not Deque's paid axe Pro.)

**Source of truth — verify, don't recall.** The criterion numbers and levels above are authoritative
at the [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) and the filterable
[How to Meet WCAG 2.2 quick-ref](https://www.w3.org/WAI/WCAG22/quickref/) (filter by level). Confirm
any criterion against that source, never from memory — the numbering shifted between 2.1 and 2.2
(e.g. Target Size split into `2.5.5` Enhanced / `2.5.8` Minimum, and `2.4.13` Focus Appearance is new).

Concrete checks beyond the named criteria: logical tab order with no keyboard traps; semantic color
**never color-alone** (always an icon and/or label); images and icons carry text alternatives.
(Visible focus, 44×44 targets, and reduced-motion are already covered by the criteria above.) Pull
the `accessibility` skill for the deep audit.

### 4. States & data volumes — against spec §4/§5

Every **scenario ending ×5** (success / system-error / user-error / loading / onboarding / empty)
and **data-volume state ×4** (empty / few / many / limit-reached) from the surface spec is **rendered
and visually verified — not trusted from the story matrix's existence**. Render each state and confirm
it is correct AND visually distinct (selected doesn't break the column layout; focused ≠ enabled;
loading shows the skeleton, not real data). Render each ×4 data-volume at a **real width** — full-width
labelled sections, not narrow `StateMatrix` grid cells that collapse wide rows so nothing renders —
and confirm rows actually appear and the volumes read differently. Long values truncate+tooltip or
wrap (never clip); empty states carry actionable copy; loading uses reserved-height skeletons;
SSR-warm shows no skeleton.

### 5. Responsiveness & layout

- Reflow is keyed off the **container** (`@container`), not the viewport.
- **Intermediate breakpoints (768 / 1024), not just 360 + desktop** — review the whole documented
  range, not only the mobile floor and a wide desktop. The dead zone is where the desktop nav has
  switched on (`@md`) but its links + brand + utility cluster don't yet fit, so it overflows.
- **Mobile:** no nested scroll, no horizontal scroll; secondary columns dropped; top-N + "show all".
- **Layout:** full-width stacked sections; side-by-side only for naturally-equal things; no
  near-empty full-width strips; tables scroll inside their own card; sticky headers; fixed row slots
  keep paired tables equal height.

### 6. System & domain adherence

Dark-only gunmetal; cyan is the single interactive accent; Lucide icons only (no emoji, no ad-hoc
glyphs); tabular mono for all numbers, right-aligned in tables. **Data trust is a designed layer:**
provenance, freshness ("updated 4 min ago"), and honest `Known` / `Unknown` / `Conflict` / `stale`
states are present and correct, every number traceable to source replays. **RU + EN** both read
naturally — no clipped or awkward labels (sanity-check the Russian). Status vocabulary is the fixed
set (`Pending`/`Approved`/`Rejected`; `Up to date`/`Stale`/`Offline`/`Reconnecting`; etc.).
**Outcome / status copy matches the `DESIGN.md` recipe and is RU/EN-symmetric** — `badge-outcome-*`
prescribes W/L; flag divergent or internally-asymmetric copy (RU `outcomeWin="П"` bare letter vs
`outcomeLoss="пор."` abbreviation-with-period).

### 7. SEO (public pages)

SEO is the brief's #3 quality priority; public stats pages must be indexable and meaningful before
client JS:

- **SSR before JS** — indexable content (stats, names, tables) is in the server HTML, not
  client-only-fetched. Check view-source, not just the rendered DOM.
- **Per-route `<head>`** — a unique `<title>`, meta description, and canonical; OG/Twitter on
  shareable pages (player / squad / replay).
- **Structured data** — valid JSON-LD where it fits (player / squad as an entity).
- **Heading hierarchy** — one `<h1>`, logical `<h2>/<h3>` (shares pillar 3's `2.4.10`).
- **No blockers** — no `noindex` on public pages; canonical not self-conflicting.

Depth: the `seo` skill; CWV is itself a ranking factor (pillar 2).

## Running it

1. Read `solidstats-shared-review-standards`, then this skill's pillars and the surface spec.
2. Run the tools: `@google/design.md lint`/`diff`, Playwright (project breakpoints + CLS + axe-core), and
   `ui-ux-pro-max` advisory only where a UX-rule question arises (`--domain ux`).
3. Reference the quality bundle for depth: `web-design-guidelines` (its review checklist),
   `accessibility`, `core-web-vitals`, `seo`.
4. Report in the shared-review-standards format; map onto GSD `UI-REVIEW.md` when run inside
   `gsd-ui-review`. Verdict per the shared rules.

## Reference

- [`references/checklist.md`](references/checklist.md) — the full per-pillar checklist: the
  checklist.design component checks, the Selectel pre-handoff checklist, and the SolidStats-specific
  items (data-trust states, tier coloring, freshness pill, RU sanity).

# Changelog — solidstats-frontend-react-design-review

## 2026-06-23 — Pillars must render, measure, and check parity — not trust proxies (promoted)

Six promoted facts from the Phase-2 UAT, all sharpening pillars that granted APPROVE on declarative
proxies while real defects shipped. Edited `SKILL.md` pillar prose + `references/checklist.md`:

- **Pillar 2 — structural parity with `.design/hifi/*`** (D-11, the binding semantic reference):
  enumerate the reference's elements / affordances / model and flag every one dropped OR invented, not
  just spacing/hierarchy/density. (`SC-2026-06-23-0d01`)
- **Pillar 2 — measure, don't eyeball**: assert no stray scroll (`scrollHeight ≤ clientHeight`, skeleton
  included), skeleton box == final box, and a visible computed focus change. axe-clean ≠ visible focus;
  box-reserved ≠ no scroll. (`SC-2026-06-23-0d04`)
- **Pillar 4 — render & verify each state**, don't trust the matrix exists (selected mustn't break the
  column layout; focused ≠ enabled; loading shows the skeleton, not real data). (`SC-2026-06-23-0d02`)
- **Pillar 4 — render each ×4 data-volume at a real width** (full-width labelled sections, not narrow
  `StateMatrix` cells that collapse rows); confirm rows appear and volumes read differently.
  (`SC-2026-06-23-0d03`)
- **Pillar 5 — intermediate breakpoints (768 / 1024)**, not just 360 + desktop — the dead zone where the
  desktop nav has switched on but doesn't yet fit. (`SC-2026-06-23-0d05`)
- **Pillar 6 — outcome/status copy vs the `DESIGN.md` recipe + RU/EN symmetry** (`badge-outcome-*` =
  W/L; flag divergent or asymmetric copy). (`SC-2026-06-23-0d06`)

All fact@1.

## 2026-06-19 — Initial draft

- New skill: pedantic UI / visual / UX review for the `web` frontend — the design counterpart to
  `solidstats-frontend-react-code-review`, and the SolidStats project overlay for the GSD UI review
  (`gsd-ui-review`).
- Hard-requires `solidstats-shared-review-standards` for the severity buckets, report format, and
  verdict rules; enforces the rules defined by `solidstats-frontend-react-design`. Code-level
  defects are routed to `solidstats-frontend-react-code-review`.
- Seven review pillars: (1) tokens & contrast via `@google/design.md lint`/`diff` + no-arbitrary-
  Tailwind-values; (2) real-width visual at the project breakpoints via Playwright + CLS + back-nav scroll
  restoration; (3) accessibility via axe-core + WCAG 2.2 AA + targeted AAA (2.5.5 / 2.4.13 / 2.4.12 / 2.1.3 / 2.4.10 / 2.4.8 / 2.3.3 / 2.2.3 / 3.3.6 / 3.2.5), verified against the W3C source; (4) ×5 scenario endings and ×4 data-volume
  states against the surface spec; (5) responsiveness + layout (container-query, no nested/
  horizontal scroll on mobile, full-width stacked sections); (6) design-system + domain adherence
  (dark-only, cyan accent, Lucide, tabular mono, data-trust states, RU+EN sanity); (7) SEO for public
  pages (SSR before JS, per-route `<head>`, JSON-LD, heading hierarchy).
- References the quality bundle (`web-design-guidelines`, `accessibility`, `core-web-vitals`,
  `seo`) and `ui-ux-pro-max` (advisory) rather than duplicating them.
- Reference: `checklist.md` (the full per-pillar checklist — checklist.design + Selectel handoff +
  SolidStats specifics).

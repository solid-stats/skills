# Changelog — solidstats-frontend-react-design-review

## 2026-06-19 — Initial draft

- New skill: pedantic UI / visual / UX review for the `web` frontend — the design counterpart to
  `solidstats-frontend-react-code-review`, and the SolidStats project overlay for the GSD UI review
  (`gsd-ui-review`).
- Hard-requires `solidstats-shared-review-standards` for the severity buckets, report format, and
  verdict rules; enforces the rules defined by `solidstats-frontend-react-design`. Code-level
  defects are routed to `solidstats-frontend-react-code-review`.
- Six review pillars: (1) tokens & contrast via `@google/design.md lint`/`diff` + no-arbitrary-
  Tailwind-values; (2) real-width visual at the project breakpoints (360/768/1024/1280) via Playwright + CLS + back-nav scroll
  restoration; (3) accessibility via axe-core + WCAG 2.2 AA + targeted AAA (2.5.5 / 2.4.13 / 2.4.12 / 2.1.3 / 2.4.10 / 2.4.8 / 2.3.3 / 2.2.3 / 3.3.6 / 3.2.5), verified against the W3C source; (4) ×5 scenario endings and ×4 data-volume
  states against the surface spec; (5) responsiveness + layout (container-query, no nested/
  horizontal scroll on mobile, full-width stacked sections); (6) design-system + domain adherence
  (dark-only, cyan accent, Lucide, tabular mono, data-trust states, RU+EN sanity).
- References the quality bundle (`web-design-guidelines`, `accessibility`, `core-web-vitals`,
  `seo`) and `ui-ux-pro-max` (advisory) rather than duplicating them.
- Reference: `checklist.md` (the full per-pillar checklist — checklist.design + Selectel handoff +
  SolidStats specifics).

# Changelog — solidstats-frontend-react-design

## 2026-06-19 — Initial draft

- New skill: the design-creation pipeline for the `web` frontend. Establishes the two-layer model
  — design SYSTEM as a `@google/design.md` `DESIGN.md` (tokens exported to the Tailwind v4
  `@theme`) and the per-SURFACE spec (states ×5, data-volume ×4, breakpoints, role model, data
  shape, i18n). Responsive breakpoints are **360 / 768 / 1024 / 1280 / 1920 / 2560** (+390/414 mobile spot-check, +3440 ultrawide cap,
  +1536 wide), Tailwind v4-aligned and StatCounter-grounded, defined once in
  `references/design-system.md`.
- Defines the pipeline: brief → spec → prototype in a durable Ladle component catalog on the real stack (Ark UI +
  Tailwind v4 + Lucide, dark-only) → visual gate → graduate into TanStack Start routes. Designed to
  be the content the GSD UI phase (`gsd-ui-phase`) runs.
- References external tools rather than duplicating: `@google/design.md` (token system),
  `ui-ux-pro-max` (advisory UX/chart guidelines — palette/type ignored, our DS is locked), and the
  quality bundle (`web-design-guidelines`, `accessibility`, `core-web-vitals`, `seo`). Defers
  code-level HOW to `solidstats-frontend-react-conventions`.
- Absorbed the durable design rules (full-width stacked sections, priority order, edge/overflow
  states, no nested scroll on mobile, data-trust as a designed layer, never-color-alone) learned on
  the Overview / Player / Players / Squads surfaces; the running companion notes stay in the web
  repo's `.design/CLAUDE.md`.
- References: `design-system.md` (design.md adoption + `@theme` export), `spec-template.md` (the
  surface contract), `pipeline.md` (the stages).
- Hardened against a deep-research pass: noted `DESIGN.md` → **W3C DTCG** (token interchange
  standard, stable Oct 2025) as an explicit codegen step alongside the Tailwind `@theme` export;
  added an **LLM-hygiene** note (the spec template is the output schema; pin the model version;
  review single-pass, not iteratively); softened the Ladle-vs-Storybook size claim (stale 2021
  benchmark — Storybook 8+ narrowed the gap). The research validated Ladle's component-index →
  Playwright integration and the single-pass-review choice.

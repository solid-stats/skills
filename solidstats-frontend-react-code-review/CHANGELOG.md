# Changelog — solidstats-frontend-react-code-review

## 2026-06-16 — Review-lens mapping (BMAD Improvement 2)
- Added a **Review lenses** section mapping the three generic adversarial lenses from
  `solidstats-shared-review-standards` §J onto this reviewer's two phases: **Contract Adversary** →
  Phase 1 quality gate (generated-types freshness, list→detail→back) + the §I.2 blast radius across
  shared loaders/routes; **Edge / Failure Hunter** → Phase 2 data-correctness/CWV/realtime topics;
  **Acceptance Auditor** → §F + the discovered PLAN `must_haves.truths` (§I.3), with UI truths routed
  to Validation Gaps for the browser pass. Notes the no-forced-finding rule and the depth-tied fan-out.
- Provenance: ADR `decisions/0007-bmad-borrowed-improvements.md`.

## 2026-06-06 — Follow-up (user directives)
- Phase-1 gate now includes `vp check` (Vite+ lint/format/type-check).

## 2026-06-06 — Analysis fixes (see .planning/SKILLS-ANALYSIS.md)
- Severity now comes from the in-skill Severity reference table (the conventions pattern files carry
  no severity tags); dropped "uses the severity that rule is tagged with."
- Added a Security gate line, a Security (SSR) sweep step, and a CSP/secret-leak severity row
  (`[conv: security]`); fixed the loose `project-patterns.md` link path.

## 2026-06-06 — Initial
- Operational frontend reviewer: hard-requires `solidstats-shared-review-standards` and enforces
  `solidstats-frontend-react-conventions` as its rule library (cites pattern files, doesn't restate).
- **Phase 1 — quality gate** (the frontend analog of the API/contract gate): axe a11y serious/critical,
  Core Web Vitals (CLS/LCP/INP + Lighthouse), bundle budgets, console errors, generated-types
  freshness, the list→detail→back contract, and SSR for SEO-critical pages. A breach is a BLOCK.
- **Phase 2 — convention/correctness sweep** in risk order (UX continuity → a11y → data correctness →
  performance → SEO → realtime → architecture → component shape → styling → TS → i18n → errors →
  domain), each finding citing `[conv: …]` and using the tagged severity.
- Frontend-specific severity table for a mechanical verdict.
- Output delegates to review-standards (§D–§E), opening with the gate result; test quality deferred to
  `solidstats-frontend-react-tests` + review-standards §F.

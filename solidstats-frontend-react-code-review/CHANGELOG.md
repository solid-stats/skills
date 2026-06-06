# Changelog — solidstats-frontend-react-code-review

## 2026-06-06 — Initial
- Operational frontend reviewer: hard-requires `solidstats-process-review-standards` and enforces
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

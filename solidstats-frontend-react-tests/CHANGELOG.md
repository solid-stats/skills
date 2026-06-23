# Changelog — solidstats-frontend-react-tests

## 2026-06-23 — Visibility assertions must prove paint, not box size (promoted)

- *Accessibility in tests*: added the rule that an "is it shown / revealed on focus" check asserts REAL
  visibility (computed `clip`/`clip-path` cleared, `toBeInViewport()`, or a non-empty paint), never
  `boundingBox()` height/width alone — the layout box ignores paint-time clipping, so a SkipLink left
  at `clip: rect(0,0,0,0)` has a 44px box yet paints nothing and a height-≥44 assertion goes green on
  an invisible element (WCAG 2.4.1 reveal failure). Box dimensions are for hit-area sizing only.
- Promoted from corrections-log `SC-2026-06-23-0701` (caused-bug, fact@1).

## 2026-06-20 — Ladle component-isolation harness + spec use-cases as the E2E source

- Added the **Ladle story harness**: component/integration tests mount through the durable Ladle
  catalog built by `solidstats-frontend-react-design` (Playwright drives one story at a time —
  deterministic, isolated, no full-app routing/network). It is the sanctioned replacement for RTL and
  keeps the test harness and the design catalog the same artifact.
- **Critical journeys derive from the surface spec's use-cases / product-scenarios** section (the E2E
  source in `solidstats-frontend-react-design` → `references/spec-template.md`): one Playwright journey
  per use-case, the spec's ×5 scenario endings as its assertions. Description updated to name the Ladle
  harness.

## 2026-06-06 — Follow-up (user directives)
- CI gate now includes `vp check` (Vite+ lint/format/type-check).

## 2026-06-06 — Initial
- The thin per-stack frontend test skill on top of `solidstats-shared-testing-standards` (which owns
  the philosophy). Adds the frontend how-to; assumes `solidstats-frontend-react-conventions`.
- **Runner split:** Vitest for hooks/pure logic (mappers, Model→Data, query-key factories, zod/v4-mini
  schemas, Nano logic); Playwright for components and critical journeys. No RTL component DOM tests; no
  localization-object tests (kept from the estesis rule).
- **Critical journeys (Playwright):** list→filter→scroll→detail→Back restoration, SSE behavior,
  loading/error/empty/offline/reconnecting/stale states, keyboard navigation, responsive smoke.
- **a11y:** axe in Playwright (serious/critical block); focus management + announced table state.
- **CI matrix gate** (from the brief): full browser matrix per PR, axe, console-error block,
  scroll/cache/CLS regression block, Lighthouse/budgets, bundle budgets, smoke screenshots.
- **E2E data:** deterministic seeded `server-2`; local dev uses a reachable `server-2`, not mocks as
  the primary mode. Vitest stubs unit deps directly.
- Closes the frontend cluster and the v1 skill set (11/11).

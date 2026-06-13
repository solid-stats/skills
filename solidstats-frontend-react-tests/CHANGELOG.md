# Changelog — solidstats-frontend-react-tests

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

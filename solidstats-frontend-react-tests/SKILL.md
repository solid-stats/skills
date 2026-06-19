---
name: solidstats-frontend-react-tests
description: >
  Testing for the SolidStats `web` frontend (TanStack Start / React) — the per-stack layer on top of
  solidstats-shared-testing-standards. Adds the runner split (Vitest for hooks/logic, Playwright for
  components and critical journeys via the Ladle story harness), the journey coverage list (list→detail→back restoration, SSE,
  loading/error/offline states), accessibility checks (axe), the CI browser/budget matrix, and the
  seeded-backend E2E policy. Use when writing or reviewing frontend unit, component, or E2E tests.
  Use this proactively — apply it when writing or reviewing ANY frontend test, even when not
  explicitly asked.
  Triggers: "write frontend tests", "playwright test", "test this component", "e2e test", "test the page",
  "напиши тесты фронта", "playwright тест", "тест компонента", "e2e тест", "протестируй страницу".
---

# Frontend Tests — TanStack Start / React

**This skill builds on [`solidstats-shared-testing-standards`](../solidstats-shared-testing-standards/SKILL.md) — read it first.**
That skill owns the philosophy (RITE, AAA, the unit-vs-integration boundary, determinism, doubles,
oracle strength, the coverage mindset, TDD). This skill adds the **frontend HOW** and assumes
[`solidstats-frontend-react-conventions`](../solidstats-frontend-react-conventions/SKILL.md).

## The runner split

- **Vitest** — hooks and **pure logic**: mappers, the Model→Data boundary, query-key/`queryOptions`
  factories, formatters, `zod/v4-mini` schemas, Nano store logic, reducers/derivations.
- **Playwright** — **components and critical journeys** end to end, against a real rendered app.
- **Do not** write an RTL test that renders a component and asserts on its DOM — component behavior is
  Playwright's job (this is the estesis rule, kept). Don't unit-test the localization object.

The unit-vs-integration boundary (testing-standards §B) maps here as: logic → Vitest unit; anything
whose correctness depends on the real DOM, routing, the Query cache, SSR, or the network → Playwright.

## Component isolation harness (Ladle)

Component and integration tests mount through **Ladle stories** — the durable UIKit catalog built by
[`solidstats-frontend-react-design`](../solidstats-frontend-react-design/SKILL.md), not a throwaway
fixture. Each shared component keeps a permanent story covering its states (the surface spec's
component-state and ×4 data-volume matrix); Playwright drives **one story at a time** for a
deterministic, isolated mount with no full-app routing or network. This is the sanctioned way to "test
a component in isolation" — it **replaces RTL** (still banned: no render-and-assert-DOM) and keeps the
test harness and the design catalog the *same artifact*, so a component cannot drift from its
catalogued contract.

- The **story is the unit**: assert the rendered states, keyboard interaction, and axe-cleanliness per
  story. Integration (a few catalogued components composed) also runs as a story before it graduates
  into a route.

## Critical journeys (Playwright)

Journeys derive from the surface spec's **use-cases / product-scenarios** section — the E2E source in
`solidstats-frontend-react-design` → `references/spec-template.md`: each use-case becomes a Playwright
journey and the spec's ×5 scenario endings become its assertions. These are launch-blocking and must be
covered:

- **list → filter/sort → deep scroll → detail → Back** restores table state, scroll, virtualized row
  position, and cache with **no blocking reload or CLS** (the signature requirement).
- **SSE** update behavior: no viewport shift / focus steal; per-page merge (auto vs confirm).
- **Loading / error / empty / offline / reconnecting / stale-data** states on critical screens.
- **Keyboard navigation** through menus, tables, dialogs, filters, pagination, moderation actions.
- **Responsive** smoke flows (mobile + desktop).

## Accessibility in tests

- Run **axe** (or equivalent) in Playwright on key screens; **serious/critical violations block**.
- Assert focus management on route change, announced table sort/filter state, and visible focus.

## CI matrix (the gate)

From the brief — these block merge:

- Full **Playwright browser matrix** on every PR: Chromium, Firefox, WebKit, a mobile Chrome-like
  viewport, a mobile WebKit viewport, reduced-motion, and forced-colors where feasible.
- **axe** a11y (serious/critical block); **console errors** on critical journeys block; **scroll
  restoration / cache restoration / CLS** regressions block.
- **Lighthouse / budgets** (performance, a11y, SEO) and **bundle budgets** block for critical pages.
- **`vp check`** (Vite+: Oxlint + Oxfmt + tsgo) — lint/format/type-check — blocks.
- **Smoke screenshot** regression for key desktop/mobile states (not a high-maintenance full visual gate).

## E2E data & doubles

- E2E runs against a **deterministic seeded `server-2`** backend; local frontend dev requires a
  reachable `server-2` API — **mocks are not the primary development mode** (brief).
- In Vitest unit tests, stub the dependencies of the unit directly (the typed client / a query hook);
  don't reach the network. Mock only true boundaries (network, time, storage) per testing-standards.

## Determinism

- Seeded backend data; deterministic time where behavior depends on it; never real `sleep`/wall-clock
  waiting (testing-standards §E). Reset mocks/timers/state between tests; no shared mutable fixtures.

## Not owned here

The philosophy lives in `solidstats-shared-testing-standards`; the severity of a test-quality problem
in review lives in `solidstats-shared-review-standards` §F (test quality is never a standalone BLOCK
unless a test actively masks a real bug).

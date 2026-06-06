# Tests (conventions summary)

The full how-to and the CI gate live in
[`solidstats-frontend-react-tests`](../../solidstats-frontend-react-tests/SKILL.md) on top of
[`solidstats-process-testing-standards`](../../solidstats-process-testing-standards/SKILL.md). This
file is the conventions-level summary that the code review applies.

## The split

- **Playwright** covers **components and critical journeys** — including the list→filter→detail→Back
  state/scroll/cache restoration, SSE update behavior, loading/error/offline/stale states, keyboard
  navigation, and responsive smoke flows.
- **Vitest** covers **hooks and pure logic** (formatters, mappers, the Model→Data boundary, query-key
  factories). **Do not** write an RTL test that renders a component and asserts on its DOM — component
  behavior is Playwright's job.
- Don't unit-test the localization object (asserting keys exist proves nothing).

## CI gates (from the brief)

These block merge; honor them when writing/reviewing UI:

- Full **Playwright browser/performance matrix** every PR (Chromium, Firefox, WebKit, mobile viewports,
  reduced-motion, forced-colors where feasible).
- **axe** accessibility checks — serious/critical violations block.
- **Console errors** during critical journeys block.
- **Scroll restoration, cache restoration, and CLS** regressions block.
- **Lighthouse / budgets** (performance, a11y, SEO) and **bundle budgets** block.
- E2E runs against a **deterministic seeded `server-2`** backend; local dev uses a reachable `server-2`,
  not mocks as the primary mode.

Review flags:

- A new RTL test rendering a component and asserting DOM (use Playwright); a flat-localization-object test.
- A critical journey (esp. list→detail→back restoration, SSE, a11y) with no Playwright coverage.
- A change that would introduce a console error, a CLS regression, or a bundle-budget breach on a
  critical page.

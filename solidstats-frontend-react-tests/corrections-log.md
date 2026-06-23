# Corrections log — solidstats-frontend-react-tests

Append-only journal of agent-discovered divergences (process-skill-feedback SKILL.md §H). One block
per correction. Schema: `solidstats-process-skill-feedback/references/journal-schema.md`.

### SC-2026-06-23-0701 · caused-bug · fact · catalog-gate

```yaml
id: SC-2026-06-23-0701
date: 2026-06-23
target_skill: solidstats-frontend-react-tests
repo: web
source: agent-discovered
signal: caused-bug
class: fact
generalized: true
section: "catalog gate / Playwright-against-Ladle"
topic: visibility-assertion
dev_change: >
  The Playwright catalog gate the skill prescribes uses `boundingBox()` height as the proxy for
  "visible" — `tests/catalog.spec.ts` asserts only `box.height >= 44` (and the SkipLink keyboard spec
  asserts `boundingBox().height >= 44` on focus). But `boundingBox()` is a LAYOUT box and ignores
  paint-time clipping: a SkipLink that stays `clip: rect(0,0,0,0)` on focus (legacy `clip` not reset
  by `not-sr-only`) has a 44px box yet paints NOTHING — the test went GREEN while the element was
  invisible, hiding a real WCAG 2.4.1 reveal failure. The skill should mandate asserting REAL
  visibility for "is it shown" checks: computed `clip`/`clip-path` cleared, `toBeInViewport`, or a
  non-empty paint — never box dimensions alone.
code:
  file: "packages/design/tests/catalog.spec.ts"
  line: 48
  source: agent-snippet
  status: negative-example
  snippet: |
    await page.waitForSelector("[data-storyloaded]");
    const box = await el.boundingBox();
    expect(box.height, "target height").toBeGreaterThanOrEqual(44);  // passes while clip-hidden
rationale: >
  Following the prescribed assertion shipped a green-but-broken a11y test — caused-bug, fact
  (promote@1). The fix is a methodological rule, applies to every visibility assertion in the harness.
status: promoted
signature: "caused-bug|catalog-gate|boundingBox height is not a visibility proof; assert real paint/clip"
```

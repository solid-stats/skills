---
name: solidstats-frontend-react-code-review
description: >
  Pedantic code review for the SolidStats `web` frontend (TanStack Start / React). Builds on
  solidstats-process-review-standards (severity buckets, output format, verdict, scope, noise filter)
  and enforces solidstats-frontend-react-conventions as its rule library. Runs a quality gate
  (accessibility, Core Web Vitals, bundle budgets, console errors, generated-types freshness, the
  list→detail→back contract), then a convention and correctness sweep with a frontend-specific
  severity table. Use when reviewing frontend code, verifying a finished UI task, or checking a `web` PR.
  Triggers: "review frontend", "review the UI", "code review", "check my component", "review this page",
  "look at my PR", "ревью фронта", "посмотри компонент", "проверь страницу", "проверь ui",
  "проверь реализацию".
---

# Frontend Code Review — TanStack Start / React

**This skill builds on [`solidstats-process-review-standards`](../solidstats-process-review-standards/SKILL.md) — read it first.**
That skill owns the review philosophy, scope resolution (read every changed file in full), the severity
buckets (🔴🟠🟡🔵), continuous-numbering output, verdict rules, the test-file rule, and the noise filter.

**The rule library is [`solidstats-frontend-react-conventions`](../solidstats-frontend-react-conventions/SKILL.md)** —
this skill enforces it, it does not restate it. Every finding cites the convention it breaks
(`[conv: a11y]`, `[conv: data-flow]`, `[conv: styling]`, …) and takes its severity from the
**Severity reference** table below — the `[conv: …]` citation identifies *which* rule, not its severity
(the conventions pattern files carry rules, not severity tags). Use `../solidstats-frontend-react-conventions/references/project-patterns.md` to find the right
pattern file for the change.

Review happens in two phases, in order.

---

## Phase 1 — Quality gate (blocking)

The frontend's "contract" is the user experience and the product quality bar. The brief's CI gates are
the gate; verify the change doesn't breach them.

- **Accessibility** — axe **serious/critical violations block**; keyboard reachability, visible focus,
  contrast (4.5:1 / 3:1), accessible names, no traps (WCAG 2.2 AA). `[conv: a11y]`
- **Core Web Vitals** — no avoidable **CLS** on a critical journey (budget 0.02, hard 0.05); LCP in
  initial HTML; INP-heavy handlers off the main thread. Lighthouse/budgets must pass. `[conv: performance]`
- **Bundle budgets** — the change must not breach the CI bundle budget (no heavy dep into a shared
  path; route-split heavy code). `[conv: performance]`
- **Console errors** — none on critical journeys (the CI blocks them). `[conv: errors]`
- **Generated types freshness** — `openapi-typescript` types are current vs the `server-2` schema; a
  change consuming a stale/hand-written shape is a gate failure. `[conv: typescript]`
- **The list→detail→back contract** — preserved: scroll/virtualization/cache restored, no blocking
  reload, no CLS. A change that breaks it is a gate failure. `[conv: data-flow / routing / state]`
- **SEO (public indexable pages)** — SEO-critical content is server-rendered in initial HTML, not
  client-only. `[conv: seo]`
- **Security headers** — the SSR server sets a CSP + security headers, and no secret is reachable from
  client code. `[conv: security]`

Render the gate at the top of the report:

```
## Quality gate
✅ axe clean · CWV budgets ok · bundle within budget · no console errors · types fresh · back-nav restores.
⚠️ New chart route adds 40kb — within budget but watch; lazy-loaded.
❌ Player list now fetches client-only → SEO content not in SSR HTML → gate fail
❌ Filter state moved to a Nano store → Back no longer restores it → list→detail→back broken → gate fail
```

A failing gate is a **BLOCK**, in addition to the standard "any 🔴 → BLOCK" rule.

---

## Phase 2 — Convention & correctness sweep

Read every changed file in full, then sweep against `solidstats-frontend-react-conventions` in **risk
order** (UX continuity is the top product priority, then a11y, then SEO — mirror that):

1. **UX continuity** — list→detail→back, state boundaries (URL vs Query vs Nano), no blocking reloads.
   `[conv: data-flow / state / routing]`
2. **Accessibility** — labels, keyboard, focus, contrast, live regions, targets. `[conv: a11y]`
3. **Data correctness** — loader-prefetch + `useQuery` on the same `queryOptions`; openapi-fetch /
   openapi-react-query typed client; **no raw `fetch`, no hand-written DTO**; optimistic only where
   safe. `[conv: data-flow / typescript]`
4. **Performance / CWV** — reserved space (no CLS), render-stable props, virtualization, route
   splitting, INP. `[conv: performance]`
5. **SEO / SSR** — meaningful server HTML, titles/meta/canonical, `/ru` `/en` hreflang, no crawl traps.
   `[conv: seo]`
6. **Realtime** — SSE no-CLS / no-focus-steal, per-page merge discipline, stale/offline labeling.
   `[conv: realtime]`
7. **Architecture & layers** — correct layer/slice placement, slice `index.ts` public surface, uikit
   boundary, thin `src/routes`. `[conv: architecture]`
8. **Component shape** — named function (no `observer`), props order, server/client boundary, Lucide
   icons. `[conv: component-shape]`
9. **Styling** — colocated `*Style.css.ts`, semantic tokens + theme contract, stable dimensions, no
   nested cards / `transition: all`. `[conv: styling]`
10. **TypeScript** — generated types as source of truth, backend-enum `Record<Enum,…>` safety,
    Model/Data boundary, `zod/v4-mini`, `noUncheckedIndexedAccess`. `[conv: typescript]`
11. **Localization** — typed ICU, `/ru` `/en`, `const ln`, no hardcoded strings, RU/EN parity.
    `[conv: localization]`
12. **Errors** — stable codes, recovery copy, user-vs-app distinction. `[conv: errors]`
13. **Domain rules** — slug/owner model, provenance/unknown/conflict, masked SteamID, request/
    moderation flows. `[conv: domain-rules]`
14. **Security (SSR)** — CSP / security headers on the Node server, no client-reachable secrets,
    upload content-validation. `[conv: security]`

Each finding lands in one severity bucket, carries a `[topic]` tag, and cites `[conv: …]`.

---

## Severity reference

| Finding | Severity |
|---------|----------|
| Broken list→detail→back (state/scroll/cache not restored) | 🔴 |
| a11y serious/critical (axe), keyboard trap, no accessible name on a control | 🔴 (gate) |
| Avoidable CLS on a critical journey | 🔴 (gate) |
| Role-sensitive data fetched/rendered before the auth/role gate | 🔴 |
| SEO-critical content client-only (not in SSR HTML) | 🔴 (gate) |
| Raw `fetch` / hand-written DTO instead of the typed generated client | 🟠 |
| Shareable state not in the URL (in Nano/component instead) | 🟠 |
| Optimistic update on a moderation/correction action | 🟠 |
| SSE update that shifts viewport / steals focus | 🟠 |
| Bundle-budget breach / heavy dep in a shared path | 🟠 |
| Missing CSP / security headers; secret reachable from client code | 🟠 (🔴 if a secret leaks) |
| Render-unstable prop (inline object/array, unmemoized handler) | 🟡 |
| Missing reserved space (minor CLS), un-virtualized large table | 🟡 |
| Wrong layer/slice placement; uikit importing business | 🟡 |
| Hardcoded UI string; missing RU/EN parity | 🟡 |
| Raw hex/magic z-index instead of token; `transition: all` | 🔵 |
| Naming, comments, import order | 🔵 |

---

## Output

Follow the output format, continuous numbering, severity buckets, and verdict rules from
`solidstats-process-review-standards` (§D–§E). Open the report with the **Quality gate** result (above
the buckets); there is no "Good" section. Cite the broken convention on each finding. The test-file rule
lives in review-standards §F; defer detailed test-quality judgement to
[`solidstats-frontend-react-tests`](../solidstats-frontend-react-tests/SKILL.md).

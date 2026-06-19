---
name: solidstats-frontend-react-design
description: >
  The design-creation pipeline for the SolidStats `web` frontend — how to take a surface
  (page / screen / component) from brief to shipped UI. It works in two layers: the design SYSTEM
  (a `DESIGN.md` in the `@google/design.md` format — tokens + rationale, exported to the Tailwind
  v4 `@theme`) and the per-SURFACE spec (states ×5, data-volume ×4, breakpoints, role model, data
  shape, i18n — the screen contract design.md does not cover). Drives the loop: brief → spec →
  prototype in the durable Ladle component catalog → visual gate → graduate into TanStack Start
  routes. This is the content the GSD UI phase (`gsd-ui-phase`) runs; the review half is
  `solidstats-frontend-react-design-review`. Use this proactively whenever designing, creating,
  prototyping, or restyling ANY web surface — even when the task does not say "design"; a
  consistent, on-system surface is worth a few tokens. It references the external
  `@google/design.md` (tokens) and `ui-ux-pro-max` (advisory) rather than duplicating them, and
  defers code-level HOW to `solidstats-frontend-react-conventions`.
  Triggers: "design a screen/page", "new UI", "build the overview page", "prototype this",
  "hi-fi mockup", "restyle", "design system", "make this look right", "design the player profile",
  "спроектируй экран/страницу", "новый UI/экран", "свёрстай макет", "прототип", "hi-fi",
  "дизайн-система", "приведи к дизайну", "сделай красиво".
---

# SolidStats Frontend Design — Creation Pipeline

How a UI surface in the SolidStats `web` app goes from intent to shipped code. The **product
ground truth is `gsd-briefs/web.md`** (scope, quality bar, design direction); this skill is the
*how-to-design* on top of it. The companion review skill is
[`solidstats-frontend-react-design-review`](../solidstats-frontend-react-design-review/SKILL.md);
the code-level HOW (FSD layers, component shape, data flow, routing, i18n) lives in
[`solidstats-frontend-react-conventions`](../solidstats-frontend-react-conventions/SKILL.md) — this
skill governs the *design*, that one governs the *code*. Read both when building a surface.

> **Stack (locked by the brief):** TanStack Start (SSR) + Router + Query + Table · Ark UI (headless
> primitives) · **Tailwind v4** (theme tokens only — no arbitrary values) · Lucide (the only icon
> set) · typed ICU i18n (`/ru` `/en`) · dark-only gunmetal theme · Node/Docker · SSE realtime.
> **Quality order (brief):** UX continuity → accessibility (WCAG 2.2 AA + targeted AAA — named in design-review §3) → SEO → CWV
> (LCP ≤ 2.5s, INP ≤ 200ms, **CLS = 0** — zero layout shift, not ≤0.02; reserve space for
> everything) → visual polish.

## Why two layers

A design has two kinds of truth, and conflating them is the usual failure. The **design system**
is global and reusable — the palette, type, spacing, radii, and the component token recipes; it
changes rarely and the same answer applies on every screen. The **surface spec** is local — what
*this* table does at 0 rows and at 2 000, how it reflows on a narrow phone, what a moderator sees that a
signed-out visitor does not. Keeping them in separate artifacts means the system stays a single
source of truth (one place to change a color) while each surface still answers its own edge cases.

### Layer 1 — design system: `DESIGN.md` (`@google/design.md`)

The SolidStats design system lives as a **`DESIGN.md`** file in the
[`@google/design.md`](https://github.com/google-labs-code/design.md) format: YAML front matter for
machine-readable tokens (`colors`, `typography`, `spacing`, `rounded`, `components` with `{token}`
references and hover/active variants) + a Markdown body for the human rationale (Overview, Colors,
Typography, Layout, Elevation, Shapes, Components, Do's & Don'ts). It is the **single source of
truth for tokens** — production CSS is generated from it, never hand-edited in parallel.

Use the CLI rather than hand-rolling a generator (see
[`references/design-system.md`](references/design-system.md) for the full workflow):

- `design.md export --tailwind-v4` → the Tailwind v4 `@theme` block the app imports. This *is* the
  token codegen — no bespoke script.
- `design.md lint` → WCAG contrast + broken token references. A free correctness gate.
- `design.md diff` → token-level regressions between versions.

The SolidStats system is **dark-only gunmetal, one cyan accent, Saira / IBM Plex type, tabular
mono numerals, Lucide icons** — proposed and validated; do not regenerate it from scratch (e.g. do
not take `ui-ux-pro-max`'s palette/type suggestions, which assume a light marketing surface). The
existing `.design/_ds/` (manifest + README) is the one-time seed; that migration is a foundation
task, not part of this skill.

### Layer 2 — surface spec: the screen contract

`design.md` deliberately stops at tokens and components. Everything that makes a *screen* correct —
the states it can be in, how it survives real data volumes, how it reflows, who sees what — is the
**surface spec**, authored per surface from
[`references/spec-template.md`](references/spec-template.md). In GSD this spec is the UI phase's
`CONTEXT` (what to build) and `VALIDATION` (acceptance) docs, not a separate file. Every surface
spec answers, at minimum:

- **Scenario endings ×5** — success · error (system vs user) · loading · onboarding · empty.
- **Data-volume states ×4** — empty · few · many · limit-reached, for every list/table/field.
- **Responsiveness** — explicit behavior at every project breakpoint (`references/design-system.md`), keyed off the **container**, not the
  viewport (the device-frame trap; see `references/spec-template.md`).
- **Role model** — how the surface differs for signed-out / player / moderator / admin.
- **Data shape** — the real fields, drawn from `server-2`'s OpenAPI (`openapi-typescript` paths);
  mock data must be internally consistent with the domain formulas.
- **Component states** — enabled / hover / pressed / focused / selected / disabled / loading, and
  the click zone (whole row beats text).

## The pipeline (per surface)

Run these in order; each stage has an owner artifact. Full detail in
[`references/pipeline.md`](references/pipeline.md).

1. **Brief.** State the surface's job, its priority order of information, its users, and its data
   source in one paragraph. Inputs: `gsd-briefs/web.md`, the `DESIGN.md` system, and the relevant
   `server-2` OpenAPI shapes. State the composition and priority **out loud first** — do not
   pattern-match a request to the smallest local patch.
2. **Spec.** Fill the surface contract from `references/spec-template.md` (the ×5 / ×4 / breakpoints
   / roles / data / i18n). This is the durable artifact; it outlives any one prototype.
3. **Prototype & catalog.** Build the surface in the **Ladle component catalog** — the app's durable
   UIKit (onboarding + component-test harness, not a throwaway) — on the *real* stack
   (Ark UI + Tailwind v4 with the `DESIGN.md`-exported `@theme`, dark-only). The prototype is the
   seed of production — there is no separate "design tool" output to translate, so there is no
   drift. Drive UX-rule and chart choices with `ui-ux-pro-max` *advisory* output
   (`python3 .../ui-ux-pro-max/scripts/search.py "<query>" --domain ux|chart`), taking its
   guidelines and ignoring its palette/type.
4. **Visual gate.** Hand off to
   [`solidstats-frontend-react-design-review`](../solidstats-frontend-react-design-review/SKILL.md):
   Playwright screenshots at every project breakpoint, `design.md lint`, axe-core, CLS, scroll restoration.
   Fix the *class* of issue, not the one line.
5. **Graduate.** Pages compose the catalogued components into the TanStack Start route tree per
   `solidstats-frontend-react-conventions`. Commit the spec and the code together; keep the hi-fi
   as the visual reference until the route supersedes it.

## Tooling — reference, don't duplicate

Per the repo's authoring standard, single-tool and framework-canonical skills stay external and are
*referenced* here, not copied:

- **`@google/design.md`** — the token system (DESIGN.md → `@theme`, lint, diff). Layer 1.
- **`ui-ux-pro-max`** — advisory only (UX guidelines, chart types, density patterns). Run its
  `search.py`; **use its data, not its palette/type/DS suggestions** — its SKILL.md body is
  templated for a different stack and its visual defaults assume light marketing UI, which
  contradicts our locked dark system.
- **`web-design-guidelines`, `accessibility`, `core-web-vitals`, `seo`** — the quality bundle. The
  review skill runs them as gates; reference them here so the prototype is built to pass.
- **Playwright MCP + Chrome DevTools MCP** — the review gate's runtime tools (real-width screenshots
  / axe-core, and Core Web Vitals + the element behind any CLS). Owned by the review skill.

## Non-negotiable design rules

These were learned the hard way on real surfaces; treat them as part of the contract. Detail and
the running, per-surface companion notes live in the web repo's `.design/CLAUDE.md`; the durable
principles:

- **Lay pages as full-width stacked sections.** Two big mismatched-height columns side by side is
  *the* source of trailing-gap / "air" bugs — only put things side by side when they are equal by
  nature (e.g. two hero stat tiles). Reference data that doesn't fill a column goes in a
  multi-column card, not a near-empty strip.
- **Section order follows information priority.** Headline data sits high, right after identity and
  the top stats — never buried at the bottom.
- **Design the overflow and the edge, not just the happy path.** Every list answers "what at 200
  rows? at 0?". Cap a visible window and scroll inside it (sticky header), with the total count in
  the label. Verify at the **real** width (simulate the mobile-floor 360px column — the device-frame iframe
  lies about viewport width).
- **No nested scroll on mobile.** The page already scrolls; capped scroll-in-card is desktop-only.
  On mobile use top-N + "show all · N" and drop secondary columns to fit the phone width with no
  horizontal scroll.
- **Data trust is a designed layer, not a badge.** Provenance, freshness, and honest
  Known/Unknown/Conflict/stale states are first-class components in tables, profiles, and
  breakdowns — every number traceable to source replays.
- **Never color-alone.** Pair every semantic color with an icon and/or label. Tabular mono for all
  numbers. RU + EN, every string i18n-keyed — sanity-check the RU for clipped or awkward wording.

## Reference index

- [`references/design-system.md`](references/design-system.md) — the `@google/design.md` token
  layer: the `DESIGN.md` format, the export-to-`@theme` workflow, the spacing scale, lint/diff gates.
- [`references/spec-template.md`](references/spec-template.md) — the per-surface contract template
  (the ×5 / ×4 / breakpoints / roles / data / component-states checklist).
- [`references/pipeline.md`](references/pipeline.md) — the brief → spec → prototype → gate →
  graduate stages in detail, incl. the durable Ladle component catalog and the graduate-to-TanStack step.

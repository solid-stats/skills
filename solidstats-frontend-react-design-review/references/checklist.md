# Design Review Checklist

The full per-pillar checklist behind `SKILL.md`. Sources: the checklist.design per-component
checklists, the Selectel pre-handoff checklist, and the SolidStats-specific rules. Run the relevant
component checklist before calling a surface done; report findings in the
`solidstats-shared-review-standards` format.

## Pillar 1 — Tokens & contrast

- [ ] `@google/design.md lint DESIGN.md` passes (structure, `{token}` refs, **WCAG contrast**).
- [ ] No arbitrary Tailwind values anywhere in the surface (`bg-[#…]`, `p-[7px]`, `text-[13px]`,
      `w-[317px]`). Every value resolves to a theme token.
- [ ] Semantic colors used per meaning (cyan = interactive only; green/red/amber/blue = win/loss/
      unknown·conflict/info), each with the matching `-weak`/`-border` token where applicable.
- [ ] `design.md diff` clean if the system was touched — no unintended token regression.

## Pillar 2 — Real-width visual (Playwright at the project breakpoints)

> Project breakpoints + content-width strategy: the single source is
> `solidstats-frontend-react-design` → `references/design-system.md` (incl. 1920 / 2560 / ultrawide).

- [ ] Screenshot at each project breakpoint; assert the **container** width, not the device-frame
      viewport.
- [ ] No label collisions, orphan tiles, clipped text, or trailing-gap "air".
- [ ] Matches the hi-fi / `DESIGN.md` intent (spacing rhythm, hierarchy, density).
- [ ] **CLS = 0** (zero layout shift) — every async region reserves its final height; skeleton matches final colgroup +
      header + row height.
- [ ] Animations use only `transform`/`opacity` (never width/height/top/left/margin) — layout
      animations cause CLS + jank.
- [ ] CWV measured via **Chrome DevTools MCP** (`performance_start_trace`): LCP ≤ 2.5s, INP ≤ 200ms,
      CLS = 0; `performance_analyze_insight` names the element behind any shift.
- [ ] **Back restores** table state + scroll offset + virtualized window + Query cache, with **no**
      blocking reload and no visible jump. (🔴 if broken — the brief's signature requirement.)
- [ ] SSE updates do not reorder/insert above the viewport (use a "new updates" affordance instead).

## Pillar 3 — Accessibility (axe-core + WCAG 2.2 AA, plus specific AAA)

> AA baseline + these AAA: **2.5.5** Target Size Enhanced (44×44) · **2.4.13** Focus Appearance ·
> **2.4.12** Focus Not Obscured (Enhanced) · **2.1.3** Keyboard (No Exception) · **2.4.10** Section
> Headings · **2.4.8** Location · **2.3.3** Animation from Interactions · **2.2.3** No Timing ·
> **3.3.6** Error Prevention (All) *[request flow]* · **3.2.5** Change on Request *[check]*. **Not**
> **1.4.6** / **1.4.8** (fight the dark UI), **2.4.9**, **3.1.3–3.1.6**, **1.3.6** (cost/benefit). `axe-core` = free MPL-2.0 engine via `@axe-core/playwright`, not Deque's paid Pro.
> **Verify every criterion** against [w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/) + the
> [WCAG 2.2 quick-ref](https://www.w3.org/WAI/WCAG22/quickref/), never from memory.

- [ ] axe-core reports no violations.
- [ ] Visible focus ring on every interactive control; focus order matches visual order; no traps.
- [ ] Keyboard-complete: every action reachable and operable without a pointer.
- [ ] Touch targets ≥ 44×44px; click zone is the whole row where rows are clickable.
- [ ] Never color-alone — every semantic color paired with an icon and/or label.
- [ ] `prefers-reduced-motion` respected across interaction-triggered motion (charts, sort, expand,
      route transitions) — `2.3.3`; essential motion (loading) exempt. No motion-/hover-only meaning.
- [ ] Section headings are real `<h2>/<h3>` per panel (`2.4.10`); a focused control is never hidden
      under a sticky bar or overlay (`2.4.12`).
- [ ] Correction-request flow has error prevention — reversible / checked / confirmed (`3.3.6`); no
      auto context-change without user action (`3.2.5`).
- [ ] Text contrast ≥ 4.5:1 (3:1 for large/UI) — confirmed by `design.md lint`.

## Pillar 4 — States & data volumes (against surface spec §4/§5)

- [ ] **×5 scenario endings** all designed: success · error (system: id+contact / user: by-field) ·
      loading (reserved-height skeleton) · onboarding · empty (actionable copy + total count).
- [ ] **×4 data-volume states** for every list/table/field: empty · few · many · limit-reached.
- [ ] Long values truncate+tooltip or wrap — never clip, especially in the narrowest column.
- [ ] Capped window + sticky-header scroll on desktop; total count in the label/caption.
- [ ] Side-by-side tables reserve fixed row slots → equal height for any data volume.

## Pillar 5 — Responsiveness & layout

- [ ] Reflow keyed off the container (`container-type: inline-size` + `@container`), not viewport.
- [ ] Verified at the **real** mobile-floor 360px column (not just the device-frame iframe).
- [ ] Mobile: no nested scroll, no horizontal scroll; secondary columns dropped; top-N + "show all".
- [ ] Tablet (`lg` / landscape) keeps every column when there is room — don't drop data unnecessarily.
- [ ] At **1920** (the default desktop, ~54% of the audience): the data container uses the width
      (≈ 1760), not a narrow ~1240 column with huge gutters.
- [ ] At **2560 / 4K / ultrawide**: data container caps and centers; no table stretched past the
      readable ceiling; prose stays at reading width (~720); width becomes rows/columns, not gutter.
- [ ] Full-width stacked sections; side-by-side only for naturally-equal things (e.g. two hero
      tiles, the two arsenal tables). No near-empty full-width strips.
- [ ] Tables scroll inside their own card — never spill onto a neighbor.

## Pillar 6 — System & domain adherence

- [ ] Dark-only gunmetal; no light-mode artifacts.
- [ ] Cyan is the single interactive accent, used sparingly.
- [ ] Lucide icons only — no emoji, no ad-hoc Unicode glyphs as UI icons.
- [ ] Tabular mono for all numbers; right-aligned in numeric table columns; signed deltas.
- [ ] **Data trust present & honest:** provenance line (computed from N replays), freshness pill
      (Up to date / Stale / Offline / Reconnecting), and `Known` / `Unknown` / `Conflict` rendered
      as designed components — `Unknown` is the literal word in an amber badge, never `0` or `—`.
- [ ] Pending workflow events (e.g. SteamID merge) render as a quiet inline row, not a filled banner
      or a box floating at the bottom of a stretched column.
- [ ] Status vocabulary is the fixed set (`Pending`/`Approved`/`Rejected`/`Reopened`;
      `Queued`/`Parsing`/`Failed`/`Retried`; etc.).
- [ ] **RU + EN both natural** — no clipped, slipping, or awkward labels; sanity-check the Russian.
- [ ] Mock numbers obey the domain formulas (Score / K-D) and never outrank the real leaders.

## Pillar 7 — SEO (public pages)

- [ ] Indexable content is in the SSR HTML (view-source), not client-only-fetched.
- [ ] Per-route `<head>`: unique `<title>`, meta description, canonical; OG/Twitter on shareable pages.
- [ ] Valid JSON-LD where it fits (player / squad entity).
- [ ] One `<h1>` + logical heading hierarchy (ties to `2.4.10`).
- [ ] No `noindex` on public pages; no self-conflicting canonical.
- [ ] Depth: the `seo` skill.

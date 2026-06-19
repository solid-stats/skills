# Design System — `@google/design.md` token layer

The SolidStats design system is a single `DESIGN.md` file in the
[`@google/design.md`](https://github.com/google-labs-code/design.md) format. It is the **single
source of truth for design tokens**; the production Tailwind theme and any other CSS/DTCG export
are *generated* from it, never hand-maintained in parallel. This file covers the locked direction,
the format, the export workflow, the responsive and motion systems, and the gates.

## The system (locked direction — do not regenerate)

Dark-only gunmetal "tactical operations terminal". Layered blue-tinted ink surfaces
(`--bg-0` → `--surface-3`, stepping up in lightness as they come forward); **one cyan signal
accent** (`#36C5E0` = interactive / active / brand) used sparingly so it stays meaningful; semantic
green / red / amber / blue (win / loss / unknown·conflict / info), each with a `-weak` tint and a
`-border`, and **never used color-alone** (always an icon and/or label too). **Saira** display +
**IBM Plex Sans** body + **IBM Plex Mono** tabular numerals (all carry Cyrillic for RU/EN). 4px
spacing grid, sharp technical radii (2–12px), hairline borders as the primary separator, restrained
shadows reserved for floating UI, fast functional motion (120/170ms, no decorative animation). Full
rationale: `.design/_ds/README.md`. This direction is ratified — do **not** rebuild it from a
generator.

## Format

YAML front matter (machine-readable tokens) + Markdown body (rationale):

```yaml
---
name: SolidStats
colors:
  bg-0: "#0A0D13"
  surface-1: "#151A25"
  primary: "#36C5E0"
  win: "#3FCF8E"
typography:
  display:
    fontFamily: Saira
    fontWeight: 700
spacing:
  # spacing uses Tailwind's stock 4px scale (p-1=4px, p-2=8px …) — no custom keys
rounded:
  md: 6px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.fg-on-accent}"
    rounded: "{rounded.sm}"
---
```

Markdown body, canonical section order: **Overview · Colors · Typography · Layout · Elevation &
Depth · Shapes · Components · Do's and Don'ts.**

## Export → Tailwind v4 `@theme` (this *is* the token codegen)

```bash
npx @google/design.md export --tailwind-v4 DESIGN.md > src/styles/theme.css
```

Import `theme.css` once. It emits the `@theme { --color-*, --spacing-*, --radius-*, --text-*, … }`
block, exposing every token as both a Tailwind utility namespace and a runtime CSS variable. Add
`--*: initial` (or `--color-*: initial`) so Tailwind's stock palette is removed and only the
SolidStats dark palette exists. There is **no bespoke generator** — the CLI owns this.

`design.md` also exports **W3C DTCG** (the design-token interchange standard, stable since Oct 2025)
and Tailwind v3 JSON, so `DESIGN.md` stays on the standard and portable (Style Dictionary, other
token tooling) rather than locked to one exporter. The export is an **explicit step run on every
token change** — token codegen is not automatic, and real teams' token pipelines are mostly
hand-driven, so treat "export" as a committed build step, not magic.

### Spacing — Tailwind's default scale

Use **Tailwind's stock spacing scale** — it is already a 4px grid (`p-1` = 4px, `p-2` = 8px,
`p-4` = 16px; the 2px step is `p-0.5`). Do not invent a custom named grid: the spacing utilities
keep their standard Tailwind meaning, nothing diverges from muscle memory, and there is one fewer
token set to maintain.

## Responsive breakpoints & content width (the canonical set — change here, nowhere else)

The whole skill set keys off **one** breakpoint set and **one** content-width strategy, defined
here. Reflow is container-driven (`@container` / the `--container-*` scale), **not** viewport (the
device-frame trap). Grounded in the Steam Hardware Survey (our PC-gamer audience) and aligned to
Tailwind v4 tokens.

**Why large screens are first-class.** The SolidGames audience is PC gamers; per the Steam Hardware
Survey **~54% sit at 1920-width and ~40% are WIDER than 1920** (2560×1440 ≈ 21%, 2560×1600 ≈ 5%,
4K ≈ 5%, ultrawide 3440 ≈ 3%). A hard ~1240 cap would gutter the majority of our users on a
data-dense product, so **data surfaces use the width**; only reading content stays narrow.

**Two content containers:**

- `--container-prose` ≈ **720px** — reading content (request flows, moderation comments,
  about/help). Capped for line length regardless of screen size.
- `--container` (data/page) ≈ **1760px ceiling, fluid below** — tables, leaderboards, stat grids,
  profiles. Grows with the viewport (side padding) up to the ceiling, then centers. **This replaces
  the old `--container: 1240`** — flag the brief and `_ds` to match.

**Breakpoints / design + test widths:**

| Tier | Width | Tailwind | Notes |
|------|-------|----------|-------|
| Mobile (base) | **360** floor | base | spot-check 390 / 414 |
| Tablet portrait | **768** | `md` | iPad / 8" |
| Tablet landscape / small laptop | **1024** | `lg` | |
| Small desktop / laptop | **1280** | `xl` | data container ≈ full − padding |
| **Desktop (default)** | **1920** | `3xl`\* | the modal desktop (~54%); data container ≈ 1760 + gutters |
| **Large desktop / 2K** | **2560** | `4xl`\* | data container 1760, centered; consider an extra column / higher density |
| **Ultrawide / 4K** | **3440 / 3840** | — | container caps at 1760 + centers; a table must NOT stretch past the ceiling — consider master-detail / multi-pane to turn width into data, not gutter |

\* Add the custom tokens `@theme { --breakpoint-3xl: 120rem; --breakpoint-4xl: 160rem; }` (1920 /
2560); keep Tailwind's `md/lg/xl/2xl` (768 / 1024 / 1280 / 1536).

**Design and review at 360 · 768 · 1024 · 1280 · 1920 · 2560**, with 390/414 mobile spot-checks and
a 3440 ultrawide cap-check. Every other file points here — do not re-hardcode breakpoints or
container widths elsewhere.

> The brief mandates mobile-first and the design system stays dark/dense; option B (large screens
> use the width) was chosen against the Steam data because the gamer audience skews to 1440p+/
> ultrawide and a data product should spend that width on rows/columns, not gutters.

## Motion

Fast and functional — the product reports, it doesn't perform. Tokens: `--dur-fast` 120ms /
`--dur-base` 170ms / `--dur-slow` 260ms; `--ease-out` (most), `--ease-in-out` (symmetric moves).

- **Animate only `transform` and `opacity`.** Never animate layout properties (width / height /
  top / left / margin) — they trigger reflow → jank and **layout shift**, and our budget is **CLS = 0**.
  `transform`/`opacity` are compositor-only and cost nothing in layout.
- **No decorative motion** — no bounce, no parallax, no attention-seeking animation. Motion conveys
  state or spatial continuity, or it does not exist.
- **Micro-interactions:** hover lifts the surface one step (`--surface-1` → `--surface-3`) and/or
  brightens the border; press deepens the color + a 1px translate-down / `scale(0.99)`; focus shows
  the ring instantly.
- **Reduced motion (WCAG `2.3.3`):** honor `prefers-reduced-motion` (Tailwind `motion-reduce:`)
  across all interaction-triggered motion — chart transitions, leaderboard re-sorts, row
  expand/collapse, route transitions. Keep essential motion (a loading spinner conveying state).
  Never motion-only meaning.

## Gates (wired into `solidstats-frontend-react-design-review`)

- `npx @google/design.md lint DESIGN.md` — structure, broken `{token}` references, **WCAG contrast
  ratios**. Run on every token change; a contrast failure is a blocker.
- `npx @google/design.md diff <old> <new>` — token-level regressions; use when editing the system to
  see exactly what moved before it ships.

> **Adoption caveat & the verified DTCG→`@theme` fallback.** Verify `@google/design.md`'s
> maturity / version / license before pinning it as a build dependency. The **primary path** is
> `design.md export --tailwind-v4` (DESIGN.md → `@theme` directly — no DTCG bridge needed). If that
> output ever disappoints, the verified fallback is to export `DESIGN.md` → **W3C DTCG**, then bridge
> DTCG → `@theme` with **`@terrazzo/plugin-tailwind`** (Terrazzo; reads DTCG JSON, emits a Tailwind
> v4 `@theme` block — the most turnkey bridge, CSS-first, v4-only) or **Style Dictionary v4**
> (DTCG-native, but `@theme` needs a custom CSS format). **Caveat for our type scale:** Terrazzo
> collapses double-dash names by default, so paired props like `--text-xs--line-height` need its
> custom `variableName` function. The `DESIGN.md` (→ its DTCG export) stays the SoT regardless of
> exporter.

## `ui-ux-pro-max` — advisory by design (it *can* persist; we just don't need it to)

```bash
python3 <ui-ux-pro-max>/scripts/search.py "<product> <keywords>" --domain ux|chart
```

We use its project-agnostic **knowledge** — UX guidelines (keyboard nav, density, table overflow,
bulk actions) and chart recommendations, via `--domain`. You target them by tuning the **query**;
no project config is needed because these answers don't depend on our palette.

It *does* have a persist/config path: `--design-system --persist -p "SolidStats" -o <dir>` writes a
project-scoped `design-system/<slug>/MASTER.md` into **our** repo (not the vendored skill, so it
survives `npx skills update`). But that tunes its **generation** mode ("build me a dashboard"), and
we do not use it as a generator — the design system is `DESIGN.md` and the pipeline is this skill.
Persisting a second design system there would duplicate `DESIGN.md` and invite drift, so we **don't**.
Consume its knowledge, not its generation. If its DS-aware generator is ever wanted, persist a
`MASTER.md` *derived from* `DESIGN.md` (one-way) — never hand-maintain two systems.

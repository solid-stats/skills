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
  # illustrative shape only — the real palette lives in DESIGN.md, never duplicated here
  bg-0: "#RRGGBB"
  surface-1: "#RRGGBB"
  primary: "#RRGGBB"        # the single cyan accent
  win: "#RRGGBB"            # one of the four semantics (each + -weak + -border)
typography:
  display:
    fontFamily: <display-family>
    fontWeight: 700
spacing:
  # spacing uses Tailwind's stock 4px scale (p-1=4px, p-2=8px …) — no custom keys
rounded:
  md: <px>
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.fg-on-accent}"
    rounded: "{rounded.sm}"
---
```

Markdown body, canonical section order: **Overview · Colors · Typography · Layout · Elevation &
Depth · Shapes · Components · Do's and Don'ts.**

## Export → Tailwind v4 `@theme`

`theme.css` is **generated from `DESIGN.md`, never hand-edited** — `DESIGN.md` is the single token
source of truth. Regenerate it on every token change (a committed build step, not magic):

```bash
node scripts/gen-theme.mjs      # reads DESIGN.md → writes src/styles/theme.css
```

It emits the `@theme { --color-*, --text-* with paired --text-*--line-height, --font-*, --radius-*,
--breakpoint-3xl/4xl, --container* … }` block, plus a leading `--*: initial` reset so Tailwind's stock
palette is dropped and only the SolidStats dark tokens exist (no exporter emits that reset — the
generator must). Import `theme.css` once.

> **Why a project generator, not the `@google/design.md` CLI (interim).** The official
> `design.md export --format css-tailwind` (the flag is `--format css-tailwind`, **not**
> `--tailwind-v4`) **silently drops typography `line-height`** in v0.3.0 — and so does its `dtcg`
> export — which is disqualifying for a paired text/line-height scale. So `@google/design.md` is used
> here for **`lint` and `diff` only** (its real value: the WCAG-contrast and broken-`{token}` gates on
> `DESIGN.md`), while `scripts/gen-theme.mjs` owns the `@theme` codegen. **Migration trigger:** when a
> design.md release emits the paired line-height (`--leading-*`, already promised in its README),
> retire the generator and switch to the official `export --format css-tailwind` after re-validating
> the output. design.md's `dtcg` export stays the portability path (W3C DTCG, stable since Oct 2025)
> once it too preserves line-height.

### Spacing — Tailwind's default scale

Use **Tailwind's stock spacing scale** — it is already a 4px grid (`p-1` = 4px, `p-2` = 8px,
`p-4` = 16px; the 2px step is `p-0.5`). Do not invent a custom named grid: the spacing utilities
keep their standard Tailwind meaning, nothing diverges from muscle memory, and there is one fewer
token set to maintain.

## Responsive breakpoints & content width (the canonical rationale + design widths)

The whole skill set keys off **one** breakpoint set and **one** content-width strategy. The
machine-emitted values (`--breakpoint-*`, `--container*`) are authored once in `DESIGN.md` `layout.*`
and flow to `theme.css`; this section is the **rationale + the design/test widths**, not a second
token source — keep them in sync, don't fork the numbers. Reflow is container-driven (`@container` /
the `--container-*` scale), **not** viewport (the device-frame trap). Grounded in the Steam Hardware
Survey (our PC-gamer audience) and aligned to Tailwind v4 tokens.

**Why large screens are first-class.** The SolidGames audience is PC gamers; per the Steam Hardware
Survey **~54% sit at 1920-width and ~40% are WIDER than 1920** (2560×1440 ≈ 21%, 2560×1600 ≈ 5%,
4K ≈ 5%, ultrawide 3440 ≈ 3%). A hard ~1240 cap would gutter the majority of our users on a
data-dense product, so **data surfaces use the width**; only reading content stays narrow.

**Two content containers:**

- `--container-prose` ≈ **720px** — reading content (request flows, moderation comments,
  about/help). Capped for line length regardless of screen size.
- `--container` (data/page) ≈ **1760px ceiling, fluid below** — tables, leaderboards, stat grids,
  profiles. Grows with the viewport (side padding) up to the ceiling, then centers. **This replaced
  the old `--container: 1240`** — now reconciled in `DESIGN.md`; the old value survives only in the
  frozen `.design/` archive.

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
a 3440 ultrawide cap-check. Other skill files point here for the design/test widths; the token
**values** live once in `DESIGN.md` `layout.*` → `theme.css`.

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

> **Tooling reality (validated 2026-06-20).** `@google/design.md` is `v0.3.0`, **Apache-2.0** (npm
> renders "Proprietary" only because its `package.json` `license` field is empty — cosmetic), ~105k
> weekly downloads, actively maintained. Safe to pin **as a `lint` / `diff` dev tool**, but **not as
> the `@theme` generator yet**: `export --format css-tailwind` (and its `dtcg` export) silently drop
> typography `line-height` in 0.3.0. So the codegen is the project's `scripts/gen-theme.mjs` (above)
> until that ships fixed — the migration trigger. A `@terrazzo/plugin-tailwind` bridge (DTCG →
> `@theme`, MIT, the most turnkey bridge) is a viable alternative generator, **but** feeding it
> design.md's DTCG inherits the same line-height loss (you'd source line-height separately), and its
> own `variableName` flattens double-dash names like `--text-xs--line-height` — so the tiny in-repo
> generator is simpler today. `DESIGN.md` is the SoT regardless of exporter; `theme.css` is a pure
> build output.

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

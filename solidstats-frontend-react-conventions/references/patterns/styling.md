# Styling — vanilla-extract

Styling, design tokens, and the theme contract. SolidStats uses vanilla-extract (same as the estesis
frontend), so the estesis discipline transfers; the token/theme structure below is the SolidStats
addition (greenfield).

## Style files

- Style files are **colocated** with the component that owns them: `<ComponentName>Style.css.ts`
  (lower-camel prefix + `Style.css.ts`). A sub-region's style lives next to the component that owns it,
  not in a parent's shared file.
- `clsx` for composing classes; use the shared stack/layout helper for flex/stack layouts rather than
  hand-writing `display: flex` blocks. Shared style helpers live under `shared/uikit/style` or
  `shared/lib/styles`.
- **No `transition: all`.** No ad-hoc CSS mechanism outside vanilla-extract. vanilla-extract property
  ordering is linted — don't hand-review it.
- Don't reinvent a uikit primitive's styles — use the primitive; if none exists, file a uikit task
  rather than hand-rolling a one-off.

## Tokens & theme contract

The visual system is token-driven via a vanilla-extract **theme contract**, with a **dark default and
a first-class light theme** (brief). Proposed token contract structure (your call — see note):

```
src/shared/uikit/theme/
├── contract.css.ts     # createThemeContract — the token shape (themes must fill all of it)
├── dark.css.ts         # createTheme(contract, { … })  — default
├── light.css.ts        # createTheme(contract, { … })
└── tokens.ts           # non-theme scales (space, radius, z-index, breakpoints, durations)
```

Token categories in the contract: **color** (surface/text/border/accent/state — semantic, not raw
hex), **typography** (families incl. a tabular-numeral face for stats/ranks/timers/IDs, sizes, weights,
line-heights), **space**, **radius**, **density** (compact/comfortable for the desktop density toggle),
**elevation**, and **state** colors.

- Components reference **semantic tokens**, never raw hex/px literals — `color: vars.color.textMuted`,
  not `#888`. State/status color comes from the token system (checked contrast), never inline hex or
  white-on-light.
- Theme switches by applying the dark/light class at the root; both themes fill the **same contract**
  so a missing token is a build error.
- Density is a token set toggled per the desktop density control (brief), not ad-hoc per-component
  sizing.

## Design direction (enforced)

From the brief — these are style rules, not just guidance:

- **Stable dimensions** for tables, cards, media, skeletons, filters, toolbars, controls (no CLS).
- **No nested cards**, no card-heavy decorative sections, no one-note palettes, no ornamental
  gradients/blobs.
- **Lucide** is the only icon family; no emoji as structural icons.
- Animations use `transform`/`opacity` only and respect `prefers-reduced-motion` (see `performance.md`).
- Dense but readable: tables/rankings/microcharts over large dashboard charts.

## Responsive & layering

- Breakpoints come from breakpoint tokens / a media helper; runtime branching via a screen-width hook or
  an adaptive wrapper. **z-index comes from a scale** (`zIndex.modal`), never a magic number.

Review flags:

- A style file not named `<Name>Style.css.ts` or not colocated with its owner.
- A raw hex/px literal where a semantic token exists; status color as inline hex or white-on-light.
- `transition: all`; an ad-hoc CSS mechanism outside vanilla-extract.
- A nested card / ornamental gradient / emoji icon; a magic z-index.
- A component with shifting dimensions (CLS) instead of reserved space.

> **Open call to confirm (your domain):** the token contract layout above (`contract`/`dark`/`light`/
> `tokens` split, the category list, semantic-only color naming). Adjust to your preferred token system
> — the brief lists "exact visual identity tokens" as an implementation follow-up.

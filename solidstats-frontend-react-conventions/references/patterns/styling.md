# Styling — Tailwind v4

Styling, design tokens, and the theme. SolidStats `web` styles with **Tailwind CSS v4**, themed from a
single `DESIGN.md` token source. This supersedes the original vanilla-extract direction — there is no
`*.css.ts`, no `createThemeContract` / `createTheme`, and no parallel hand-maintained CSS.

## Tokens are generated, never hand-written

- The single source of truth for design tokens is the `@google/design.md` **`DESIGN.md`** owned by
  [`solidstats-frontend-react-design`](../../../solidstats-frontend-react-design/SKILL.md). The
  production Tailwind theme is **generated** from it, never hand-maintained in parallel:

  ```bash
  npx @google/design.md export --tailwind-v4 DESIGN.md > src/styles/theme.css
  ```

  Import `theme.css` once. It emits the `@theme { --color-*, --spacing-*, --radius-*, --text-*,
  --breakpoint-* … }` block, so every token is both a Tailwind utility namespace and a runtime CSS
  variable. Add `--*: initial` (or `--color-*: initial`) inside `@theme` so Tailwind's stock palette is
  dropped and only the SolidStats dark palette exists.
- **Never hand-edit `theme.css`** and never add a second token file beside it — re-run the export. The
  token system, the export workflow, the contrast gates, and the DTCG→`@theme` fallback bridge are
  owned by the design skill (`references/design-system.md`); this file governs only how components
  **consume** the tokens.

## Utilities, not arbitrary values

- Style with Tailwind utility classes that resolve to `@theme` tokens: `bg-surface-1`, `text-muted`,
  `gap-2`, `rounded-md`. Reference **semantic tokens**, never a raw value.
- **No arbitrary values.** `bg-[#36C5E0]`, `p-[7px]`, `text-[13px]` are banned. A value you cannot
  express with a token utility means the token is missing: add it to `DESIGN.md` and re-export — do not
  inline it. Arbitrary values are how a token system silently dies, so this is the rule that keeps the
  design system honest.
- **Spacing is Tailwind's stock 4px scale** (`p-1` = 4px, `p-2` = 8px, `p-0.5` = 2px) — no custom named
  grid; nothing diverges from muscle memory.
- Compose conditional classes with **`tailwind-variants` (`tv`)** for any component that has variants,
  states, or sizes (button, badge, card, table row) — it owns variant logic, slot composition, and
  class-conflict resolution. Reach for `clsx` / `cn` only for a one-off conditional `className`; never
  hand-concatenate class strings or build a bespoke recipe layer.
- No ad-hoc CSS outside Tailwind: no inline `style={{…}}` for themable properties, no stray `.css`
  files. A genuine escape hatch (a dynamic computed value, a third-party widget) reads a CSS variable
  from `@theme`, not a hardcoded literal.

## The system is dark-only

The design system is **dark-only** (gunmetal) — there is no light theme and no theme-switch contract.
(This replaces the earlier dark + light `createThemeContract`; the brief is now dark-only.) One cyan
signal accent, used sparingly; semantic green / red / amber / blue each used **never color-alone**
(always an icon and/or label too). Status / state color comes from a token utility (contrast-checked by
`design.md lint`), never an inline hex or white-on-light. Full direction: the design skill's
`references/design-system.md`.

## Design direction (enforced)

From the brief and the design system — these are style rules, not just guidance:

- **Stable dimensions** for tables, cards, media, skeletons, filters, toolbars, controls — reserve
  space, no CLS.
- **No nested cards**, no card-heavy decorative sections, no one-note palettes, no ornamental
  gradients / blobs.
- **Lucide** is the only icon family; no emoji as structural icons.
- Animate **`transform` / `opacity` only**, honoring `prefers-reduced-motion` (`motion-reduce:`); never
  animate layout properties — see `performance.md` and the design skill → Motion.
- Dense but readable: tables / rankings / microcharts over large dashboard charts.

## Responsive & layering

- **Breakpoints and content width are not redefined here.** The canonical breakpoint set and the
  two-container strategy (`--container-prose` for reading content, `--container` for data) are the
  single source in
  [`solidstats-frontend-react-design/references/design-system.md`](../../../solidstats-frontend-react-design/references/design-system.md)
  → Responsive breakpoints. Use the `@theme` breakpoint utilities (`md:` `lg:` `xl:` `3xl:` `4xl:`);
  prefer container queries (`@container`) over viewport branching for component reflow, with a runtime
  screen-width hook only when CSS cannot express it.
- **z-index comes from a token scale / utility** (`z-modal`), never a magic number.

Review flags:

- An **arbitrary Tailwind value** (`bg-[#…]`, `p-[7px]`, `text-[13px]`) where a token utility exists —
  or a hardcoded value that should be a new `DESIGN.md` token.
- A raw hex / inline `style` for a themable property; status color as inline hex or white-on-light.
- A hand-built variant/recipe or class-string concatenation instead of `tailwind-variants`.
- A hand-edited `theme.css`, or a second parallel token file, instead of re-exporting from `DESIGN.md`.
- A nested card / ornamental gradient / emoji icon; a magic z-index; a `transition` or animation on a
  layout property.
- A component with shifting dimensions (CLS) instead of reserved space.
- A re-hardcoded breakpoint or container width instead of the canonical `design-system.md` tokens.

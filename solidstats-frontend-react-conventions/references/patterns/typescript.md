# TypeScript

Strictness and the generated-types boundary. Adapted from the estesis frontend TS conventions to the
SolidStats stack (OpenAPI types + `zod/v4-mini`).

## Basics

- Use **`type`**, never `interface`. Type aliases are PascalCase; enum-like value sets are `as const`
  objects + a derived union (no TS `enum`); schema variables are camelCase + `Schema` suffix.
- **No `any`, no non-null assertions (`!`), no force `as`** without a local comment and reason. Prefer
  narrowing, predicates, schemas, or generated types.
- `noUncheckedIndexedAccess` is **on** (brief) — handle the `T | undefined` from indexed access; don't
  `!` it away.
- `switch`/branching: booleans use `if`; non-boolean unions use `switch`. Backend/untrusted values need
  a safe `default`; frontend-owned finite unions are exhaustive **without** `default` (rely on
  `switch-exhaustiveness-check`).

## Generated OpenAPI types are the source of truth

- API request/response types come from `openapi-typescript` (`paths`), consumed via `openapi-fetch` /
  `openapi-react-query` (see `data-flow.md`). **Never hand-write a DTO**; regenerate when the `server-2`
  schema changes; CI fails on stale generated types (brief).
- Don't reference a long generated type name directly in UI/stores — add a short **alias model** in
  `shared/lib/types/models` and use that.
- **Model (server shape) → Data (app shape):** process a backend model into its app shape at the
  boundary; `*Model` stays in business/processors, not in UI/components directly. (e.g. mask SteamID to
  last-4 at the boundary, not in a display.)

## Backend-driven values break at compile time

- Type a label/value map over a backend enum as **`Record<Enum, …>`** so a missing or renamed key is a
  `tsc` error — never a hand-rolled `switch`/map that silently drops unknown values (it gives no signal
  the frontend needs updating after a `server-2` enum change).
- Type `Select`/option lists by their declared value union, not `SelectOption<string>`.

## Runtime validation — `zod/v4-mini`

- Untrusted runtime input (route search params, form input, any non-generated payload, `localStorage`)
  is validated with **`zod/v4-mini`** — the bundle-conscious Zod v4 build (matters for the CWV/bundle
  budgets). Prefer `safeParse` for untrusted input unless throwing is intentional and caught.
- Route search schemas (`validateSearch`) use `zod/v4-mini` (see `routing.md`).
- Don't re-validate data that already arrives typed from the generated OpenAPI client — validate at real
  trust boundaries only.

## Derivation

- Local slice types live in `<slice>/lib/types.ts`; derive from models with `type-fest`
  (`Pick`/`Omit`/`Except`/`Modify`) rather than redeclaring primitives.
- Domain ID props prefer property references: `PlayerData['id']`, `RequestData['id']`.

## Lint, format & type-check — Vite+

The repo's lint/format/type-check toolchain is **Vite+** (`vp`, by VoidZero) — Oxlint + Oxfmt + tsgo
on the shared oxc core, configured in `vite.config.ts`.

- **Lint — Oxlint, configured strict:** enable the `correctness`, `suspicious`, and `pedantic`
  categories plus type-aware rules (tsgo-backed) and the framework plugins (React hooks, import,
  jsx-a11y). Warnings are errors in CI. A suppression carries a one-line justification — never a
  blanket file disable. "Strict but within reason": don't enable a rule that fights the documented
  conventions here (e.g. a rule banning a pattern this skill mandates) — turn those off deliberately,
  with a comment.
- **Format — Oxfmt** (Prettier-compatible): formatting is **not** hand-reviewed — `vp check --fix`
  owns it.
- **Type-check — tsgo** with the strict flags above (`noUncheckedIndexedAccess`, no `any`, …).
- **Gate:** `vp check` (format + lint + type-check) must pass in CI, alongside the Playwright /
  Lighthouse / bundle gates (see `tests.md`).

Review flags:

- `interface`, `any`, `!`, or an unexplained `as`; an indexed access `!`-ed instead of handled.
- A hand-written DTO mirroring a generated type; a long generated name used directly in UI.
- A `*Model` consumed directly by a component instead of a processed `*Data`.
- A backend enum map written as a `switch`/object literal instead of `Record<Enum,…>`.
- Runtime validation with full `zod` instead of `zod/v4-mini`, or validating already-typed generated data.

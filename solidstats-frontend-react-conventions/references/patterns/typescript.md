# TypeScript

Strictness and the generated-types boundary. Adapted from the estesis frontend
TS conventions to the
SolidStats stack (OpenAPI types + `zod/v4-mini`). The shared TS baseline is
owned by
**`solidstats-shared-ts-standards`** (§B code style, §F utility & type
libraries) — this file adds
only the web-specific rules on top.

For contract-bound work, read the
[public HTTP
contract](../../../solidstats-shared-project-standards/references/http-api-contract.md).
It owns the precise wire schema; generated aliases and app transformations must
preserve it.

## Basics

- The baseline TS style — `type` over `interface`, no `any` / `!` / unexplained
  `as`, handling the
  `T | undefined` from `noUncheckedIndexedAccess` — is owned by
  **`solidstats-shared-ts-standards` §B**; read it first, it is not restated
  here.
- Web naming on top: type aliases are PascalCase; enum-like value sets are
  `as const` objects + a
  derived union (no TS `enum`); schema variables are camelCase + `Schema`
  suffix.
- `switch`/branching: booleans use `if`; non-boolean unions use `switch`.
  Backend/untrusted values need
  a safe `default`; frontend-owned finite unions are exhaustive **without**
  `default` (rely on
  `switch-exhaustiveness-check`).

## Generated OpenAPI types are the source of truth

- API request/response types come from `openapi-typescript` (`paths`), consumed
  via `openapi-fetch` /
  `openapi-react-query` (see `data-flow.md`). **Never hand-write a DTO**;
  regenerate from the approved
  schema and verify the implemented export agrees with it; CI fails on stale
  generated types.
- Don't reference a long generated type name directly in UI/stores — add a short
  **alias model** in
  `shared/lib/types/models` and use that. An alias indexes or derives from
  generated types; it never
  repeats the wire fields in a second DTO.
- Preserve finite literal unions, UUID strings, required fields, and
  optional-vs-nullable semantics.
  Do not widen a known wire shape to `string`, `object`,
  `Record<string, unknown>`, or `any`, make
  every field optional, or cast around a mismatch. If generation loses
  precision, fix the schema
  or generator/toolchain rather than hiding the loss in frontend types.
  `unknown` is valid only at
  a real untrusted boundary before decoding.
- Consume tagged `oneOf` variants as generated discriminated unions: narrow on
  the required common
  tag before using variant-specific payloads. Error variants narrow on
  `errorCode` before accessing
  the exact `details` schema. Do not split correlated tags and payloads into
  independent types or
  merge all variants into one object with optional fields. Verify the approved
  OpenAPI 3.0.3 `oneOf`
  has distinct singleton tag enums and explicit discriminator mapping if
  generation cannot narrow.
- Intentional `anyOf` alternatives may overlap. Preserve their generated types
  without inventing distinct tags or assuming exactly one branch matches;
  follow the shared HTTP profile's branch and overlap evidence.
- **Model (server shape) → Data (app shape):** process a backend model into its
  app shape at the
  boundary; `*Model` stays in business/processors, not in UI/components
  directly. (e.g. mask SteamID to
  last-4 at the boundary, not in a display.)

## Backend-driven values break at compile time

- Type a label/value map over a backend enum as **`Record<Enum, …>`** (baseline:
  `solidstats-shared-ts-standards` §B "Enum compatibility") so a missing or
  renamed key is a
  `tsc` error — never a hand-rolled `switch`/map that silently drops unknown
  values (it gives no signal
  the frontend needs updating after a `server-2` enum change).
- Type `Select`/option lists by their declared value union, not
  `SelectOption<string>`.

## Runtime validation — `zod/v4-mini`

- Untrusted runtime input (route search params, form input, any non-generated
  payload, `localStorage`)
  is validated with **`zod/v4-mini`** — the bundle-conscious Zod v4 build
  (matters for the CWV/bundle
  budgets). Prefer `safeParse` for untrusted input unless throwing is
  intentional and caught.
- Route search schemas (`validateSearch`) use `zod/v4-mini` (see `routing.md`).
- Generated client types provide compile-time contracts, not runtime proof of an
  HTTP response.
  Decode unknown, malformed, or unexpected responses at the shared client trust
  boundary; validate
  a known tag and its corresponding shape before treating it as a known variant.
  Keep the boundary
  check derived from the approved schema where possible, never a parallel DTO or
  a type assertion.
  Components do not repeat validation after successful boundary decoding (see
  `errors.md`).

## Derivation & utilities

The canonical utility & type libraries — **`es-toolkit`**, **`type-fest`**,
**`day.js`**,
**`nanoid`** — are owned by **`solidstats-shared-ts-standards` §F**: what each
is for, the
evidence gate, and the web nuances (dayjs i18n wrapping + per-slice plugin
loading, nanoid's
ephemeral client-only scope). Reach for them actively rather than hand-rolling;
it is not restated
here. Web-specific additions on top:

- Local slice types live in `<slice>/lib/types.ts` and compose from a model (the
  generated alias or
  a `*Data` shape), not a fresh redeclaration.
- Domain ID props prefer property references: `PlayerData['id']`,
  `RequestData['id']`.

## Lint, format & type-check — Vite+

The repo's lint/format/type-check toolchain is **Vite+** (`vp`, by VoidZero) —
Oxlint + Oxfmt + tsgo
on the shared oxc core, configured in `vite.config.ts`.

- **Lint — Oxlint, configured strict:** enable the `correctness`, `suspicious`,
  and `pedantic`
  categories plus type-aware rules (tsgo-backed) and the framework plugins
  (React hooks, import,
  jsx-a11y). Warnings are errors in CI. A suppression carries a one-line
  justification — never a
  blanket file disable. "Strict but within reason": don't enable a rule that
  fights the documented
  conventions here (e.g. a rule banning a pattern this skill mandates) — turn
  those off deliberately,
  with a comment.
- **Format — Oxfmt** (Prettier-compatible): formatting is **not** hand-reviewed
  — `vp check --fix`
  owns it.
- **Type-check — tsgo** with the strict flags from
  `solidstats-shared-ts-standards` §A/§B
  (`noUncheckedIndexedAccess`, no `any`, …).
- **Gate:** `vp check` (format + lint + type-check) must pass in CI, alongside
  the Playwright /
  Lighthouse / bundle gates (see `tests.md`).

Review flags:

- A baseline violation of `solidstats-shared-ts-standards` §B (`interface`,
  `any`, `!`, an
  unexplained `as`, an indexed access `!`-ed instead of handled) — the rules
  and rationale live
  there; cite §B.
- A hand-written DTO mirroring a generated type; a long generated name used
  directly in UI.
- Generated literals/requiredness/nullability/UUID or union precision lost
  through widening or casts.
- Variant payload/details read without the corresponding tag narrowing, or
  correlated variants flattened.
- A `*Model` consumed directly by a component instead of a processed `*Data`.
- A backend enum map written as a `switch`/object literal instead of
  `Record<Enum,…>`.
- Runtime validation with full `zod` instead of `zod/v4-mini`; repeated
  component validation after
  decoding; or generated static types treated as proof that an untrusted
  response is well formed.
- A utility-library violation of `solidstats-shared-ts-standards` §F (a
  hand-rolled
  `es-toolkit`/`type-fest`/`dayjs`/`nanoid` equivalent — the evidence gate
  lives there); cite §F.
- A slice type redeclared instead of derived from its model.

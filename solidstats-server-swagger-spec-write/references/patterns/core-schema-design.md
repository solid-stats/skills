# Core patterns — schema design

## Contents

- [core/schema-self-contained](#coreschema-self-contained)
- [core/schema-nullability-30](#coreschema-nullability-30)
- [core/schema-nullability-scope](#coreschema-nullability-scope)
- [core/schema-ref-and-reuse](#coreschema-ref-and-reuse)
- [core/schema-allof-default](#coreschema-allof-default)
- [core/schema-polymorphism](#coreschema-polymorphism)
- [core/schema-const-vs-enum](#coreschema-const-vs-enum)
- [core/schema-validation-keywords](#coreschema-validation-keywords)
- [core/schema-description-on-property](#coreschema-description-on-property)
- [core/schema-default-once](#coreschema-default-once)
- [core/schema-openapi-303](#coreschema-openapi-303)

## core/schema-self-contained

```yaml
name: schema-self-contained
title: Change specifications are self-contained
category: schema
kind: core
severity_when_violated: BLOCKER
applies_to: [all proposed components]
related: [schema-ref-and-reuse, wording-no-internal-paths-leak]
```

### Rule — schema-self-contained

Include every changed request, response, parameter, error, and component shape
in the change
specification or an explicit same-change reference. Do not require reviewers
to infer a contract from
an internal ticket, repository path, or unstated existing schema.

### Rationale — schema-self-contained

A spec is a reviewable public contract, not an implementation breadcrumb trail.

### Applicable situations — schema-self-contained

Every API addition, migration, or schema change.

### Detection — schema-self-contained

Flag "reuse existing model" without an exact named component and compatibility
statement, or a link to
private implementation as the only schema definition.

### Severity — schema-self-contained

BLOCKER — reviewers cannot determine the client contract.

### Good example — schema-self-contained

_Synthetic SolidStats example:_ `ReplaySummary` is fully declared, while an
unchanged shared
`ErrorResponse` is named and its envelope contract is restated.

### Bad example — schema-self-contained

`Use the replay schema from the server.`

### Related rules — schema-self-contained

- [schema-ref-and-reuse](core-schema-design.md#coreschema-ref-and-reuse)
- [wording-no-internal-paths-leak](core-wording.md#corewording-no-internal-paths-leak)

## core/schema-nullability-30

```yaml
name: schema-nullability-30
title: OpenAPI 3.0 nullability uses nullable true
category: schema
kind: core
severity_when_violated: BLOCKER
applies_to: [nullable typed schemas]
related: [schema-openapi-303, request-optional-nullability]
```

### Rule — schema-nullability-30

In the pinned 3.0.3 toolchain, set `nullable: true` beside an explicit `type`
in the same Schema Object. Siblings of a Reference Object are ignored. A
wrapper does not make a non-null referenced schema nullable: define a typed
nullable component or inline typed schema and verify its generated client.
Do not model ordinary nullability
with `anyOf` plus
`type: null`; retain `anyOf` for real alternative shapes.

### Rationale — schema-nullability-30

`type: null` is not an OpenAPI 3.0.3 type and produces incompatible generator
output.

### Applicable situations — schema-nullability-30

Response fields and request fields whose server behavior accepts or emits null.

### Detection — schema-nullability-30

Flag `type: null`, a null-only `anyOf` branch, or nullable fields with no null
behavior.

### Severity — schema-nullability-30

BLOCKER — emitted OpenAPI is invalid for the pinned dialect.

### Good example — schema-nullability-30

_Synthetic SolidStats example:_ `nextCursor: { type: string, nullable: true,
maxLength: 512 }`.

### Bad example — schema-nullability-30

<!-- markdownlint-disable MD013 -->
```yaml
anyOf: [{ type: string }, { type: null }]
```
<!-- markdownlint-enable MD013 -->

### Related rules — schema-nullability-30

- [schema-openapi-303](core-schema-design.md#coreschema-openapi-303)
- [request-optional-nullability](core-request-contracts.md#corerequest-optional-nullability)

## core/schema-nullability-scope

```yaml
name: schema-nullability-scope
title: Nullable is used only for a real JSON null
category: schema
kind: core
severity_when_violated: HIGH
applies_to: [schemas with nullable]
related: [schema-nullability-30, request-optional-nullability]
```

### Rule — schema-nullability-scope

`nullable: true` says JSON null is valid; it does not mean optional. Keep it
off fields that are merely
omittable, and document clear/reset semantics when it appears in a request.

### Rationale — schema-nullability-scope

Generated TypeScript types distinguish `undefined` from `null`.

### Applicable situations — schema-nullability-scope

Optional properties and optional query parameters.

### Detection — schema-nullability-scope

Flag `nullable: true` on every non-required field or an update schema that
does not define null effect.

### Severity — schema-nullability-scope

HIGH — clients serialise the wrong state transition.

### Good example — schema-nullability-scope

_Synthetic SolidStats example:_ `avatarUrl` is nullable only because a player
without an avatar returns
`null`.

### Bad example — schema-nullability-scope

Every non-required property is marked nullable by convention.

### Related rules — schema-nullability-scope

- [schema-nullability-30](core-schema-design.md#coreschema-nullability-30)
- [request-optional-nullability](core-request-contracts.md#corerequest-optional-nullability)

## core/schema-ref-and-reuse

```yaml
name: schema-ref-and-reuse
title: Reusable API shapes have stable named components
category: schema
kind: core
severity_when_violated: MEDIUM
applies_to: [repeated schemas]
related: [schema-self-contained, schema-description-on-property]
```

### Rule — schema-ref-and-reuse

Extract a component when a schema is reused or is a meaningful public type.
Keep a local inline schema
when extraction would conceal a one-off shape. References must resolve within
the OpenAPI document and
their name must represent the client-visible model.

### Rationale — schema-ref-and-reuse

Components prevent drift and improve generated client types without imposing a
component for every
three-line object.

### Applicable situations — schema-ref-and-reuse

Shared resources, errors, pagination envelopes, and repeated inputs.

### Detection — schema-ref-and-reuse

Flag copied multi-property models with diverging fields, broken refs, or
components created only to
hide an unrelated one-off request.

### Severity — schema-ref-and-reuse

MEDIUM — documentation and generated types drift over time.

### Good example — schema-ref-and-reuse

_Synthetic SolidStats example:_ replay list and replay detail responses
reference the same
`PlayerIdentity` component.

### Bad example — schema-ref-and-reuse

Three routes each inline a different version of `{ steamId64, displayName }`.

### Related rules — schema-ref-and-reuse

- [schema-self-contained](core-schema-design.md#coreschema-self-contained)
- [schema-description-on-property](core-schema-design.md#coreschema-description-on-property)

## core/schema-allof-default

```yaml
name: schema-allof-default
title: Use composition deliberately for constraints and reference annotations
category: schema
kind: core
severity_when_violated: MEDIUM
applies_to: [schemas using allOf]
related: [request-enum-default, schema-polymorphism]
```

### Rule — schema-allof-default

Use `allOf` to compose compatible constraints or to annotate a referenced
schema with a local default or description. In OpenAPI 3.0.3 these annotations
are ignored as siblings of `$ref`, so a one-reference `allOf` wrapper is valid.
For a simple inline enum, place its default directly beside `type` and `enum`.
Do not add composition when there is no reference or constraint to compose.

### Rationale — schema-allof-default

Reference annotations need a Schema Object wrapper in this dialect; unnecessary
composition of inline primitives only obscures the contract.

### Applicable situations — schema-allof-default

Shared base schemas and defaulted fields.

### Detection — schema-allof-default

Flag ignored annotation siblings of `$ref`, incompatible composed constraints,
or needless wrapping of an inline primitive. Do not flag a reference annotation
wrapper solely because it has one member.

### Severity — schema-allof-default

MEDIUM — contract is harder to generate and review.

### Good example — schema-allof-default

_Synthetic SolidStats examples:_ a direct inline enum with `default: private`,
or a reused enum annotated locally:

```yaml
visibility:
  allOf:
    - $ref: '#/components/schemas/Visibility'
  default: private
```

### Bad example — schema-allof-default

A direct `$ref` with a sibling `default: private`: consumers can ignore the
default. See the [OpenAPI 3.0.3 Reference Object
rules](https://spec.openapis.org/oas/v3.0.3.html#reference-object).

### Related rules — schema-allof-default

- [request-enum-default](core-request-contracts.md#corerequest-enum-default)
- [schema-polymorphism](core-schema-design.md#coreschema-polymorphism)

## core/schema-polymorphism

```yaml
name: schema-polymorphism
title: anyOf and oneOf model real alternative payloads
category: schema
kind: core
severity_when_violated: HIGH
applies_to: [polymorphic response or input schemas]
related: [schema-nullability-30, schema-const-vs-enum]
```

### Rule — schema-polymorphism

Use `oneOf` when exactly one variant is valid and `anyOf` only when overlapping
alternatives are intended. For object `oneOf`, use named component references,
a common required string tag with distinct singleton enums in each branch,
and an explicit discriminator mapping. A discriminator alone does not make
overlapping branches exclusive. Follow the shared
[HTTP contract](../../../solidstats-shared-project-standards/references/http-api-contract.md).

Each branch owns its precise fields and requiredness; close DTOs against
mixed-variant fields. Error variants use `errorCode` and narrow `details`
together. For `oneOf`, validate a positive payload for each branch and negatives
for missing/unknown tags, mixed fields, wrong types and forbidden nulls.
Check that each valid payload matches exactly one branch. Primitive `oneOf`
alternatives need exclusivity evidence rather than a fabricated discriminator.

For `anyOf`, require positive coverage of every branch, an example of the
intended overlap, and a negative payload matching no branch. A valid sample
may cover several branches; never require it to match exactly one or add
distinct tags that remove the intended overlap. Review type/null/field edge
cases where applicable. Do not use unions for nullability or cosmetic
annotation, or weaken `oneOf` to `anyOf` to hide a failing case.

### Rationale — schema-polymorphism

Ambiguous polymorphism turns generated clients into unsafe unions.

### Applicable situations — schema-polymorphism

Event payloads and genuinely variant replay-source representations.

### Detection — schema-polymorphism

For `oneOf`, flag overlapping branches, optional/loose tags, missing mapping
or variant fields collapsed into independent optional properties. For `anyOf`,
flag missing overlap intent/evidence, not overlap itself. Flag missing branch
and negative payload coverage for either kind. Preserve exact unions in
generated TypeScript clients.

### Severity — schema-polymorphism

HIGH — a client cannot select or parse a variant deterministically.

### Good example — schema-polymorphism

_Synthetic SolidStats example:_ `oneOf` upload-complete and upload-failed
events have required literal
`kind` values represented as one-value enums.

### Bad example — schema-polymorphism

`anyOf` with `{ type: object }` and a more-specific object branch.

### Related rules — schema-polymorphism

- [schema-nullability-30](core-schema-design.md#coreschema-nullability-30)
- [schema-const-vs-enum](core-schema-design.md#coreschema-const-vs-enum)

## core/schema-const-vs-enum

```yaml
name: schema-const-vs-enum
title: OpenAPI 3.0.3 uses a one-value enum for a fixed value
category: schema
kind: core
severity_when_violated: BLOCKER
applies_to: [fixed-value schemas]
related: [schema-openapi-303, schema-polymorphism]
```

### Rule — schema-const-vs-enum

Use `enum: [value]` for a 3.0.3 fixed string or number. Do not use JSON Schema
`const`, which is not
part of the pinned OpenAPI 3.0.3 schema dialect.

### Rationale — schema-const-vs-enum

The portable representation preserves a useful discriminator value for clients.

### Applicable situations — schema-const-vs-enum

Discriminated variants and fixed protocol fields.

### Detection — schema-const-vs-enum

Flag `const` in a 3.0.3 document.

### Severity — schema-const-vs-enum

BLOCKER — tooling can reject or silently misinterpret the schema.

### Good example — schema-const-vs-enum

_Synthetic SolidStats example:_ `kind: { type: string, enum:
[upload_completed] }`.

### Bad example — schema-const-vs-enum

`kind: { const: upload_completed }`.

### Related rules — schema-const-vs-enum

- [schema-openapi-303](core-schema-design.md#coreschema-openapi-303)
- [schema-polymorphism](core-schema-design.md#coreschema-polymorphism)

## core/schema-validation-keywords

```yaml
name: schema-validation-keywords
title: Request schemas declare bounded validation keywords
category: schema
kind: core
severity_when_violated: BLOCKER
applies_to: [request parameters and bodies]
related: [schema-additional-properties, ids-string-uuid]
```

### Rule — schema-validation-keywords

Every request and response field has an exact type or resolvable schema;
arrays have typed items, finite states have closed enums, and absence is
distinct from null. Closed DTOs use `additionalProperties: false`; intentional
maps have a concrete value schema. Bare objects, untyped maps and casts that
hide generated-type drift are not precise contracts.

Declare applicable bounds and formats: string
`minLength`/`maxLength`/`pattern`, array `minItems`/
`maxItems`, numeric ranges, enums, and UUID/date-time formats. Set
`additionalProperties: false` on
request objects where the SolidStats zod/Fastify convention rejects unknown
keys; an intentionally
open map declares its value schema and limits. Bounds reflect server
enforcement; they are neither
arbitrary decoration nor omitted because validation exists in code.

### Rationale — schema-validation-keywords

Clients need the same input envelope that protects the service from oversized
or malformed requests.

### Applicable situations — schema-validation-keywords

Every externally supplied request field.

### Detection — schema-validation-keywords

Flag unbounded text, arrays, or pagination limits; formats without server
validation; a missing enum
where valid values are closed; or an implicitly open object that the server
schema treats as strict.

### Severity — schema-validation-keywords

BLOCKER — the published contract accepts input the server should reject.

### Good example — schema-validation-keywords

_Synthetic SolidStats example:_ `{ type: string, format: uuid, maxLength: 36
}` for a UUID id and
`{ type: integer, minimum: 1, maximum: 100 }` for `limit`.

### Bad example — schema-validation-keywords

`query: { type: string }` for an arbitrary full-text search with no maximum.

### Related rules — schema-validation-keywords

- [ids-string-uuid](core-naming-and-ids.md#coreids-string-uuid)

## core/schema-description-on-property

```yaml
name: schema-description-on-property
title: Properties document non-obvious client semantics
category: schema
kind: core
severity_when_violated: MEDIUM
applies_to: [public schemas]
related: [wording-laconic-style, schema-ref-and-reuse]
```

### Rule — schema-description-on-property

Add a short property description when name, type, format, or enum does not
fully convey behavior:
ownership, units, visibility, null/omission meaning, cursor opacity, or
lifecycle semantics. Do not
copy obvious field names into prose.

### Rationale — schema-description-on-property

Types describe shape; they rarely explain meaning.

### Applicable situations — schema-description-on-property

Public resource, request, and event fields.

### Detection — schema-description-on-property

Flag opaque values with no semantics or descriptions that merely repeat `type`
and `default`.

### Severity — schema-description-on-property

MEDIUM — callers guess semantics.

### Good example — schema-description-on-property

_Synthetic SolidStats example:_ `recordedAt` says it is the UTC time at which
the server recorded the
completed match, not the upload time.

### Bad example — schema-description-on-property

`recordedAt: Time when recorded.`

### Related rules — schema-description-on-property

- [wording-laconic-style](core-wording.md#corewording-laconic-style)
- [schema-ref-and-reuse](core-schema-design.md#coreschema-ref-and-reuse)

## core/schema-default-once

```yaml
name: schema-default-once
title: Defaults are encoded in schema, not duplicated in prose
category: schema
kind: core
severity_when_violated: LOW
applies_to: [defaulted properties]
related: [request-enum-default, wording-no-default-duplication]
```

### Rule — schema-default-once

Use `default` as the source of truth. Mention it in prose only to explain a
conditional or otherwise
non-obvious behavioral effect.

### Rationale — schema-default-once

Duplicated defaults drift after a contract update.

### Applicable situations — schema-default-once

Defaulted query and body properties.

### Detection — schema-default-once

Flag a description that repeats the schema default word-for-word.

### Severity — schema-default-once

LOW — drift risk is low but avoidable.

### Good example — schema-default-once

_Synthetic SolidStats example:_ `limit` has `default: 50`; its description
only explains page scope.

### Bad example — schema-default-once

`description: Defaults to 50.` plus `default: 50` without other context.

### Related rules — schema-default-once

- [request-enum-default](core-request-contracts.md#corerequest-enum-default)
- [wording-no-default-duplication](core-wording.md#corewording-no-default-duplication)

## core/schema-openapi-303

```yaml
name: schema-openapi-303
title: The generated specification remains OpenAPI 3.0.3
category: schema
kind: core
severity_when_violated: BLOCKER
applies_to: [every specification document]
related: [schema-nullability-30, schema-const-vs-enum]
```

### Rule — schema-openapi-303

Pin `openapi: 3.0.3` and choose constructs supported by that configured
generation and client
toolchain. A move to 3.1 is a separately verified toolchain migration, not a
per-file choice.

### Rationale — schema-openapi-303

3.0 and 3.1 have materially different JSON Schema support.

### Applicable situations — schema-openapi-303

Every new or modified emitted OpenAPI document.

### Detection — schema-openapi-303

Flag `3.1.x`, `type: null`, `const`, or 3.1-only JSON Schema forms in a target
3.0.3 file.

### Severity — schema-openapi-303

BLOCKER — generation or downstream code may fail.

### Good example — schema-openapi-303

_Synthetic SolidStats example:_ `openapi: 3.0.3` with `nullable: true` for a
nullable cursor.

### Bad example — schema-openapi-303

`openapi: 3.1.0` added only because a single schema used `const`.

### Related rules — schema-openapi-303

- [schema-nullability-30](core-schema-design.md#coreschema-nullability-30)
- [schema-const-vs-enum](core-schema-design.md#coreschema-const-vs-enum)

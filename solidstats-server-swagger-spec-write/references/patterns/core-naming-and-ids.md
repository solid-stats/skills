# Core patterns — naming and identifiers

## core/naming-preserve-contract-field-style

```yaml
name: naming-preserve-contract-field-style
title: Field names follow the established API contract style
category: naming
kind: core
severity_when_violated: HIGH
applies_to: [all public fields]
related: [naming-preserve-baseline-enums, ids-string-uuid]
```

### Rule — naming-preserve-contract-field-style

Follow the established route-family and generated-client field naming style.
Do not impose a foreign
camelCase or snake_case rule; a naming change is a versioned migration with
caller impact.

### Rationale — naming-preserve-contract-field-style

Names are serialized API surface, not internal implementation taste.

### Applicable situations — naming-preserve-contract-field-style

New properties, query parameters, and response envelopes.

### Detection — naming-preserve-contract-field-style

Flag mixed style in one contract or a proposed rename without compatibility
notes.

### Severity — naming-preserve-contract-field-style

HIGH — clients break at deserialisation boundaries.

### Good example — naming-preserve-contract-field-style

_Synthetic SolidStats example:_ a new `steamId64` field follows the verified
identity model convention.

### Bad example — naming-preserve-contract-field-style

Adding `steam_id_64` only because another platform used snake_case.

### Related rules — naming-preserve-contract-field-style

- [naming-preserve-baseline-enums](core-naming-and-ids.md#corenaming-preserve-baseline-enums)
- [ids-string-uuid](core-naming-and-ids.md#coreids-string-uuid)

## core/naming-preserve-baseline-enums

```yaml
name: naming-preserve-baseline-enums
title: Enum values preserve documented domain vocabulary
category: naming
kind: core
severity_when_violated: BLOCKER
applies_to: [enum extensions and replacements]
related: [naming-enum-value-style, schema-validation-keywords]
```

### Rule — naming-preserve-baseline-enums

Preserve existing enum spellings and meanings. New values use the actual
documented SolidStats domain
style; a rename or semantic split includes storage, API, client, and migration
impact.

### Rationale — naming-preserve-baseline-enums

Enums are serialized values often stored or cached outside the service.

### Applicable situations — naming-preserve-baseline-enums

Lifecycle, visibility, moderation, and game-mode values.

### Detection — naming-preserve-baseline-enums

Flag a casing-only rename, an unverified synonym, or a value whose semantics
overlap an existing one.

### Severity — naming-preserve-baseline-enums

BLOCKER — clients and persisted values can become incompatible.

### Good example — naming-preserve-baseline-enums

_Synthetic SolidStats example:_ add `upload_failed` only after defining its
distinct terminal lifecycle.

### Bad example — naming-preserve-baseline-enums

Replace `upload_failed` with `uploadFailed` without a versioned migration.

### Related rules — naming-preserve-baseline-enums

- [naming-enum-value-style](core-naming-and-ids.md#corenaming-enum-value-style)
- [schema-validation-keywords](core-schema-design.md#coreschema-validation-keywords)

## core/naming-enum-value-style

```yaml
name: naming-enum-value-style
title: Enum values are semantically named and internally consistent
category: naming
kind: core
severity_when_violated: MEDIUM
applies_to: [new enum definitions]
related: [naming-preserve-baseline-enums, wording-laconic-style]
```

### Rule — naming-enum-value-style

Use one verified vocabulary and casing convention within an enum family.
Values name stable domain
states, not UI labels, implementation branches, or temporary feature flags.

### Rationale — naming-enum-value-style

Stable semantic names survive translations and client UI changes.

### Applicable situations — naming-enum-value-style

Any closed string value set.

### Detection — naming-enum-value-style

Flag mixed casing, display text as values, or terms with no documented meaning.

### Severity — naming-enum-value-style

MEDIUM — inconsistency becomes a permanent public surface.

### Good example — naming-enum-value-style

_Synthetic SolidStats example:_ `private`, `unlisted`, and `public` are
visibility states, with labels
owned by clients.

### Bad example — naming-enum-value-style

`Public replay`, `private`, `UNLISTED`.

### Related rules — naming-enum-value-style

- [naming-preserve-baseline-enums](core-naming-and-ids.md#corenaming-preserve-baseline-enums)
- [wording-laconic-style](core-wording.md#corewording-laconic-style)

## core/ids-string-uuid

```yaml
name: ids-string-uuid
title: Entity IDs are UUID strings; Steam IDs remain external strings
category: naming
kind: core
severity_when_violated: BLOCKER
applies_to: [entity identifiers]
related: [schema-validation-keywords, errors-404-not-found]
```

### Rule — ids-string-uuid

Represent SolidStats entity IDs as `{ type: string, format: uuid, maxLength:
36 }`. Represent Steam
identity values as strings with the documented external identifier name and
applicable validation;
never convert them to JSON numbers.

### Rationale — ids-string-uuid

UUID and Steam identifiers exceed the semantic guarantees of JavaScript number
handling and are opaque
identifiers, not quantities.

### Applicable situations — ids-string-uuid

Path parameters, references, resource fields, and filters.

### Detection — ids-string-uuid

Flag integer entity IDs, numeric Steam IDs, or a plain string with no
identifier format where UUID is
the target contract.

### Severity — ids-string-uuid

BLOCKER — client precision and resource identity are at risk.

### Good example — ids-string-uuid

_Synthetic SolidStats example:_ `id: { type: string, format: uuid, maxLength:
36 }` and
`steamId64: { type: string, maxLength: 17 }`.

### Bad example — ids-string-uuid

`steamId64: { type: integer, format: int64 }`.

### Related rules — ids-string-uuid

- [schema-validation-keywords](core-schema-design.md#coreschema-validation-keywords)
- [errors-404-not-found](core-errors.md#coreerrors-404-not-found)

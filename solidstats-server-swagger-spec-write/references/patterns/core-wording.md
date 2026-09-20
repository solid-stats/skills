# Core patterns — wording

## core/wording-no-internal-paths-leak

```yaml
name: wording-no-internal-paths-leak
title: Public descriptions do not leak internal implementation paths
category: wording
kind: core
severity_when_violated: MEDIUM
applies_to: [all public descriptions]
related: [security-roles-in-context, schema-self-contained]
```

### Rule — wording-no-internal-paths-leak

Write in terms of resource behavior, caller obligations, and response
semantics. Do not expose source
paths, class names, tables, queue names, internal services, or unpublished
architecture.

### Rationale — wording-no-internal-paths-leak

Internal details add noise, become stale, and can disclose unnecessary
operational information.

### Applicable situations — wording-no-internal-paths-leak

Operation, parameter, property, response, and tag descriptions.

### Detection — wording-no-internal-paths-leak

Flag repository paths, guard names, SQL terms, or implementation sequencing in
public prose.

### Severity — wording-no-internal-paths-leak

MEDIUM — the contract becomes coupled to internals.

### Good example — wording-no-internal-paths-leak

_Synthetic SolidStats example:_ "Queues the replay for parsing after upload
validation succeeds."

### Bad example — wording-no-internal-paths-leak

`Calls ReplayUploadService and inserts into replay_uploads before publishing
RabbitMQ message X.`

### Related rules — wording-no-internal-paths-leak

- [security-roles-in-context](core-security-auth-access.md#coresecurity-roles-in-context)
- [schema-self-contained](core-schema-design.md#coreschema-self-contained)

## core/wording-place-semantics-at-smallest-scope

```yaml
name: wording-place-semantics-at-smallest-scope
title: Put semantics at the smallest relevant OpenAPI scope
category: wording
kind: core
severity_when_violated: MEDIUM
applies_to: [operations and schemas]
related: [schema-description-on-property, errors-describe-condition]
```

### Rule — wording-place-semantics-at-smallest-scope

Put endpoint behavior on the operation, input meaning on its parameter or
property, and error cause on
the response. Do not repeat a property rule in every method that returns it.

### Rationale — wording-place-semantics-at-smallest-scope

Scoped documentation remains correct when an endpoint or shared model evolves.

### Applicable situations — wording-place-semantics-at-smallest-scope

Any newly written description.

### Detection — wording-place-semantics-at-smallest-scope

Flag a method description that lists all model fields or a property
description hiding operation policy.

### Severity — wording-place-semantics-at-smallest-scope

MEDIUM — prose drifts and readers miss the applicable rule.

### Good example — wording-place-semantics-at-smallest-scope

_Synthetic SolidStats example:_ `nextCursor` explains opacity in its property
description; the GET
operation explains traversal order.

### Bad example — wording-place-semantics-at-smallest-scope

Each replay list operation repeats the full definition of
`ReplaySummary.recordedAt`.

### Related rules — wording-place-semantics-at-smallest-scope

- [schema-description-on-property](core-schema-design.md#coreschema-description-on-property)
- [errors-describe-condition](core-errors.md#coreerrors-describe-condition)

## core/wording-no-default-duplication

```yaml
name: wording-no-default-duplication
title: Prose does not duplicate machine-readable defaults
category: wording
kind: core
severity_when_violated: LOW
applies_to: [defaulted fields]
related: [schema-default-once, request-enum-default]
```

### Rule — wording-no-default-duplication

Treat the schema `default` as authoritative. Mention it in prose only when a
conditional interaction
needs explanation, and ensure the prose then describes that interaction rather
than restating a value.

### Rationale — wording-no-default-duplication

One source of truth prevents a code generator and a sentence from diverging.

### Applicable situations — wording-no-default-duplication

Defaulted parameters and properties.

### Detection — wording-no-default-duplication

Flag descriptions such as "Defaults to desc" beside `default: desc` with no
additional behavior.

### Severity — wording-no-default-duplication

LOW — it is avoidable maintenance duplication.

### Good example — wording-no-default-duplication

_Synthetic SolidStats example:_ `order` has `default: desc`; prose only notes
that `id` breaks ties.

### Bad example — wording-no-default-duplication

`description: Defaults to desc.` and `default: desc`.

### Related rules — wording-no-default-duplication

- [schema-default-once](core-schema-design.md#coreschema-default-once)
- [request-enum-default](core-request-contracts.md#corerequest-enum-default)

## core/wording-paragraph-spacing

```yaml
name: wording-paragraph-spacing
title: Multiline descriptions use blank lines only for paragraphs
category: wording
kind: core
severity_when_violated: LOW
applies_to: [multiline YAML descriptions]
related: [cosmetic-yaml-blank-lines, wording-laconic-style]
```

### Rule — wording-paragraph-spacing

In `description: |` text, use one empty line between distinct paragraphs. Keep
a single paragraph as
contiguous prose and avoid blank lines introduced only for visual alignment.

### Rationale — wording-paragraph-spacing

Swagger renderers preserve paragraph breaks, so whitespace changes reader
meaning.

### Applicable situations — wording-paragraph-spacing

Long operation and resource descriptions.

### Detection — wording-paragraph-spacing

Flag multiple blank lines, empty lines between fragments of one sentence, or
paragraphs used as lists
without list syntax.

### Severity — wording-paragraph-spacing

LOW — display quality suffers, but wire behavior does not change.

### Good example — wording-paragraph-spacing

_Synthetic SolidStats example:_ one paragraph explains replay visibility; a
second explains the
authenticated caller exception.

### Bad example — wording-paragraph-spacing

Every wrapped sentence in a block description is separated by an empty line.

### Related rules — wording-paragraph-spacing

- [cosmetic-yaml-blank-lines](core-cosmetic-yaml.md#corecosmetic-yaml-blank-lines)
- [wording-laconic-style](core-wording.md#corewording-laconic-style)

## core/wording-laconic-style

```yaml
name: wording-laconic-style
title: Contract prose is concise, specific, and user-facing
category: wording
kind: core
severity_when_violated: MEDIUM
applies_to: [all public descriptions]
related: [wording-no-internal-paths-leak,
wording-place-semantics-at-smallest-scope]
```

### Rule — wording-laconic-style

Use direct English sentences that state resource behavior, conditions, and
client-visible effects.
Avoid aspirational marketing, internal rationale, vague terms such as
"appropriate", and duplicated
schema facts.

### Rationale — wording-laconic-style

Generated docs must answer implementation questions quickly.

### Applicable situations — wording-laconic-style

Every summary and description.

### Detection — wording-laconic-style

Flag prose that cannot be turned into a testable behavior, has no
subject/action, or describes server
internals rather than client outcome.

### Severity — wording-laconic-style

MEDIUM — ambiguity spreads into clients and review.

### Good example — wording-laconic-style

_Synthetic SolidStats example:_ "Returns visible replays recorded after the
supplied UTC timestamp."

### Bad example — wording-laconic-style

`Gets replay data in a convenient and efficient way.`

### Related rules — wording-laconic-style

- [wording-no-internal-paths-leak](core-wording.md#corewording-no-internal-paths-leak)
- [wording-place-semantics-at-smallest-scope](core-wording.md#corewording-place-semantics-at-smallest-scope)

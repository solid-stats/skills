# Core patterns — request contracts

## Contents

- [core/request-cursor-pagination](#corerequest-cursor-pagination)
- [core/request-sort-and-order](#corerequest-sort-and-order)
- [core/request-enum-default](#corerequest-enum-default)
- [core/request-optional-list-default](#corerequest-optional-list-default)
- [core/request-optional-nullability](#corerequest-optional-nullability)
- [core/request-multipart-encoding](#corerequest-multipart-encoding)
- [core/request-search-and-filters](#corerequest-search-and-filters)

## core/request-cursor-pagination

```yaml
name: request-cursor-pagination
title: Cursor pagination declares its complete traversal contract
category: request
kind: core
severity_when_violated: BLOCKER
applies_to: [live collection operations]
related: [response-cursor-pagination-envelope, request-sort-and-order]
```

### Rule — request-cursor-pagination

For a live collection, accept bounded `limit` and an optional opaque `cursor`.
Specify a deterministic
default order, a unique tie-breaker, which filters and sort values the cursor
is bound to, and how
inserts, updates, and deletes may affect later pages. Use offset only when the
set is explicitly
small/bounded or stable enough that its drift is acceptable.

### Rationale — request-cursor-pagination

A cursor without its ordering and scope has no stable meaning. Clients can
otherwise skip or repeat
replay rows while new statistics arrive.

### Applicable situations — request-cursor-pagination

Any endpoint listing replays, matches, player statistics, moderation records,
or another changing set.

### Detection — request-cursor-pagination

Flag a collection that exposes only `offset`, an unbounded `limit`, a cursor
with no stated ordering,
or an order/filter change that leaves cursor compatibility unspecified.

### Severity — request-cursor-pagination

BLOCKER — traversal behavior is part of the public API.

### Good example — request-cursor-pagination

_Synthetic SolidStats example:_

<!-- markdownlint-disable MD013 -->
```yaml
parameters:
  - name: limit
    in: query
    schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
  - name: cursor
    in: query
    schema: { type: string, nullable: true, maxLength: 512 }
description: >
  Results are ordered by recordedAt descending, then id descending. The cursor is opaque and bound
  to the requested playerId filter and this order. New or changed records can appear on a later
  traversal; a record already passed is not repeated by the cursor predicate.
```
<!-- markdownlint-enable MD013 -->

### Bad example — request-cursor-pagination

<!-- markdownlint-disable MD013 -->
```yaml
parameters:
  - { name: offset, in: query, schema: { type: integer } }
  - { name: limit, in: query, schema: { type: integer } }
```
<!-- markdownlint-enable MD013 -->

The request has neither bounds nor a live-data traversal guarantee.

### Related rules — request-cursor-pagination

- [response-cursor-pagination-envelope](core-response-contracts.md#coreresponse-cursor-pagination-envelope)
- [request-sort-and-order](core-request-contracts.md#corerequest-sort-and-order)

## core/request-sort-and-order

```yaml
name: request-sort-and-order
title: Sorting preserves the route vocabulary and validates values
category: request
kind: core
severity_when_violated: HIGH
applies_to: [sortable collection operations]
related: [request-cursor-pagination, schema-validation-keywords]
```

### Rule — request-sort-and-order

Use the established `sort` and `order` parameters when a route family already
has them. Enumerate
supported sort fields and directions, state the default and append a unique
tie-breaker. A renamed
parameter or expanded sort set is an explicit compatibility and cursor
migration.

### Rationale — request-sort-and-order

Free-form SQL-like sort strings are both untyped and impossible to bind safely
into cursors.

### Applicable situations — request-sort-and-order

Collection endpoints where users may choose an order.

### Detection — request-sort-and-order

Flag raw strings, absent defaults, undocumented ties, or a proposed
`sortBy`/`sortDir` replacement
where callers still use `sort`/`order`.

### Severity — request-sort-and-order

HIGH — clients cannot reliably compose pagination or cache keys.

### Good example — request-sort-and-order

_Synthetic SolidStats example:_

<!-- markdownlint-disable MD013 -->
```yaml
- name: sort
  in: query
  schema: { type: string, enum: [recordedAt, durationSeconds], default: recordedAt }
- name: order
  in: query
  schema: { type: string, enum: [asc, desc], default: desc }
```
<!-- markdownlint-enable MD013 -->

The description states that `id` is the final tie-breaker.

### Bad example — request-sort-and-order

<!-- markdownlint-disable MD013 -->
```yaml
- name: sort
  in: query
  schema: { type: string, default: "recorded_at desc" }
```
<!-- markdownlint-enable MD013 -->

### Related rules — request-sort-and-order

- [request-cursor-pagination](core-request-contracts.md#corerequest-cursor-pagination)
- [schema-validation-keywords](core-schema-design.md#coreschema-validation-keywords)

## core/request-enum-default

```yaml
name: request-enum-default
title: Optional enum defaults are represented once
category: request
kind: core
severity_when_violated: MEDIUM
applies_to: [optional enum parameters and properties]
related: [schema-allof-default, wording-no-default-duplication]
```

### Rule — request-enum-default

Put an inline enum's `default` beside its `type` and `enum`. A reused enum
referenced through `$ref` may use an `allOf` wrapper for its local default;
direct `$ref` siblings are ignored in OpenAPI 3.0.3. Do not repeat the default
in prose unless behavior needs qualification.

### Rationale — request-enum-default

Generators understand the direct schema. Artificial composition obscures the
client type.

### Applicable situations — request-enum-default

Optional query, path-independent request-body, and filter enum values.

### Detection — request-enum-default

Flag `allOf` containing one inline enum solely for a default, ignored `$ref`
siblings, or conflicting text and schema defaults.

### Severity — request-enum-default

MEDIUM — generated clients may render needlessly complex types.

### Good example — request-enum-default

_Synthetic SolidStats example:_ `{ type: string, enum: [pending, accepted,
rejected], default: pending }`

### Bad example — request-enum-default

<!-- markdownlint-disable MD013 -->
```yaml
allOf:
  - { type: string, enum: [pending, accepted, rejected] }
default: pending
```
<!-- markdownlint-enable MD013 -->

### Related rules — request-enum-default

- [schema-allof-default](core-schema-design.md#coreschema-allof-default)
- [wording-no-default-duplication](core-wording.md#corewording-no-default-duplication)

## core/request-optional-list-default

```yaml
name: request-optional-list-default
title: Omitted lists have documented default semantics
category: request
kind: core
severity_when_violated: HIGH
applies_to: [optional array filters]
related: [request-optional-nullability, schema-validation-keywords]
```

### Rule — request-optional-list-default

State whether an omitted list means "all", an empty selection, or server
default behavior. Use an
array default only when the server really applies it; do not conflate omitted
with an explicit `[]`.

### Rationale — request-optional-list-default

The three states affect filtering and are commonly collapsed by generated
clients.

### Applicable situations — request-optional-list-default

Tag, game-mode, status, and player-ID filters.

### Detection — request-optional-list-default

Flag optional arrays with no omission semantics or descriptions claiming `[]`
means the same as absent
without server evidence.

### Severity — request-optional-list-default

HIGH — filters can silently return the wrong population.

### Good example — request-optional-list-default

_Synthetic SolidStats example:_ "When omitted, `statuses` includes every
visible status. `statuses=[]`
matches none."

### Bad example — request-optional-list-default

`statuses` is optional, with no behavior for an omitted or empty value.

### Related rules — request-optional-list-default

- [request-optional-nullability](core-request-contracts.md#corerequest-optional-nullability)
- [schema-validation-keywords](core-schema-design.md#coreschema-validation-keywords)

## core/request-optional-nullability

```yaml
name: request-optional-nullability
title: Optional and nullable request fields have distinct meanings
category: request
kind: core
severity_when_violated: BLOCKER
applies_to: [request bodies and query parameters]
related: [schema-nullability-30, request-optional-list-default]
```

### Rule — request-optional-nullability

Model omission and `null` separately. An optional field may be absent; use
`nullable: true` only if
the server accepts a JSON `null` and its effect is specified (for example,
clearing a value). Do not
use `null` as a substitute for an omitted filter.

### Rationale — request-optional-nullability

PATCH-like updates depend on the distinction between leave unchanged, clear,
and replace.

### Applicable situations — request-optional-nullability

Create/update bodies and optional non-list query filters.

### Detection — request-optional-nullability

Flag nullable optional fields without null behavior, or an update description
that treats absence and
null as equivalent.

### Severity — request-optional-nullability

BLOCKER — implementation and client serializers can mutate data differently.

### Good example — request-optional-nullability

_Synthetic SolidStats example:_ `nickname` is optional; `nickname: null`
clears it; omission leaves it
unchanged.

### Bad example — request-optional-nullability

<!-- markdownlint-disable MD013 -->
```yaml
nickname: { type: string, nullable: true }
```
<!-- markdownlint-enable MD013 -->

No clearing semantics are supplied.

### Related rules — request-optional-nullability

- [schema-nullability-30](core-schema-design.md#coreschema-nullability-30)
- [request-optional-list-default](core-request-contracts.md#corerequest-optional-list-default)

## core/request-multipart-encoding

```yaml
name: request-multipart-encoding
title: Multipart contracts match actual Fastify decoding capability
category: request
kind: core
severity_when_violated: BLOCKER
applies_to: [multipart/form-data request bodies]
related: [schema-validation-keywords, request-optional-nullability]
```

### Rule — request-multipart-encoding

Document multipart fields, file media types, repeatability, sizes, and
`encoding` according to the
actual Fastify multipart implementation. Nested JSON, arrays, and scalar
fields are allowed only
when the server's parser and schema handling support their declared wire
encoding; no blanket
scalar-only rule applies.

### Rationale — request-multipart-encoding

OpenAPI's schema alone does not say how a browser or generated client
serializes multipart values.

### Applicable situations — request-multipart-encoding

Replay uploads, avatar uploads, and import endpoints.

### Detection — request-multipart-encoding

Flag an unverified nested object/array, a file field without media type or
size, or a statement that
copies another framework's multipart restriction.

### Severity — request-multipart-encoding

BLOCKER — clients can send a body that Fastify cannot decode.

### Good example — request-multipart-encoding

_Synthetic SolidStats example:_

<!-- markdownlint-disable MD013 -->
```yaml
content:
  multipart/form-data:
    schema:
      type: object
      additionalProperties: false
      required: [replayFile]
      properties:
        replayFile: { type: string, format: binary }
        visibility: { type: string, enum: [private, unlisted] }
    encoding:
      replayFile: { contentType: application/octet-stream }
```
<!-- markdownlint-enable MD013 -->

### Bad example — request-multipart-encoding

`multipart/form-data` with a nested `metadata` object but no encoding or
parser evidence.

### Related rules — request-multipart-encoding

- [schema-validation-keywords](core-schema-design.md#coreschema-validation-keywords)
- [request-optional-nullability](core-request-contracts.md#corerequest-optional-nullability)

## core/request-search-and-filters

```yaml
name: request-search-and-filters
title: Search and structured filters describe different predicates
category: request
kind: core
severity_when_violated: HIGH
applies_to: [collection query parameters]
related: [request-sort-and-order, request-cursor-pagination]
```

### Rule — request-search-and-filters

Use a named text-search parameter for relevance or text matching and separate
typed filters for exact
domain constraints. State combination semantics and whether search changes the
default order.

### Rationale — request-search-and-filters

Clients need to know whether a query is an AND filter, a ranking request, or
both.

### Applicable situations — request-search-and-filters

Player, replay, and moderation collection search screens.

### Detection — request-search-and-filters

Flag a catch-all `q` parameter with undocumented fields, or a free-text field
used to pass structured
status and ID filters.

### Severity — request-search-and-filters

HIGH — pagination and user-visible counts become misleading.

### Good example — request-search-and-filters

_Synthetic SolidStats example:_ `search` matches player display names;
`gameMode` and `recordedAfter`
are exact filters; all supplied predicates are ANDed.

### Bad example — request-search-and-filters

`filter` is a free-form string whose permitted keys and matching behavior are
unspecified.

### Related rules — request-search-and-filters

- [request-cursor-pagination](core-request-contracts.md#corerequest-cursor-pagination)
- [request-sort-and-order](core-request-contracts.md#corerequest-sort-and-order)

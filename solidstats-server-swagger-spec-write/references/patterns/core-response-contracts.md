# Core patterns — response contracts

## core/response-cursor-pagination-envelope

```yaml
name: response-cursor-pagination-envelope
title: Cursor pages expose items, hasMore, and nextCursor
category: response
kind: core
severity_when_violated: BLOCKER
applies_to: [cursor-paginated collection responses]
related: [request-cursor-pagination, response-list-shape]
```

### Rule — response-cursor-pagination-envelope

Cursor-paginated responses contain `items`, `hasMore`, and nullable
`nextCursor`. `nextCursor` is
present and null when no next page exists; it is opaque. Do not substitute a
total count unless a
separate, correctly scoped count is part of the contract.

### Rationale — response-cursor-pagination-envelope

The envelope lets clients terminate without deriving control state from an
array length.

### Applicable situations — response-cursor-pagination-envelope

Live replay, player-statistic, and moderation collections.

### Detection — response-cursor-pagination-envelope

Flag a cursor request whose response lacks one of the three fields, an untyped
cursor, or a
`hasMore` value that can disagree with `nextCursor`.

### Severity — response-cursor-pagination-envelope

BLOCKER — clients cannot traverse the collection correctly.

### Good example — response-cursor-pagination-envelope

_Synthetic SolidStats example:_

<!-- markdownlint-disable MD013 -->
```yaml
type: object
required: [items, hasMore, nextCursor]
properties:
  items: { type: array, maxItems: 100, items: { $ref: '#/components/schemas/ReplaySummary' } }
  hasMore: { type: boolean }
  nextCursor: { type: string, nullable: true, maxLength: 512 }
```
<!-- markdownlint-enable MD013 -->

### Bad example — response-cursor-pagination-envelope

`{ items: [], next: "..." }` omits the terminal signal and makes the cursor
vocabulary route-specific.

### Related rules — response-cursor-pagination-envelope

- [request-cursor-pagination](core-request-contracts.md#corerequest-cursor-pagination)
- [response-list-shape](core-response-contracts.md#coreresponse-list-shape)

## core/response-list-shape

```yaml
name: response-list-shape
title: Collection results are named envelopes, not bare arrays
category: response
kind: core
severity_when_violated: HIGH
applies_to: [collection responses]
related: [response-cursor-pagination-envelope, schema-ref-and-reuse]
```

### Rule — response-list-shape

Return a named object with an `items` property for collections. Add metadata
only with clear schema
and semantics. A bounded static lookup may be a documented exception, but it
still needs a stable
route-family decision.

### Rationale — response-list-shape

An object leaves room for traversal metadata without a breaking
array-to-object migration.

### Applicable situations — response-list-shape

List and search endpoints.

### Detection — response-list-shape

Flag a bare array for a pageable or likely-growing collection, or a metadata
field with no schema.

### Severity — response-list-shape

HIGH — later pagination becomes a breaking response change.

### Good example — response-list-shape

_Synthetic SolidStats example:_ `{ items: [ReplaySummary], hasMore: false,
nextCursor: null }`.

### Bad example — response-list-shape

<!-- markdownlint-disable MD013 -->
```yaml
type: array
items: { $ref: '#/components/schemas/ReplaySummary' }
```
<!-- markdownlint-enable MD013 -->

### Related rules — response-list-shape

- [response-cursor-pagination-envelope](core-response-contracts.md#coreresponse-cursor-pagination-envelope)
- [schema-ref-and-reuse](core-schema-design.md#coreschema-ref-and-reuse)

## core/response-success-status

```yaml
name: response-success-status
title: Success status reflects the operation semantics
category: response
kind: core
severity_when_violated: HIGH
applies_to: [all successful operations]
related: [response-empty-204, errors-shared-shape]
```

### Rule — response-success-status

Use `201` for a successful creation that creates a resource, `200` for a
successful retrieval or
operation returning a representation, and another 2xx status only when its
standard semantics are
actually fulfilled. Document the response body for every non-empty success.

### Rationale — response-success-status

Status codes communicate lifecycle behavior to clients, queues, and monitoring.

### Applicable situations — response-success-status

POST, PUT, PATCH, action, and resource creation operations.

### Detection — response-success-status

Flag a creation that only advertises `200`, or a `201` response for an
operation that merely validates
or queues work without creating the represented resource.

### Severity — response-success-status

HIGH — client behavior and observability lose a useful semantic boundary.

### Good example — response-success-status

_Synthetic SolidStats example:_ `POST /replays` returns `201` with
`ReplayUpload` after accepting a
new upload record.

### Bad example — response-success-status

Every successful POST documents only `200` regardless of effect.

### Related rules — response-success-status

- [response-empty-204](core-response-contracts.md#coreresponse-empty-204)
- [errors-shared-shape](core-errors.md#coreerrors-shared-shape)

## core/response-empty-204

```yaml
name: response-empty-204
title: 204 responses are deliberately bodyless
category: response
kind: core
severity_when_violated: HIGH
applies_to: [delete and no-content operations]
related: [response-success-status]
```

### Rule — response-empty-204

Use `204` only when success has no response representation. Do not define JSON
content, an envelope,
or a success message under `204`; choose `200` when the client needs
confirmation data.

### Rationale — response-empty-204

HTTP clients and proxies may discard a 204 body.

### Applicable situations — response-empty-204

Successful deletion, unlinking, or idempotent clear operations.

### Detection — response-empty-204

Flag `content` under a `204`, or a delete response that promises a body while
sending no status-specific
schema.

### Severity — response-empty-204

HIGH — generated clients disagree about whether data exists.

### Good example — response-empty-204

_Synthetic SolidStats example:_ `DELETE /replays/{id}` returns `204` with
`description: Replay deleted`.

### Bad example — response-empty-204

<!-- markdownlint-disable MD013 -->
```yaml
'204':
  content:
    application/json: { schema: { $ref: '#/components/schemas/ReplaySummary' } }
```
<!-- markdownlint-enable MD013 -->

### Related rules — response-empty-204

- [response-success-status](core-response-contracts.md#coreresponse-success-status)

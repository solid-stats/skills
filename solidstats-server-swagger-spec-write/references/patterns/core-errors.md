# Core patterns — errors

## Contents

- [core/errors-shared-shape](#coreerrors-shared-shape)
- [core/errors-describe-condition](#coreerrors-describe-condition)
- [core/errors-401-vs-403](#coreerrors-401-vs-403)
- [core/errors-404-not-found](#coreerrors-404-not-found)
- [core/errors-409-conflict](#coreerrors-409-conflict)
- [core/errors-declared-statuses-only](#coreerrors-declared-statuses-only)

## core/errors-shared-shape

```yaml
name: errors-shared-shape
title: Declared errors use the shared envelope
category: error
kind: core
severity_when_violated: BLOCKER
applies_to: [JSON error responses]
related: [errors-declared-statuses-only, schema-ref-and-reuse]
```

### Rule — errors-shared-shape

Use concrete error components following the shared
[HTTP contract](../../../solidstats-shared-project-standards/references/http-api-contract.md).
Require `statusCode`, `error`, `errorCode`, and `message`; type `details`
precisely per code, with explicit requiredness. Fix the status and error code
to singleton enums. `error` is the HTTP label, not the domain code.
Close each concrete envelope with `additionalProperties: false`. A typed
dictionary inside `details` is allowed when intentional; arbitrary top-level
error fields are not.

Codes are stable snake_case and globally unambiguous by condition and details
contract. Identical conditions may reuse a code; different meanings may not.
Review the active API inventory, not only the changed module. Multiple errors
under one status use an exclusive `oneOf` tagged by `errorCode`; do not permit
arbitrary status/code/details cross-products. JSON 4xx/5xx errors follow this
envelope; redirects are not errors and keep their documented HTTP semantics.

The former broad ErrorResponse and module-only uniqueness policy are deprecated
at the public boundary. The backend maps internal errors to registered public
variants, and the web client branches on `errorCode`, never error/message text.

### Rationale — errors-shared-shape

One predictable decoder is safer than endpoint-specific error parsing.

### Applicable situations — errors-shared-shape

Every route that can reject an authenticated, validated, or domain request.

### Detection — errors-shared-shape

Flag missing/loose `errorCode`, incompatible reuse across modules, free-form
details, open top-level envelopes, broad generic error schemas, mismatched
status/code combinations, client branching on text, or unexplained migration
from legacy envelopes.

### Severity — errors-shared-shape

BLOCKER — the public error contract fragments.

### Good example — errors-shared-shape

_Synthetic SolidStats example:_

<!-- markdownlint-disable MD013 -->
```yaml
'404':
  description: The requested replay is not visible or does not exist.
  content:
    application/json:
      schema: { $ref: '#/components/schemas/ReplayNotFoundError' }
```
<!-- markdownlint-enable MD013 -->

`ReplayNotFoundError` fixes `errorCode: replay_not_found`, `statusCode: 404`
and `error: Not Found`, and declares the safe details shape. Reuse that
component only for the same public condition and details contract.

### Bad example — errors-shared-shape

`{ error: "not found" }` for one route and `{ message: "missing" }` for another.

### Related rules — errors-shared-shape

- [errors-declared-statuses-only](core-errors.md#coreerrors-declared-statuses-only)
- [schema-ref-and-reuse](core-schema-design.md#coreschema-ref-and-reuse)

## core/errors-describe-condition

```yaml
name: errors-describe-condition
title: Error descriptions name the client-visible condition
category: error
kind: core
severity_when_violated: MEDIUM
applies_to: [declared error responses]
related: [errors-401-vs-403, wording-laconic-style]
```

### Rule — errors-describe-condition

Describe why a status is returned, including meaningful edge cases, without
exposing internal paths,
queries, or implementation exceptions.

### Rationale — errors-describe-condition

The status alone cannot tell a client whether to reauthenticate, change input,
or treat a resource as
unavailable.

### Applicable situations — errors-describe-condition

All response descriptions for 4xx and documented 5xx results.

### Detection — errors-describe-condition

Flag `Bad Request`, `Error`, or copied framework wording where the route has a
distinct condition.

### Severity — errors-describe-condition

MEDIUM — clients cannot act confidently.

### Good example — errors-describe-condition

_Synthetic SolidStats example:_ `409: A replay with the same immutable content
hash already exists.`

### Bad example — errors-describe-condition

`400: Bad request.`

### Related rules — errors-describe-condition

- [errors-401-vs-403](core-errors.md#coreerrors-401-vs-403)
- [wording-laconic-style](core-wording.md#corewording-laconic-style)

## core/errors-401-vs-403

```yaml
name: errors-401-vs-403
title: 401 denotes missing or invalid session; 403 denotes denied access
category: error
kind: core
severity_when_violated: BLOCKER
applies_to: [authenticated operations]
related: [security-required-auth-declaration, errors-404-not-found]
```

### Rule — errors-401-vs-403

Use `401` when the Steam OpenID session cookie is absent, expired, or invalid.
Use `403` when a valid
principal is known but is not allowed to perform the operation. A visibility
policy may intentionally
use `404` to avoid disclosing a private resource; state that choice.

### Rationale — errors-401-vs-403

Clients use 401 to start authentication and 403 to present an authorization
outcome.

### Applicable situations — errors-401-vs-403

Every secured route and relation-dependent operation.

### Detection — errors-401-vs-403

Flag 403 as the only unauthenticated outcome, 401 for a known-but-denied user,
or privacy masking left
unstated.

### Severity — errors-401-vs-403

BLOCKER — authentication recovery and access disclosure are wrong.

### Good example — errors-401-vs-403

_Synthetic SolidStats example:_ a replay edit returns `401` with no session,
`403` for a signed-in
non-owner, and documents a `404` privacy mask for an invisible replay read if
the policy uses one.

### Bad example — errors-401-vs-403

Every access failure returns `403`.

### Related rules — errors-401-vs-403

- [security-required-auth-declaration](core-security-auth-access.md#coresecurity-required-auth-declaration)
- [errors-404-not-found](core-errors.md#coreerrors-404-not-found)

## core/errors-404-not-found

```yaml
name: errors-404-not-found
title: 404 describes resource absence or deliberate visibility masking
category: error
kind: core
severity_when_violated: HIGH
applies_to: [item operations]
related: [errors-401-vs-403, ids-string-uuid]
```

### Rule — errors-404-not-found

Declare `404` for an absent entity and describe whether an inaccessible
private entity is intentionally
indistinguishable. Do not call an invalid UUID syntax a not-found result when
request validation rejects
it first.

### Rationale — errors-404-not-found

The distinction governs privacy and client retry behavior.

### Applicable situations — errors-404-not-found

Routes with entity identifiers in path or body references.

### Detection — errors-404-not-found

Flag a generic 404 description that hides a deliberate privacy decision, or
missing path-ID validation.

### Severity — errors-404-not-found

HIGH — resource discovery policy is ambiguous.

### Good example — errors-404-not-found

_Synthetic SolidStats example:_ `404: No visible replay exists for id.`

### Bad example — errors-404-not-found

`404: Invalid id.` for an id that should fail UUID validation as `422`.

### Related rules — errors-404-not-found

- [errors-401-vs-403](core-errors.md#coreerrors-401-vs-403)
- [ids-string-uuid](core-naming-and-ids.md#coreids-string-uuid)

## core/errors-409-conflict

```yaml
name: errors-409-conflict
title: 409 represents a documented state or uniqueness conflict
category: error
kind: core
severity_when_violated: HIGH
applies_to: [create and state-changing operations]
related: [errors-shared-shape, response-success-status]
```

### Rule — errors-409-conflict

Use `409` when a valid request conflicts with current server state, such as
duplicate immutable replay
content or an invalid lifecycle transition. State the conflict predicate and
put safe identifiers in
`details` only when clients can act on them.

### Rationale — errors-409-conflict

Conflict is neither malformed input nor an authorization failure.

### Applicable situations — errors-409-conflict

Idempotency, uniqueness, and state-transition operations.

### Detection — errors-409-conflict

Flag a documented duplicate mapped to 400/422 without reason, or a vague `409:
Conflict` description.

### Severity — errors-409-conflict

HIGH — clients cannot select a correct recovery path.

### Good example — errors-409-conflict

_Synthetic SolidStats example:_ `409: A replay with this content hash is
already recorded.`

### Bad example — errors-409-conflict

`400: Duplicate.`

### Related rules — errors-409-conflict

- [errors-shared-shape](core-errors.md#coreerrors-shared-shape)
- [response-success-status](core-response-contracts.md#coreresponse-success-status)

## core/errors-declared-statuses-only

```yaml
name: errors-declared-statuses-only
title: Declare semantic error statuses; do not pad every operation
category: error
kind: core
severity_when_violated: MEDIUM
applies_to: [operation response maps]
related: [errors-describe-condition, errors-shared-shape]
```

### Rule — errors-declared-statuses-only

Document every meaningful, client-actionable error the operation can produce
and omit speculative
boilerplate statuses. A cross-cutting unexpected-error policy belongs in the
service documentation,
not copied unverified to each route.

### Rationale — errors-declared-statuses-only

Invented responses create a contract the server may not honor; absent known
cases leave clients blind.

### Applicable situations — errors-declared-statuses-only

All response maps.

### Detection — errors-declared-statuses-only

Flag cargo-cult `400/401/403/404/409/500` blocks on every operation or a known
route condition omitted
from its responses.

### Severity — errors-declared-statuses-only

MEDIUM — API documentation becomes noisy or incomplete.

### Good example — errors-declared-statuses-only

_Synthetic SolidStats example:_ a public replay listing declares validation
errors only if it has
validated filters, and does not pretend it requires a session.

### Bad example — errors-declared-statuses-only

Every GET advertises `401`, `403`, and `409` without an authenticated or
state-changing path.

### Related rules — errors-declared-statuses-only

- [errors-describe-condition](core-errors.md#coreerrors-describe-condition)
- [errors-shared-shape](core-errors.md#coreerrors-shared-shape)

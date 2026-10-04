# Public HTTP API contract

This is the shared wire contract for server-2 specifications, backend
implementation and generated web clients. Read it for any task that authors,
implements, consumes, reviews or tests that HTTP surface. The Swagger writer
and reviewer apply this profile through their detailed rule cards; backend and
web skills add implementation checks, not alternative contract definitions.

These rules describe the desired API. Existing routes are migration evidence,
not exemptions. Record the affected consumers, approved target revision and
rollout before implementing a change. Do not widen a new contract to preserve
accidental backend behavior, or pretend that publishing these skills migrates
an existing deployment.

## Names

<!-- markdownlint-disable MD013 -->

| Surface | Rule | Example |
| --- | --- | --- |
| Resource path segments | Lowercase kebab-case, plural nouns | `/replay-requests` |
| Item paths | Resource collection plus named identifier | `/replay-requests/{requestId}` |
| JSON properties | camelCase | `createdAt`, `errorCode`, `nextCursor` |
| Query and path parameters | camelCase | `requestId`, `sortBy` |
| Component schema names | PascalCase | `ReplayRequest`, `ReplayNotFoundError` |
| operationId | Globally unique camelCase verb + resource | `listReplayRequests` |
| Public error code values | Stable lowercase snake_case | `replay_not_found` |

<!-- markdownlint-enable MD013 -->

Avoid trailing slashes and CRUD verbs such as `/get-replays` or `/create` in
resource paths. Model domain commands as resource transitions or subresources;
document a justified action endpoint when the resource model does not fit.
Protocol endpoints, singleton resources and conventional prefixes are not
pluralized mechanically: document their semantics explicitly. A linter can
check casing; a reviewer judges resource naming and verb intent.

Fastify `:requestId` becomes OpenAPI `{requestId}`. Header/cookie names and
third-party protocol fields retain their protocol-defined spelling. Database
columns, parser artifacts and external dictionaries are outside this naming
rule; map them explicitly at the public API boundary. Enum values are closed,
documented sets whose casing is chosen consistently for the domain, not
inferred from property casing. Existing enum changes need migration evidence.

## Exact schemas and generated types

- Use OpenAPI 3.0.3. Every payload field has a concrete type or a resolvable
  schema reference. Arrays declare their item schema. Distinguish integers
  from numbers and strings from numeric-looking identifiers.
- Entity IDs are UUID strings; external IDs such as Steam IDs remain strings
  in their original domain. Declare formats and meaningful bounds. Do not
  guess business limits merely to satisfy a checker.
- Enumerate finite statuses, roles and kinds. Do not replace a known closed
  set with `string` or represent correlated alternatives as independent enums.
- `required` controls presence; `nullable: true` permits null on a typed schema.
  An optional property is not automatically nullable. Document absent, null,
  empty string, zero and empty array only where each is meaningful.
- Closed DTOs declare `additionalProperties: false`. An intentional dictionary
  declares a concrete value schema and relevant limits; it is not a generic
  escape hatch. Bare `object`, `{}`, `additionalProperties: true`, `any`, or
  `Record<string, unknown>` must not replace a known wire shape, including
  error details. Untrusted input may be `unknown` until decoded at a boundary.
- Keep request and response direction explicit. Do not accept server-owned
  fields in creation input or rely on a client type cast to hide a mismatch.
- Generate web contract types from the approved, implemented OpenAPI surface.
  Preserve literals, required fields, nullability and unions. A widened
  generated type is a toolchain/contract defect to resolve, not a reason to add
  handwritten duplicate DTOs or assertions. Implementation verification
  compares authored schemas, runtime behavior, export and client types.

## Exclusive variants

For mutually exclusive object payloads use `oneOf` with named component refs.
Each branch declares the same required string discriminator property, with a
distinct single-value `enum`. Declare the parent's discriminator and explicit
mapping. For errors the discriminator is `errorCode`; other payloads use their
domain tag, such as `kind` or `status`. Each branch owns its exact fields and
requiredness; reject impossible combinations rather than making every field
optional on one broad object.

```yaml
ReplayResult:
  oneOf:
    - $ref: '#/components/schemas/ReadyReplay'
    - $ref: '#/components/schemas/FailedReplay'
  discriminator:
    propertyName: status
    mapping:
      ready: '#/components/schemas/ReadyReplay'
      failed: '#/components/schemas/FailedReplay'
```

`ReadyReplay` requires `status` with `enum: [ready]` and its result fields;
`FailedReplay` requires `status` with `enum: [failed]` and its failure fields.
This is a synthetic naming example, not a product state-machine decision.

A discriminator is not a substitute for constraints on each branch. For every
`oneOf`, validate a representative payload for every branch and verify it
matches exactly one branch. Negative cases cover missing/unknown tags, mixed
variant fields, wrong primitive types and forbidden nulls. Primitive `oneOf`
alternatives need their own exclusivity evidence; do not add a fake object tag.

Use `anyOf` only when overlapping alternatives are intended, never to silence
a failing `oneOf`. Validate positive payloads covering every branch, including
the intended overlap, and a negative payload that matches no branch. A valid
payload may match several branches and count toward each one's coverage;
neither exclusive samples nor distinct tags are required for `anyOf`. Review
additional type/null/field edge cases where applicable. In 3.0.3, fixed literals
use single-value `enum`, not `const`.

## Public errors

The JSON error envelope is
`{ statusCode, error, errorCode, message, details? }`:

- `statusCode`: required integer constrained to the actual HTTP response status.
- `error`: required HTTP status label, such as `Not Found`; not a domain code.
- `errorCode`: required stable snake_case identifier of the public condition.
- `message`: required human-readable safe explanation, not a branching key.
- `details`: absent when unnecessary; otherwise a precisely typed, safe schema
  belonging to that error code. State whether it is required for that code.

Public `errorCode` values are globally unambiguous across the server API. One
code denotes one documented condition and one details contract. The same
condition may reuse its code and schema across operations; different meanings
must not collide merely because internal modules are separate. Do not mint a
fresh code per occurrence, or derive it from an exception message. A changed
meaning or incompatible details shape requires a new code or an explicitly
versioned migration. HTTP-status policy remains semantically documented.

Each concrete error component fixes `errorCode` and `statusCode` with singleton
enums and closes the top-level envelope with `additionalProperties: false`.
An intentional typed dictionary may live inside `details`; it does not open
the envelope to arbitrary extra fields. An operation lists only its possible
errors. Several errors with the same HTTP status use a `oneOf` discriminated
by `errorCode`, not independent
enums that allow mismatched code/details combinations. An unconstrained
generic error schema is insufficient as an operation's only declared shape.

Keep error definitions authoritative in OpenAPI components and derive any
review inventory from them. Review the effective active API, including related
approved slices, for collisions in meaning and details. State the exact files
and revisions checked. Historical superseded schemas are migration evidence,
not simultaneous definitions to merge into the current inventory. Mechanical
checks compare the supplied scope; they cannot prove global semantic uniqueness
without complete context.

Backend mapping, serializers and framework-generated validation errors must
produce this envelope, including `errorCode`. Map internal typed errors to
registered public variants at the HTTP boundary. Internal diagnostic details
are not automatically safe public details. Do not expose stack traces or raw
validation/exception objects. Unexpected failures use a stable documented
opaque public variant. Do not invent extra statuses for an operation.

Web code branches on `errorCode` for domain recovery and narrows `details` from
the same generated variant. HTTP status can guide transport/auth handling but
cannot distinguish two domain causes with the same status. Never branch on
`message` or `error`. Network failures, unknown codes, malformed payloads and
empty responses use a safe fallback without an assertion to a known variant.

The previous envelope without `errorCode`, overloaded `error` strings and
module-only uniqueness are deprecated for this public boundary. Adopt this
target in the approved slice and its client transition; do not silently claim
legacy routes are already conformant.

## Review and verification

The writer and reviewer run the bundled structural validator, strict profile
checks and payload cases. Review still establishes precise business types,
resource naming, complete error inventory and semantic code uniqueness. A
passing structural validator alone is not acceptance. During implementation,
exercise actual serialized success/error responses and regenerate/type-check
the client; type checks alone do not validate untrusted responses at runtime.

Live cursor pagination, UUID strings, semantic success statuses including
`201`, and explicit human approval between specification and implementation
phases continue to apply. This reference is stateless: it is read by owning
workflows and does not start a separate memory lifecycle.

## OpenAPI sources

The dialect and validation semantics are defined by the official
[Schema Object](https://spec.openapis.org/oas/v3.0.3.html#schema-object) and
[Discriminator Object](https://spec.openapis.org/oas/v3.0.3.html#discriminator-object).
Naming, error codes and the required review evidence above are SolidStats
policy, not requirements imposed by OpenAPI itself.

# Core conventions

These are the SolidStats server contract rules for OpenAPI change
specifications. They are
prescriptive for future server work; existing routes are a migration baseline,
not an exception.
Record every compatibility, migration, and client impact when a proposed
contract differs from
the current implementation.

## Contract target

- Write OpenAPI **3.0.3** YAML. Use `nullable: true` on typed nullable
  schemas; do not use `type: null` or `const`.
- Read the shared [HTTP contract](../../solidstats-shared-project-standards/references/http-api-contract.md)
  for public naming, exact schemas, exclusive variants and stable error codes.
  It is authoritative for both server and web consumers.
- The standard error envelope adds required `errorCode` to
  `{ statusCode, error, message, details? }`. `error` is the HTTP status label;
  `errorCode` identifies the condition. Each code has exact typed details.
  The former undecided `error` semantics are deprecated; differing current
  routes need explicit migration.
- Entity identifiers are UUID strings. Steam IDs remain string external
  identifiers. State format and ownership where they matter to a client.
- Creation returns `201` when it creates a resource. Other success statuses
  follow operation semantics, including `204` only for a deliberately empty
  response.
- Live collections default to cursor pagination: `items`, `hasMore`, and
  nullable `nextCursor`. Define deterministic order, a unique tie-breaker,
  cursor scope, and live-mutation consistency. Offset pagination is allowed
  only for a small, bounded, or explicitly stable set.
- Request schemas use explicit bounds and formats. Request objects use
  `additionalProperties: false` where the SolidStats validation convention
  requires strict input.
- Keep established `sort` / `order` vocabulary when a route already has it.
  A different vocabulary is a planned contract migration.

## Evidence hierarchy

Use the current server implementation, generated OpenAPI, route schemas, and
current client
callers as evidence. The target rules here decide new work, but evidence
decides what requires a
migration note. Never claim a current route already follows a target rule
until it is checked.

## Rule-card format

Each `core-*` file contains independently reviewable rule cards. The fenced YAML
metadata carries the
stable slug and review metadata. The card body states the rule, rationale,
applicable situations,
detection, severity, good and bad synthetic SolidStats examples, and related
rules. Examples
illustrate a proposed contract; they are not citations to an existing endpoint
or source file.

## Review severity

Use the shared review risk and severity semantics. These core cards use the
same labels: `BLOCKER`, `HIGH`, `MEDIUM`, and `LOW`.

## Scope boundaries

These rules do not import numeric-ID, offset-only, `200`-only, FastAPI
multipart, permission-endpoint, or role-policy restrictions from the source
library. Authentication models the actual Steam OpenID session cookie. Resolve
its exact cookie name from server configuration before writing a scheme; do not
invent a JWT, bearer token, or permission service.

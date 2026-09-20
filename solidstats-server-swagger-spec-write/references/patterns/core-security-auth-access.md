# Core patterns — security, authentication, and access

## Contents

- [core/security-required-auth-declaration](#coresecurity-required-auth-declaration)
- [core/security-optional-auth-declaration](#coresecurity-optional-auth-declaration)
- [core/security-explicit-role-policy](#coresecurity-explicit-role-policy)
- [core/security-roles-in-context](#coresecurity-roles-in-context)
- [core/security-ownership-access](#coresecurity-ownership-access)
- [core/security-public-read-private-write](#coresecurity-public-read-private-write)
- [core/security-relation-redaction](#coresecurity-relation-redaction)

## core/security-required-auth-declaration

```yaml
name: security-required-auth-declaration
title: Required session authentication is declared with the real cookie scheme
category: security
kind: core
severity_when_violated: BLOCKER
applies_to: [session-protected operations]
related: [security-optional-auth-declaration, errors-401-vs-403]
```

### Rule — security-required-auth-declaration

Declare required authentication with the actual Steam OpenID session cookie
security scheme. Resolve the
exact cookie name from current server configuration; do not invent a
bearer/JWT scheme or a cookie name.

### Rationale — security-required-auth-declaration

Security declarations drive Swagger UI and generated client authentication
behavior.

### Applicable situations — security-required-auth-declaration

Operations requiring a signed-in Steam identity.

### Detection — security-required-auth-declaration

Flag absent security, an imaginary JWT, or a scheme copied before the
configured cookie name was checked.

### Severity — security-required-auth-declaration

BLOCKER — clients implement the wrong authentication transport.

### Good example — security-required-auth-declaration

_Synthetic SolidStats example:_ the verified `components.securitySchemes`
cookie scheme is referenced as
`security: [{ steamSession: [] }]` on replay upload.

### Bad example — security-required-auth-declaration

`security: [{ bearerAuth: [] }]` when the server authenticates a browser
session cookie.

### Related rules — security-required-auth-declaration

- [security-optional-auth-declaration](core-security-auth-access.md#coresecurity-optional-auth-declaration)
- [errors-401-vs-403](core-errors.md#coreerrors-401-vs-403)

## core/security-optional-auth-declaration

```yaml
name: security-optional-auth-declaration
title: Optional authentication explicitly permits anonymous requests
category: security
kind: core
severity_when_violated: HIGH
applies_to: [optionally personalised operations]
related: [security-required-auth-declaration,
security-public-read-private-write]
```

### Rule — security-optional-auth-declaration

When a route may use a valid session but also serves anonymous callers,
declare both the actual scheme
and an empty security requirement: `security: [{ steamSession: [] }, {}]`. Use
`security: []` for a
wholly public operation.

### Rationale — security-optional-auth-declaration

OpenAPI's empty requirement is the portable way to describe optional
authentication.

### Applicable situations — security-optional-auth-declaration

Public reads with owner-specific fields or actions.

### Detection — security-optional-auth-declaration

Flag a protected-only declaration on an anonymous route or optional auth
described only in prose.

### Severity — security-optional-auth-declaration

HIGH — generated clients may unnecessarily require login.

### Good example — security-optional-auth-declaration

_Synthetic SolidStats example:_ public replay detail may personalise `canEdit`
for a valid session,
using `[{ steamSession: [] }, {}]`.

### Bad example — security-optional-auth-declaration

`security: [{ steamSession: [] }]` while the description says login is optional.

### Related rules — security-optional-auth-declaration

- [security-required-auth-declaration](core-security-auth-access.md#coresecurity-required-auth-declaration)
- [security-public-read-private-write](core-security-auth-access.md#coresecurity-public-read-private-write)

## core/security-explicit-role-policy

```yaml
name: security-explicit-role-policy
title: Role policy is explicit when it controls access
category: security
kind: core
severity_when_violated: HIGH
applies_to: [role-gated operations]
related: [security-roles-in-context, errors-401-vs-403]
```

### Rule — security-explicit-role-policy

State an actual role or moderation policy when it determines access. Do not
ban role policy from the
specification, but do not invent roles or a permission microservice absent
current server evidence.

### Rationale — security-explicit-role-policy

Role-gated access is a client-visible authorization condition.

### Applicable situations — security-explicit-role-policy

Moderation, administration, and restricted operational actions.

### Detection — security-explicit-role-policy

Flag a role-gated endpoint whose requirement is hidden in code, or a fictional
permission endpoint.

### Severity — security-explicit-role-policy

HIGH — authorized clients cannot discover a required capability.

### Good example — security-explicit-role-policy

_Synthetic SolidStats example:_ "Requires the verified moderator role; a
signed-in non-moderator receives
403."

### Bad example — security-explicit-role-policy

`Requires elevated access.`

### Related rules — security-explicit-role-policy

- [security-roles-in-context](core-security-auth-access.md#coresecurity-roles-in-context)
- [errors-401-vs-403](core-errors.md#coreerrors-401-vs-403)

## core/security-roles-in-context

```yaml
name: security-roles-in-context
title: Access policy describes capability, not implementation mechanics
category: security
kind: core
severity_when_violated: MEDIUM
applies_to: [role-gated operations]
related: [security-explicit-role-policy, wording-no-internal-paths-leak]
```

### Rule — security-roles-in-context

Describe who may perform an action and the observable outcome. Keep guard
names, database checks, and
authorization implementation out of the API method prose.

### Rationale — security-roles-in-context

Clients consume policy, while implementation can change without a contract
migration.

### Applicable situations — security-roles-in-context

Any operation with roles, ownership, or moderation rules.

### Detection — security-roles-in-context

Flag internal middleware names or tables in an operation description.

### Severity — security-roles-in-context

MEDIUM — internal details obscure the actionable policy.

### Good example — security-roles-in-context

_Synthetic SolidStats example:_ "Only a replay owner or a moderator may change
visibility."

### Bad example — security-roles-in-context

`Requires requireReplayPermission() after checking replay_members.`

### Related rules — security-roles-in-context

- [security-explicit-role-policy](core-security-auth-access.md#coresecurity-explicit-role-policy)
- [wording-no-internal-paths-leak](core-wording.md#corewording-no-internal-paths-leak)

## core/security-ownership-access

```yaml
name: security-ownership-access
title: Ownership rules identify the protected resource and outcome
category: security
kind: core
severity_when_violated: HIGH
applies_to: [owner-controlled operations]
related: [security-public-read-private-write, errors-401-vs-403]
```

### Rule — security-ownership-access

State which principal relation grants access and whether a moderator override
exists. State whether a
non-visible resource returns 403 or is masked as 404; validate this against
current server policy.

### Rationale — security-ownership-access

Ownership is a business rule clients need for disabled controls and recovery
flows.

### Applicable situations — security-ownership-access

Replay edits, deletion, visibility changes, and private profile data.

### Detection — security-ownership-access

Flag "authorized user" without relation, or an undocumented
resource-disclosure decision.

### Severity — security-ownership-access

HIGH — user-facing access behavior cannot be implemented correctly.

### Good example — security-ownership-access

_Synthetic SolidStats example:_ owner may delete their replay; moderators may
delete any replay;
non-owners receive the documented 403.

### Bad example — security-ownership-access

`Only authorized users can delete.`

### Related rules — security-ownership-access

- [security-public-read-private-write](core-security-auth-access.md#coresecurity-public-read-private-write)
- [errors-401-vs-403](core-errors.md#coreerrors-401-vs-403)

## core/security-public-read-private-write

```yaml
name: security-public-read-private-write
title: Public reads and protected writes are declared per operation
category: security
kind: core
severity_when_violated: HIGH
applies_to: [resource route families]
related: [security-required-auth-declaration,
security-optional-auth-declaration]
```

### Rule — security-public-read-private-write

Declare security on each operation. A public GET may use `security: []`;
create, update, and delete
operations independently declare the session or role policy they require.

### Rationale — security-public-read-private-write

Path-level assumptions frequently overprotect reads or underdocument writes.

### Applicable situations — security-public-read-private-write

Mixed-publicity resource routes.

### Detection — security-public-read-private-write

Flag a path-level security decision that conflicts with an operation, or
public/private behavior left
to a tag description.

### Severity — security-public-read-private-write

HIGH — generated clients and Swagger UI apply the wrong auth expectation.

### Good example — security-public-read-private-write

_Synthetic SolidStats example:_ public replay list declares `security: []`;
upload declares the verified
Steam session scheme.

### Bad example — security-public-read-private-write

Security appears once on `/replays` although GET and POST differ.

### Related rules — security-public-read-private-write

- [security-required-auth-declaration](core-security-auth-access.md#coresecurity-required-auth-declaration)
- [security-optional-auth-declaration](core-security-auth-access.md#coresecurity-optional-auth-declaration)

## core/security-relation-redaction

```yaml
name: security-relation-redaction
title: Relation-dependent redaction is part of the response contract
category: security
kind: core
severity_when_violated: BLOCKER
applies_to: [responses varying by caller relation]
related: [security-optional-auth-declaration, request-optional-nullability]
```

### Rule — security-relation-redaction

When fields vary by owner, moderator, or anonymous relation, specify which
fields are omitted, null,
or represented by a stable redacted value for each caller class. Model
optional authentication in
OpenAPI rather than presenting a universal response that the server never sends.

### Rationale — security-relation-redaction

Redaction changes response shape and privacy guarantees.

### Applicable situations — security-relation-redaction

Private replay metadata, moderation reasons, and owner controls.

### Detection — security-relation-redaction

Flag a response field marked universally required despite redaction, or a
description saying "may be
hidden" with no caller condition or wire representation.

### Severity — security-relation-redaction

BLOCKER — clients can leak or fail on relation-specific data.

### Good example — security-relation-redaction

_Synthetic SolidStats example:_ `moderationReason` is absent for
non-moderators and its property is not
required in the public response schema; the description names that relation.

### Bad example — security-relation-redaction

`moderationReason` is required but sometimes not sent.

### Related rules — security-relation-redaction

- [security-optional-auth-declaration](core-security-auth-access.md#coresecurity-optional-auth-declaration)
- [request-optional-nullability](core-request-contracts.md#corerequest-optional-nullability)

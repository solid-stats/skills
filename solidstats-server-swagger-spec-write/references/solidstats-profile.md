# SolidStats spec-authoring profile

This profile configures the writer and reviewer. It retains the Estesis
iteration procedure while replacing its product and framework assumptions.
Detailed rules live in the named pattern references, shared by both skills.

Read the shared [HTTP contract](../../solidstats-shared-project-standards/references/http-api-contract.md)
before designing paths, operations, schemas or errors. It is the common source
for server and web skills; the existing implementation does not override it.

## Output language and links

Repository artifacts, YAML descriptions, comments and formal review reports are
English. API identifiers remain exact. Conversational discussion may be Russian.
Use the product and repository names from `wording-registry.md`.

The GitHub repository is `solid-stats/server-2`. Artifact links use
`https://github.com/solid-stats/server-2/blob/<ref>/swagger/<path>` with the
actual branch or commit. Say when a local change is unpublished. For approval
evidence use a fixed commit or per-file digest; a moving branch is insufficient.
Supporting Markdown may use relative links. API descriptions must remain
understandable without workstation paths or access to planning files.

## Target contract and current baseline

The user-approved specification is the target behavior. The existing backend
may require refactoring, schema/data migration or client changes to implement
it. Record those consequences in the implementation handoff. Do not reject a
well-defined target solely because the current backend behaves differently.

Use `openapi/server-2.openapi.json` as current-contract evidence. Do not
hand-edit
it while authoring a future specification or present future operations as live.
Frozen history preserves evidence; it does not prohibit an explicitly agreed
contract evolution. Identify affected consumers and the transition before
implementation. Preserve unrelated surface by default.

## API defaults

- OpenAPI **3.0.3**, matching the current server-2 artifact and toolchain.
  A dialect upgrade is a separate explicit decision with toolchain verification.
- Entity IDs are string UUIDs. External identity values such as Steam IDs remain
  strings in their original identifier domain, not fabricated UUID conversions.
- Live collections use cursor pagination. The default envelope is
  `items`, `hasMore`, `nextCursor`; the last is nullable. Specify deterministic
  ordering, cursor scope and behavior under live mutations. Offset pagination
  requires a concrete bounded use case and explicit agreement.
- Use `201` for creation when appropriate, `200` for body-bearing successful
  reads/updates and `204` for completed operations without a body. Do not add
  statuses merely to fill a checklist; document actual outcomes.
- Preserve existing `sort`/`order` names when retaining their contract. A
  deliberate rename is part of the target change and consumer migration.
- Bounds and validation keywords belong in the schema where representable.
  Request constraints must come from requirements or a resolved design choice.
  Business rules requiring state remain explicit behavior, not imaginary schema
  guarantees. Read `core-schema-design.md` and `core-request-contracts.md`.

## Error contract

The prescribed envelope is `{statusCode, error, errorCode, message, details?}`.
`errorCode` is a stable snake_case public condition identifier, globally
unambiguous across the API. `error` is the HTTP status label. Neither `error`
nor `message` is a client branching key. `details` is exactly typed per code,
never an unrestricted object. For example (synthetic):

```yaml
type: object
additionalProperties: false
required: [statusCode, error, errorCode, message, details]
properties:
  statusCode:
    type: integer
    enum: [404]
  error:
    type: string
    enum: [Not Found]
  errorCode:
    type: string
    enum: [replay_not_found]
  message:
    type: string
  details:
    type: object
    additionalProperties: false
    required: [replayId]
    properties:
      replayId:
        type: string
        format: uuid
```

Use a concrete component per error condition. Multiple errors at one status
are a `oneOf` discriminated by required literal `errorCode`, with an explicit
mapping and positive/negative payload cases. Same-meaning reuse is allowed;
different conditions or incompatible details under one code are findings.
Inventory the active API and related approved slices for collisions, naming
the exact scope checked. Keep the definitions in OpenAPI rather than creating
a second manually maintained registry.

The former ban on introducing `errorCode` and unresolved meaning of `error`
are deprecated by the accepted shared profile. Backend conventions own typed
error-to-HTTP mapping; web conventions own generated decoding and recovery.
Validation errors use `422`; invalid business input/state may use `400`,
permission failures `403`, missing entities `404`, conflicts `409`, upstream
failures `502`, and unexpected failures `500`, according to actual semantics.

Current generated endpoints can expose narrower shapes. Treat such mismatches
as explicit implementation/migration work for the slice; do not silently
declare the old deployment conformant or force all old endpoints into scope.

## Authentication and authorization

Use server-2's actual Steam OpenID login and session transport as the starting
point. Steam identity does not imply a bearer JWT or OAuth2 security scheme.
Resolve the session cookie's exact public name and policy from current source
or an explicit target decision. Role and ownership requirements must be clear
per operation; do not import the Estesis permission-check service or its ban on
explicit role policies. Public stats, private requests and moderator/admin
operations can require different policies.

Do not copy the stale Discord claim from the shared boundary table into a spec;
`server-2/.planning/PROJECT.md` identifies the implemented Steam OpenID flow.
Any auth redesign requires an explicit product/contract decision.

## Folder and iteration workflow

Author in `server-2/swagger`:

```text
swagger/
  CATALOG.md
  changes/
    NNN_name/
      CONTEXT.md
      INDEX.md
      CHANGES.md
      XX_server_slug.yaml
  baselines/                 # only when a retained snapshot is useful
```

Retain the Estesis global three-digit historical numbering and explicit
dependency/supersede links. `CONTEXT.md` describes shared rules; `INDEX.md`
maps stages, source revisions, implementation gaps and the GSD phase pair;
`CHANGES.md` records decisions. Keep drafts editable through review and retain
approved history. Detailed lifecycle and approval identity live in
`patterns/profile-iteration-workflow.md` and `gsd-phase-workflow.md`.

## Phase and validation policy

Alternate specification and implementation phases. Both retain full GSD
discussion, research, planning, execution and review/verification. Approval of
the bounded specification is a human checkpoint before its implementation
phase, including autonomous runs. Follow `gsd-phase-workflow.md`.

Run the automatic validator in `validation.md`; it replaces the Estesis ban on
external validation. Review stays read-only unless fixes were requested. Git
and publication follow the consumer's instructions, including server-2's
protected `master`. No skill instruction bypasses those rules.

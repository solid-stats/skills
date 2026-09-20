# SolidStats domain patterns

Apply only patterns that match the agreed slice. Examples below are synthetic;
resolve actual entities, roles, states and API identifiers from target
decisions.

## profile/feature-api-boundaries

### Keep ownership explicit

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** HTTP contracts belong to server-2. Parsing belongs to
replay-parser-2; replay discovery and raw ingestion belong to replays-fetcher.
A spec describes the observable orchestration and result, not a new authority
for another service's business tables.

**Detection:** Check every write, external dependency and source of identity.
Identify the owning service and any adjacent contract change. A new HTTP
endpoint must not promise that the fetcher directly mutates canonical stats.

**Good example (synthetic):** A replay reprocess operation describes the
durable job accepted by server-2 and the observable progress/error states.

**Bad example (synthetic):** The contract says the frontend writes parser
results directly into PostgreSQL.

**Evidence to load:** Boundary decisions and adjacent source contracts;
solidstats-shared-project-standards §D.

## profile/feature-replay-job-lifecycle

### Describe durable asynchronous outcomes

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** For accepted background work, specify the returned job identity,
observable state transitions, retry and duplicate-request behavior, terminal
failures and how clients obtain progress. Resolve these choices per operation
rather than inventing one universal queue policy.

**Detection:** Can the client distinguish accepted work from completed work?
Can it recover after disconnecting or retrying? Map every meaningful state to
a response or polling/event field.

**Good example (synthetic):** An accepted reparse returns a UUID job reference
and names where the agreed status and terminal failure can be read.

**Bad example (synthetic):** A successful response says parsing is complete
while work has only entered a queue.

**Evidence to load:** The target phase's job semantics and acceptance criteria.

## profile/feature-live-pagination

### Specify consistency in live collections

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** A cursor is a continuation position, not automatically a snapshot.
Define ordering, a unique tie-breaker, query binding, insert/update/delete
visibility, invalid/stale cursor behavior and reconnect/refresh behavior
relevant to the feature.

**Detection:** Check mutable sort keys such as rank or score. Require an
explicit consistency strategy and honest guarantees about duplicates or
omissions. Distinguish page cursors from event-stream resume tokens.

**Good example (synthetic):** An append-only feed orders by creation time and
UUID; new entries before the cursor appear on refresh.

**Bad example (synthetic):** A changing leaderboard claims gap-free snapshot
traversal solely because it uses a cursor.

**Evidence to load:** The agreed live behavior; core request and response
pagination patterns.

## profile/feature-canonical-identity

### Separate identity domains and disclosure

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** Player identity, authenticated user identity, Steam identity and
display names serve different purposes. Use UUIDs for canonical entities and
strings for external identifiers. Define merge/link/history visibility and any
irreversible identity operation explicitly.

**Detection:** Check whether a field refers to a player or a user; inspect
profile linking and moderation privileges. Verify which public fields are
masked, omitted or exposed under the target policy.

**Good example (synthetic):** A request references a canonical player UUID;
public output uses an explicitly documented masked Steam identifier.

**Bad example (synthetic):** A display name is used as a stable entity key or
a full Steam identifier leaks into a public payload against the accepted
masking policy.

**Evidence to load:** server-2 product decisions and operation-specific
privacy requirements.

## profile/feature-moderation-and-audit

### Make privileged transitions implementable

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** Define allowed actors, ownership, source and destination states,
required reasons, duplicate decisions, concurrency conflicts, audit visibility
and downstream recalculation when applicable. Use the target state machine; do
not copy Estesis drafts or appeal-service semantics.

**Detection:** For each transition, test allowed and forbidden paths and
explain status/error outcomes. Read the actual proposed roles instead of
borrowing student/teacher permissions.

**Good example (synthetic):** An approved correction records an actor/reason
and explains when recalculated results become visible.

**Bad example (synthetic):** Any authenticated user can change a request
status, with no ownership or moderator condition.

**Evidence to load:** The target moderation workflow and acceptance criteria.

## profile/feature-attachments-and-storage

### Describe upload and object lifecycle

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** Document attachment authorization, supported media, size/count
limits, payload encoding, linkage to its owning request, deletion and failure
cleanup where observable. Resolve limits rather than guessing them. Storage
details must respect the backend boundary.

**Detection:** Check whether clients use an authorized upload flow and how
failures or orphaned uploads are handled. Verify the chosen multipart
representation against the real handler; there is no inherited FastAPI
scalar-only rule.

**Good example (synthetic):** A request owner uploads one permitted attachment
with an agreed size limit and receives its server-issued identifier.

**Bad example (synthetic):** The contract embeds an arbitrary S3 credential in
a response or allows any user to attach another user's object.

**Evidence to load:** Target upload decisions, current storage integration and
core multipart patterns.

## profile/feature-baseline-changes

### Turn target differences into implementation work

**Severity:** HIGH, calibrated by the actual consequence.

**Rule:** A proposed contract may deliberately improve the current backend.
Identify changed operations, stored-data consequences, consumers, rollout and
verification. Preserve the old baseline as evidence while recording what the
implementation phase must change.

**Detection:** Separate an intentional target change from an accidental
omission. Do not report missing current code as a contract blocker when
implementation is the next phase.

**Good example (synthetic):** INDEX records that a new structured error needs
a backend mapper change and a typed-client update.

**Bad example (synthetic):** The reviewer demands keeping a faulty current
response because it already exists, or the author hides a breaking change.

**Evidence to load:** The approved target and profile iteration/phase workflow.

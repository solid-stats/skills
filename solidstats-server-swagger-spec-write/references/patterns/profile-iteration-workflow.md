# Server-2 Specification Iteration Workflow

## Contents

- [profile/iteration-no-rewriting-approved-folders](#profileiteration-no-rewriting-approved-folders)
- [profile/iteration-draft-vs-approved-body](#profileiteration-draft-vs-approved-body)
- [profile/iteration-changes-md-required](#profileiteration-changes-md-required)
- [profile/iteration-changes-no-silent-revert](#profileiteration-changes-no-silent-revert)
- [profile/iteration-acceptance-coverage](#profileiteration-acceptance-coverage)
- [profile/iteration-source-and-adjacent-docs](#profileiteration-source-and-adjacent-docs)
- [profile/iteration-folder-naming](#profileiteration-folder-naming)
- [profile/iteration-stage-numbering](#profileiteration-stage-numbering)
- [profile/iteration-parallel-stages-independent](#profileiteration-parallel-stages-independent)
- [profile/iteration-index-md-content](#profileiteration-index-md-content)
- [profile/iteration-context-md-content](#profileiteration-context-md-content)
- [profile/iteration-changed-baselines](#profileiteration-changed-baselines)
- [profile/iteration-depends-on-explicit-not-numeric](#profileiteration-depends-on-explicit-not-numeric)
- [profile/iteration-baseline-snapshots](#profileiteration-baseline-snapshots)

This library defines the immutable iteration record for server-2 OpenAPI work.
It is shared by the writer and reviewer. A specification expresses the desired
product behaviour; existing code is evidence about the current state, not a veto
over the requested contract.

All examples in this file are synthetic. They illustrate structure only and do
not assert that the named files, operations, or revisions exist.

## profile/iteration-no-rewriting-approved-folders

### Approved iterations are immutable

**Rule.** Keep the approved body of every `swagger/changes/NNN_name/` iteration
immutable. A correction before approval updates the same editable draft. A
substantive correction after approval creates a new numbered iteration, links to
the prior one through `Depends On`, `Supersedes`, and `Changed Baselines`, and
requires a fresh approval. Never make a retrospective YAML edit look as though
it was part of an earlier approval.

**Detect and verify.** Compare changed files with `INDEX.md` status and the
approval evidence. A changed approved YAML, `CONTEXT.md`, or recorded decision
is a HIGH finding. Preserve the approved bytes, including cosmetic content;
put later corrections in the next iteration or an external erratum. Confirm that
a later iteration names the prior decision it replaces and that the old
iteration remains readable as approved.

**Why it matters.** Approved specifications are implementation inputs and review
evidence. Editing one in place destroys the explanation for code that was
already planned, reviewed, or shipped.

**Positive synthetic example.** `014_player-filter/INDEX.md` is approved. The
product now needs `teamId` filtering too. Create `015_player-team-filter/`,
declare `Depends On: 014_player-filter`, identify the changed query behaviour in
`Changed Baselines`, and preserve `014` unchanged.

**Negative synthetic example.** Editing
`014_player-filter/01_server_players.yaml` to add `teamId` after implementation
has begun, while leaving its approval reference intact, is a silent historical
rewrite.

**Sources.** `solidstats-shared-project-standards/SKILL.md#A-GSD-Workflow`;
`references/gsd-phase-workflow.md#Approval-boundary-and-phase-transition`.

## profile/iteration-draft-vs-approved-body

### Make editability and approval evidence explicit

**Rule.** `INDEX.md` identifies one of two states: `Draft` or `Approved`. A
draft is editable within its same iteration while decisions remain under
discussion. An approved iteration records the human approval reference, the
approved content revision, and a digest of the exact content approved. A review
report, automated validation result, or implementation completion never
substitutes for human approval.

Record file-level SHA-256 values for YAML, `CONTEXT.md`, and the approved
decision
record. Exclude `INDEX.md` approval metadata from this set so adding the
approval
does not invalidate its own hash. Append-only metadata links may record later
implementation verification without modifying the approved content.

**Detect and verify.** A reviewer checks that the status agrees with the
evidence recorded in `INDEX.md`. For an approved iteration, recompute the
recorded digest from the named immutable files and compare it with the recorded
value. Do not accept `main`, `latest`, or a moving branch name as proof of the
approved body.

**Why it matters.** A branch pointer can move after approval. The revision and
digest tie an approval to one unambiguous contract body.

**Positive synthetic example.**

```markdown
## Approval

- Status: Approved
- Human approval: product discussion 2026-09-21, message `spec-approval-014`
- Approved revision: `4fd7c8a`
- Approved content digest: `sha256:...`
```

**Negative synthetic example.** `Status: Approved — reviewed on main` has no
immutable object to compare with the body now visible on `main`.

**Sources.**
`references/gsd-phase-workflow.md#Approval-boundary-and-phase-transition`.

## profile/iteration-changes-md-required

### Record draft decisions and their replacement

**Rule.** Every agreed contract decision made while a draft is editable is
recorded in `CHANGES.md` before or alongside the affected YAML update. Each
entry has a date, concise decision, affected files and operations, rationale,
and either `Supersedes: none` or an explicit reference to the decision it
replaces. Mark a replaced decision as superseded; do not silently remove it.

**Detect and verify.** Compare the YAML diff with `CHANGES.md`. A semantic
alteration to paths, schemas, access, error semantics, compatibility,
validation, or stage order without a corresponding decision entry is HIGH.
Search active decisions for terms changed in YAML; a contradiction must have an
explicit supersession chain.

**Why it matters.** `CHANGES.md` is the anti-drift journal. `CONTEXT.md`
describes the current shared understanding, while `CHANGES.md` preserves how
that understanding changed.

**Positive synthetic example.**

```markdown
## 2026-09-21 — Make cursor mutually exclusive with page

- Applies to: `01_server_replays.yaml`, `GET /replays`
- Decision: reject requests that send both `cursor` and `page` with `400`.
- Reason: cursor ordering cannot preserve the offset paging guarantee.
- Supersedes: none
```

**Negative synthetic example.** “Updated pagination after discussion” cannot
tell a future planner which request combinations or error contract changed.

**Sources.** `solidstats-shared-planning-standards/SKILL.md#A-Source-anchors`;
`references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-changes-no-silent-revert

### Active decisions survive until explicitly superseded

**Rule.** Read `CHANGES.md` before editing a draft. Preserve every active
decision unless a new dated entry explicitly supersedes it. A later entry names
the earlier date/title or other stable decision identifier and states why the
old decision no longer applies.

**Detect and verify.** For each changed operation or schema, look for an active
decision covering it. A removed requirement, status, field, access rule, or
compatibility guarantee that conflicts with an active entry is HIGH unless the
new entry links to the old one. Merely writing a later sentence about the same
subject is insufficient.

**Why it matters.** A draft may pass several review cycles. Without a
replacement chain, a later author can accidentally restore a decision the team
already rejected.

**Positive synthetic example.** A later entry says it supersedes “2026-09-21 —
Make cursor mutually exclusive with page” and changes the rule to prioritise
`cursor`, with a stated compatibility reason.

**Negative synthetic example.** Removing the `400` response from the YAML
because “the client can ignore `page`” leaves the earlier active decision
falsely authoritative.

**Sources.** `references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-acceptance-coverage

### Cover every acceptance condition exactly once or deliberately

cross-reference it

**Rule.** `CONTEXT.md` maps each in-scope acceptance condition to the YAML
operation, schema, response, or explicit out-of-scope note that satisfies it.
The map belongs to the specification record, not a private brainstorm. A
condition may be implemented in more than one place, but the map states each
location.

**Detect and verify.** Compare the acceptance map with the requested outcome and
the stage YAML. Flag a missing condition, a condition represented only by vague
prose, or a YAML behaviour with no acceptance rationale. Verify that unchanged
surface is marked preserved where a changed operation could otherwise imply a
broader contract change.

**Why it matters.** A collection of valid-looking operations can still omit the
behaviour the user needs. The map gives reviewers a direct route from intent to
contract.

**Positive synthetic example.**

<!-- markdownlint-disable MD013 -->

| Acceptance condition | Contract coverage |
| --- | --- |
| A moderator can reject a replay with a reason | `02_server_moderation.yaml`, `POST /moderation/replays/{id}/reject`, `RejectReplayRequest.reason` |
| Existing replay reads are unchanged | `01_server_replays.yaml`, preservation note in `CONTEXT.md` |

<!-- markdownlint-enable MD013 -->

**Negative synthetic example.** A stage says “add moderation endpoints” but
never identifies the decision, error, or preserved read behaviour that proves
the acceptance condition.

**Sources.**
`solidstats-shared-planning-standards/SKILL.md#B-The-premises-ledger`;
`references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-source-and-adjacent-docs

### Anchor the current baseline without a service registry

**Rule.** Server-2 uses a single OpenAPI owner, so it does not need an
Estesis-style per-service registry. `INDEX.md` instead records the OpenAPI
baseline source URL or repository path, immutable revision, content digest, and
the relevant adjacent repository documents (for example web client
compatibility, parser input/output contract, or infrastructure interface). If an
input is unavailable, record it as an unresolved gate and ask for it in ordinary
chat before asserting compatibility.

**Detect and verify.** Check that every changed public surface has a baseline
reference that resolves to an immutable revision and digest. Verify that
cross-app consumers named by the change have an adjacent source or a stated
unresolved compatibility gate. Do not accept an unpinned Swagger UI URL, a local
checkout path, or a claim that a consumer is compatible without evidence.

**Why it matters.** The generated `openapi/server-2.openapi.json` is an
implementation snapshot. Its URL, revision, and digest make it usable as
evidence without confusing it with the desired future contract.

**Positive synthetic example.**

```markdown
## Baseline evidence

- Generated OpenAPI: `openapi/server-2.openapi.json` at `a9b2c1d`
- Digest: `sha256:...`
- Consumer context: `web/.planning/PROJECT.md#API-client-generation`
```

**Negative synthetic example.** “Baseline: local server docs” provides neither a
reproducible revision nor a way to tell whether generated output changed later.

**Sources.**
`solidstats-shared-project-standards/SKILL.md#D-Cross-App-Boundary-Map`;
`AGENTS.md#SolidStats-shared-agent-contract`.

## profile/iteration-folder-naming

### Name one historical iteration at a time

**Rule.** Place an iteration in `swagger/changes/NNN_name/`, where `NNN` is the
next three-digit historical index and `name` is a concise snake-case scope. The
number records historical creation order only. It is not a dependency order,
priority, or implementation order. Do not reserve numbers or renumber history to
make dependencies look tidy.

**Detect and verify.** Check `swagger/CATALOG.md` and sibling directories for
the next unused contiguous index. A gap, duplicate number, or a rename of an
existing approved folder is MEDIUM. Check dependencies from `INDEX.md`, not by
comparing numbers.

**Why it matters.** Stable names make review links and approval evidence
durable, while explicit dependency links explain the real implementation order.

**Positive synthetic example.** `012_replay-search` may depend on
`015_shared-pagination` if that is what the contract requires; the dependency is
stated in `INDEX.md`.

**Negative synthetic example.** Renaming `015_shared-pagination` to
`011_shared-pagination` merely to make it precede a dependent iteration breaks
historical references.

**Sources.** `references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-stage-numbering

### Stage files express one ordered contract sequence

**Rule.** Name stage YAML `XX_server_<slug>.yaml`; `XX` starts at `01` and
increments contiguously. Each later stage may assume earlier stages in the same
iteration have been implemented. Use the `server` scope for server-2-owned API
changes and choose a concise slug that states the contract slice.

**Detect and verify.** Cross-check `INDEX.md` Stage Map against the files on
disk. Flag missing mappings, duplicate sequential stage prefixes, gaps without a
documented supersession, or a stage whose stated dependency is later than
itself.

**Why it matters.** The stage map tells the implementation phase which pieces
become available when. It must not be inferred from filesystem order alone.

**Positive synthetic example.** `01_server_replay_filtering.yaml` establishes
search inputs; `02_server_saved_filters.yaml` refers only to behaviours
introduced in stage `01` or earlier baselines.

**Negative synthetic example.** `03_server_export.yaml` appears before
`01_server_export_schema.yaml`, with no explicit explanation of its dependency,
leaving implementation order ambiguous.

**Sources.** `references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-parallel-stages-independent

### Use `XX_YY` only for genuinely independent work

**Rule.** `XX_YY_server_<slug>.yaml` represents parallel sub-stages under the
same sequential stage. Every sibling with the same `XX` must be independently
implementable: it cannot require an operation, schema, migration decision, or
client compatibility decision introduced only by another sibling. If one must
precede another, use consecutive `XX` stages instead.

**Detect and verify.** Inspect all `$ref`, schema descriptions, acceptance
entries, and implementation prerequisites for every same-`XX` file. A
sibling-only dependency is MEDIUM. The Stage Map and `CONTEXT.md` must
explicitly state why the files are independent.

**Why it matters.** Parallel labels promise that implementation can proceed
without hidden ordering. Mislabelled work creates race conditions in contracts
and plans.

**Positive synthetic example.** `01_01_server_replay_tags.yaml` and
`01_02_server_moderation_labels.yaml` each introduce isolated operations and
schemas; both rely only on an existing user identity baseline.

**Negative synthetic example.** `01_02_server_replay_search.yaml` references
`SearchCursor` defined only in `01_01_server_pagination.yaml`; these are
sequential stages, not parallel sub-stages.

**Sources.** `references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-index-md-content

### `INDEX.md` is the compact navigation and evidence map

**Rule.** Every iteration `INDEX.md` contains: goal; status; milestone
identifier; specification phase identifier; implementation phase identifier (or
`pending`); review reference; touched boundaries; baseline evidence (source
URL/path, revision, digest); adjacent documents; `Depends On`; `Supersedes`;
Stage Map; Changed Baselines; validation evidence; and the approval record. A
draft may mark later lifecycle values as pending, but cannot omit their fields.

**Detect and verify.** Check that every listed YAML file exists and every YAML
file is represented in Stage Map. Verify all dependency and supersession targets
exist in `swagger/CATALOG.md`; validate revision/digest values against the named
content. An absent lifecycle link or an approval record that cannot identify
exact content is MEDIUM, HIGH when the iteration claims approval.

**Why it matters.** `INDEX.md` is the entry point that joins product intent,
OpenAPI artefacts, lifecycle status, and immutable evidence without duplicating
the YAML body.

**Positive synthetic example.** A draft `INDEX.md` has `Implementation phase:
pending`, then its approved revision fills the implementation phase id,
validation result, review reference, and human approval reference.

**Negative synthetic example.** A file list and a generic “approved after
review” sentence leave the milestone, baseline, review, and approval objects
untraceable.

**Sources.** `solidstats-shared-planning-standards/SKILL.md#A-Source-anchors`;
`references/gsd-phase-workflow.md#Lifecycle-recording`.

## profile/iteration-context-md-content

### `CONTEXT.md` owns shared behaviour, not duplicate endpoint prose

**Rule.** `CONTEXT.md` contains the iteration goal and scope, source documents,
roles and access model, shared business rules, shared schemas and their stage
use, acceptance coverage, explicit dependencies, expected implementation gaps,
database/data-migration implications, and client compatibility implications. Put
endpoint-specific request, response, and status semantics in YAML at the
narrowest relevant location.

**Detect and verify.** Check that a common rule used by multiple stages is
described once in `CONTEXT.md` and each use is traceable. Flag duplicated long
endpoint descriptions, or shared decisions that appear only in one YAML while
another stage relies on them. Confirm migration and compatibility implications
are explicit even when work is deferred to implementation planning.

**Why it matters.** Shared context prevents stages from diverging while keeping
OpenAPI documents readable and self-contained.

**Positive synthetic example.** `CONTEXT.md` defines the moderation state
transition rule used by two operations; each operation YAML specifies its own
request body and response statuses.

**Negative synthetic example.** Copying the full `POST /replays/{id}/reject`
request and every response into `CONTEXT.md` risks two competing definitions.

**Sources.**
`solidstats-shared-project-standards/SKILL.md#E-Cross-App-Compatibility-Protocol`;
`references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-changed-baselines

### Explain each change to an established contract

**Rule.** `Changed Baselines` lists each established operation, schema, error
semantics, data assumption, or consumer guarantee this iteration changes. State
the prior baseline reference, the new desired behaviour, and a preservation note
for adjacent unaffected behaviour. Write `none` explicitly only when the
iteration is truly isolated.

**Detect and verify.** Cross-check entries against `Depends On`, `Supersedes`,
`CHANGES.md`, and the YAML diff. A dependency whose exposed contract changes but
is absent from Changed Baselines is MEDIUM. A vague entry such as “updates
schemas” is insufficient.

**Why it matters.** A dependency says what this work uses; Changed Baselines
says what it alters. They answer different review questions.

**Positive synthetic example.** “`GET /replays` baseline at `a9b2c1d`: adds
optional `cursor`; existing `page` behaviour and response envelope remain
preserved until the client migration phase.”

**Negative synthetic example.** “Updates replay APIs” gives no reviewer a way to
locate the altered guarantee or the preserved surface.

**Sources.** `references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-depends-on-explicit-not-numeric

### Dependencies are links, never number inference

**Rule.** `Depends On` records direct contract dependencies by iteration
identifier and, where needed, the exact stage or decision. Do not infer a
dependency from a lower `NNN`, nor assume all lower-numbered work is required.
`Supersedes` records a replaced decision or iteration, not merely a
chronological predecessor.

**Detect and verify.** For every referenced baseline or schema, confirm the
direct iteration link is present. For every `Supersedes` entry, confirm that the
new contract actually replaces an active decision and does not just extend it. A
numbered but unlinked dependency is MEDIUM.

**Why it matters.** History is chronological while the contract graph is
semantic. Conflating them leads to incorrect implementation sequencing.

**Positive synthetic example.** `016_replay-search` directly depends on
`010_cursor-contract`, while `011_legacy-export` is lower numbered but
irrelevant.

**Negative synthetic example.** “Implement in numeric order” treats every older
folder as a prerequisite and hides the actual cursor dependency.

**Sources.** `references/gsd-phase-workflow.md#Specification-phase-record`.

## profile/iteration-baseline-snapshots

### Preserve optional generated OpenAPI snapshots as immutable evidence

**Rule.** An optional `swagger/baselines/` snapshot is an as-is immutable copy
of generated `openapi/server-2.openapi.json` at a stated revision and digest. It
is evidence for comparison, not the desired specification and not a source to
edit into conformance. Store only a snapshot whose source revision and digest
are recorded in the iteration `INDEX.md`.

**Detect and verify.** Check that the snapshot digest matches its metadata and
that the generated source revision is named. Flag a snapshot overwritten in
place, a snapshot lacking provenance, or a comparison that requires byte
equality between a whole generated artifact and a partial staged contract.

**Why it matters.** A generated file captures implementation reality at one
point. The proposed iteration captures desired behaviour; comparison must be
scoped to the changed operations and preserved constraints.

**Positive synthetic example.**
`swagger/baselines/server-2-a9b2c1d.openapi.json` is recorded with the exact
SHA-256 and used to inspect `GET /replays` before proposing stage `01`.

**Negative synthetic example.** Replacing `swagger/baselines/current.json` on
every run makes a previous approval impossible to audit.

**Sources.** `references/gsd-phase-workflow.md#Validation-and-review`.

---
name: solidstats-server-swagger-spec-review
description: >
  Pedantic, read-only review of SolidStats server-2 OpenAPI specification drafts and staged YAML
  contracts. Use proactively when asked to review, audit, validate, check, or re-review Swagger,
  OpenAPI, API-contract, or specification changes, even when the request only names a YAML file.
  Applies the same pattern library as solidstats-server-swagger-spec-write, runs the required
  validator, and keeps automated review separate from mandatory human specification approval.
  Triggers: "review OpenAPI spec", "audit Swagger", "validate API YAML", "check API contract",
  "re-review spec", "проверь OpenAPI", "ревью Swagger", "проверь YAML API",
  "проверь спецификацию API", "повторное ревью спецификации".
---

# Review SolidStats server-2 OpenAPI specifications

Use this skill after a specification draft exists. It is read-only unless the
user explicitly asks
to fix findings. It complements `solidstats-server-swagger-spec-write`: the
writer defines the
contract and its pattern library; this skill checks the same sources
independently.

An agent verdict is never human approval. `APPROVE` means the reviewed draft
has no blocker, high, medium, or failed mandatory gate at the stated revision;
optional low findings may remain under the shared verdict rule. The
specification phase still stops for the user's explicit approval.

## Read these sources before reviewing

Read the following files in full and list the files actually read in **Checked
context**:

1. `solidstats-shared-project-standards/SKILL.md`.
   Also read `solidstats-shared-project-standards/references/http-api-contract.md`.
2. `solidstats-shared-review-standards/SKILL.md`.
3. `solidstats-server-swagger-spec-write/SKILL.md`.
4. `solidstats-server-swagger-spec-write/references/core-conventions.md`.
5. `solidstats-server-swagger-spec-write/references/profile-loading.md`.
6. `solidstats-server-swagger-spec-write/references/solidstats-profile.md`.
7. `solidstats-server-swagger-spec-write/references/wording-registry.md`.
8. `solidstats-server-swagger-spec-write/references/workflow-write-spec.md`.
9. `solidstats-server-swagger-spec-write/references/pattern-index.md`.
10. `solidstats-server-swagger-spec-write/references/validation.md`.
11. `solidstats-server-swagger-spec-write/references/gsd-phase-workflow.md`.
12. Every relevant file from
    `solidstats-server-swagger-spec-write/references/patterns/`:
    `core-request-contracts.md`, `core-response-contracts.md`, `core-errors.md`,
    `core-schema-design.md`, `core-naming-and-ids.md`,
    `core-security-auth-access.md`,
    `core-wording.md`, `core-cosmetic-yaml.md`, `profile-domain-features.md`,
    `profile-iteration-workflow.md`, `profile-locale-wording.md`, and
    `profile-security-auth.md`.

`solidstats-shared-review-standards` owns severity, continuous numbering, report
shape, noise
filter, and verdict calculation. Do not copy or override that foundation. Apply
its rule that
only low findings may still yield `APPROVE`.

## Scope and sources of truth

The authoring root is `server-2/swagger/`:

```text
server-2/swagger/
├── CATALOG.md
└── changes/NNN_name/
    ├── CONTEXT.md
    ├── INDEX.md
    ├── CHANGES.md
    └── NN_topic.yaml
```

Start with the named YAML files. Then read their iteration's `CONTEXT.md`,
`INDEX.md`, and
`CHANGES.md`, `CATALOG.md`, linked related iterations, relevant product
requirements, and the
current backend only when it supplies as-is behavior or migration impact. Cite
exact `path:line`.

Treat a draft specification as the desired backend contract. Current
implementation and the
generated `openapi/server-2.openapi.json` are evidence of current behavior only;
they are not
author specification sources and do not invalidate a new contract merely because
code is absent
or differs. A refactor is acceptable. Deliberate breaking changes are acceptable
when their
impact, migration, and client transition are explicitly scoped. An
unacknowledged breaking change
is a finding.

Use GitHub blob URLs only when reporting authored artifacts, derived from the
actual repository
remote and revision. Do not claim an unpublished draft URL resolves.

If the target or scope is ambiguous, ask up to three ordinary-chat questions
before reviewing.
Do not invent roles, error statuses, business rules, schema fields, or migration
behavior.

## Required validation gate

Run the writer's validator over every reviewed stage YAML before delivering a
verdict:

<!-- markdownlint-disable MD013 -->

```text
<python> <writer>/scripts/validate_openapi.py --profile solidstats --cases <cases.json> <stage.yaml> [more-stage.yaml ...]
```

<!-- markdownlint-enable MD013 -->

`<writer>` is the installed `solidstats-server-swagger-spec-write` directory.
The command accepts one or more YAML paths, writes JSON to stdout for every
outcome, writes failure diagnostics to stderr, and exits nonzero on failure.
Record the exact command and outcome under
**Gates**. Validation is
required: a missing validator, unavailable prerequisite, nonzero result, or
unreviewed target YAML
is a **Validation Gap** and cannot produce `APPROVE`. Do not tell the user to
install a validator
without current project context; report the gap and its effect. Do not
substitute a manual parse
or a generated contract check for this gate.

Follow `validation.md` for payload cases and scope; `--cases` may be omitted
only when no union requires case coverage. Check positive payloads per branch
and negative payloads, not only the schema document. Structural-only success
does not satisfy this profile. Global semantic error-code uniqueness needs a
review of the active contract inventory beyond the supplied-file checks.

## Review workflow

1. **Collect and freeze context.** Record the reviewed revision, stage YAML
   paths, iteration
   documents, catalog entries, product requirements, baseline contracts,
   current-code evidence,
   and the applicable pattern slugs. Read the complete target files, not
   selected hunks.
2. **Check authoring structure.** Verify the `changes/NNN_name` name, required
   documents, stage
   ordering and dependencies, decision/supersede history, and links to related
   iterations. Do not
   rewrite an approved iteration to repair later work; require a new scoped
   iteration when the
   profile says so.
3. **Run independent passes.** Use the seven specialist prompts in
   `references/specialist-prompts.md` when a top-level reviewer can dispatch
   specialists. If the
   surface cannot dispatch them, run the same passes serially and state that
   coverage explicitly.
   Do not perform unauthorized nested fan-out.
4. **Apply contract rules.** Check only applicable patterns. In particular,
   enforce the shared naming profile, exact types and required/null semantics,
   discriminated exclusive object unions with case evidence, and stable
   globally unambiguous `errorCode` with exact per-code `details`. Check the
   active error inventory and generated-client narrowing; no text-based domain
   branching or unconstrained generic error schema is acceptable. Also
   check cursor-based live
   pagination by default; UUID identifiers as strings; OpenAPI 3.0.3; supported
   validation fields
   and `required` semantics; `201` where creation warrants it; and correct Steam
   OpenID,
   cookie-session, and role behavior. These are not universal boilerplate: the
   profile and the
   target contract decide applicability.
5. **Check intended change against as-is evidence.** Identify migration/client
   impact and
   backwards compatibility. Do not reject a desired contract because
   implementation differs.
6. **Aggregate.** Deduplicate by root cause, preserve each unique blocker/high
   finding, sort
   🔴 → 🟠 → 🟡 → 🔵, and number findings continuously across all buckets.
7. **Second-order pass.** Re-read interactions among stages, schemas,
   auth/session behavior,
   pagination, errors, and client transition before closing.

## Severity calibration

Map the pattern library's severity onto the shared buckets: BLOCKER → 🔴, HIGH →
🟠, MEDIUM → 🟡,
LOW/NIT → 🔵. Assess actual risk, not repair cost.

- **🔴 Blocker:** the draft cannot safely guide implementation: contradictory
  stage/supporting
  documents, missing decisive behavior or authorization, malformed/unvalidated
  YAML, an
  unscoped breaking change, or a contract that makes client/server interaction
  impossible.
- **🟠 High:** a local but likely incompatible
  contract/structure/security/migration problem,
  such as wrong request or response shape, an incorrectly scoped session rule,
  or a missing
  realistic error path.
- **🟡 Medium:** implementable but materially ambiguous or inconsistent:
  incomplete edge case,
  incomplete change record, weak cross-stage consistency, or a bounded
  naming/schema issue.
- **🔵 Low:** wording, readability, and YAML cosmetics with no contract impact.

Do not report preference, speculative risk, an extra status "just in case", or
an implementation
gap that the approved target deliberately changes. Never group 🔴/🟠 findings;
group only identical
🟡/🔵 issues with all relevant locations.

## Report

Use the exact shared report shape and its verdict rules. For spec review,
include:

```markdown
# Review — <iteration / YAML files>

**Scope:** <draft revision, files, services, contract surfaces>
**Gates:** <validator command and result; other checks>

## Blockers 🔴
1. `path:line` [contract] — problem — practical risk — concrete fix — [conv:
   `pattern-slug`]

## High 🟠
_none_

## Medium 🟡
_none_

## Low 🔵
_none_

## Checked context
- <files and evidence read; unavailable evidence and residual risk>

## Validation Gaps
- <only if present>

## Verdict
APPROVE / REQUEST CHANGES / BLOCK — <severity counts and gate state>
```

Add **Open Questions** only when an answer changes the contract. Add
**Non-Findings Checked** for
important adverse cases explicitly ruled out. There is no praise or "Good"
section. Each finding
uses `path:line`, a short topic, observed violation, concrete risk, concrete
fix, and the applicable
pattern slug (or `—`).

`APPROVE` is an agent review result, never permission to start implementation.
The user must explicitly approve the complete validated specification. Bind the
approval to an immutable digest set of the stage YAML and the contract scope and
acceptance content in `CONTEXT.md`; exclude self-referential approval metadata
in `INDEX.md`. Approved contract content is immutable: changing that YAML or
the scoped/accepted `CONTEXT.md` content invalidates the review and approval
and requires a new review/approval cycle. Updating `INDEX.md` approval metadata
does not require reopening the approved contract.

## GSD boundary and implementation verification

The specification phase and implementation phase each run their own discussion →
research → plan
→ execution → review/verification lifecycle. The specification phase stops after
review and waits
for explicit user approval. Implementation discussion, planning, and execution
must not cross that
gate. In the implementation phase, compare code and generated
`openapi/server-2.openapi.json`
against the approved specification revision, not an edited draft; report drift
as implementation
verification evidence.

## Re-review after fixes

Every fix starts a new review cycle. Preserve the earlier report and its
numbered findings. The new
report identifies the reviewed revision and tracks each prior finding by number
as `resolved`,
`still present`, `regressed`, or `accepted by the user` with evidence. Use an
independent fresh
pass over the whole affected scope, not a confirmation of only the changed
lines. Re-run the
validator and all relevant specialist passes; new findings receive a new
continuous sequence.

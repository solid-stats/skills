---
name: solidstats-server-swagger-spec-write
description: >
  Authors developer-ready OpenAPI contracts for the SolidStats server-2 backend,
  with explicit user approval before the separate GSD implementation phase.
  Use proactively when writing or changing a Swagger spec, endpoint contract,
  request/response schema, or a backend specification phase, even when the task
  does not name this skill. Triggers: "write spec", "create OpenAPI",
  "describe endpoint", "backend spec phase", "напиши спецификацию",
  "опиши API", "напиши постановку", "спека бэкенда", "фаза спецификации".
---

# Authoring SolidStats OpenAPI specifications

Turn an agreed feature into a complete, implementable contract under
`server-2/swagger`. The user-approved specification defines the desired backend.
Current code and generated OpenAPI describe the starting point and the work
needed to reach it; they do not veto a better contract. Refactoring the backend
to implement the approved specification is an expected implementation outcome.

This is a close adaptation of the Estesis authoring and review procedure. The
companion `solidstats-server-swagger-spec-review` audits the same rule library.
Do not keep a second set of authoring rules in the reviewer.

## Reference loading contract

Read this entry point first. Before authoring or materially editing a contract,
explicitly read:

- `../solidstats-shared-project-standards/SKILL.md`;
- `references/core-conventions.md`;
- `references/profile-loading.md`;
- `references/solidstats-profile.md`;
- `references/wording-registry.md`;
- `references/workflow-write-spec.md`;
- `references/gsd-phase-workflow.md`;
- `references/validation.md`;
- `references/pattern-index.md`;
- `templates/openapi-skeleton.yaml` when creating a new specification.

Load detailed patterns by the surface being changed:

<!-- markdownlint-disable MD013 -->

| Surface | Required reference |
| --- | --- |
| Query/body, live pagination, sorting, search, multipart | `references/patterns/core-request-contracts.md` |
| Success responses, list envelopes, status codes | `references/patterns/core-response-contracts.md` |
| Error payloads, status conditions, retry behavior | `references/patterns/core-errors.md` |
| Schemas, nullability, references, unions, validation | `references/patterns/core-schema-design.md` |
| Field names, enums, identifiers | `references/patterns/core-naming-and-ids.md` |
| Authentication, roles, ownership, public fields | `references/patterns/core-security-auth-access.md` and `references/patterns/profile-security-auth.md` |
| Descriptions, links, wording | `references/patterns/core-wording.md` and `references/patterns/profile-locale-wording.md` |
| YAML formatting | `references/patterns/core-cosmetic-yaml.md` |
| Replay, identity, moderation, job and live behavior | `references/patterns/profile-domain-features.md` |
| Iterations, baselines, stage ordering, supporting docs | `references/patterns/profile-iteration-workflow.md` |

<!-- markdownlint-enable MD013 -->

Before self-review, load the companion review entry point and
`../solidstats-shared-review-standards/SKILL.md`, then revisit every pattern
group
matching the changed surface. Spawned specialists must receive the exact paths
of every required skill and reference, not just a parent entry point. Require a
read-file list and distinguish checked context from missing evidence.

## Authoring flow

1. **Clarify.** Resolve contract-changing ambiguity in scope, roles, lifecycle,
   requests, responses, live behavior, compatibility and acceptance criteria.
   Ask in ordinary chat, at most three grouped questions per turn.
2. **Load evidence.** Read the active GSD phase and requirements, relevant
   `plans` briefs, current server-2 contract and source, approved earlier
   iterations, and affected adjacent consumer contracts.
3. **Locate.** Use `swagger/changes/NNN_name/` with the iteration documents and
   self-contained stage YAML. Record the specification/implementation phase
   pair.
   A scratch or output directory is a staging root: preserve this
   consumer-relative
   tree beneath it, including `swagger/CATALOG.md`; do not flatten the files.
4. **Design and write.** Apply the SolidStats profile and the detailed pattern
   library. Explain intended departures from the current backend and their
   migration or consumer impact; do not silently preserve accidental behavior.
5. **Record decisions.** Keep `CONTEXT.md`, `INDEX.md` and `CHANGES.md` coherent
   with the YAML, including dependencies, supersedes and implementation gaps.
6. **Validate.** Run the bundled YAML/reference/OpenAPI validator and fix
   errors.
   Save the result with exact reviewed content identity in the phase evidence.
7. **Review.** Self-review, then run the companion independent review. Address
   findings and revalidate/re-review changed content.
8. **Hand off.** Present the bounded specification and its review to the user.
   Wait for explicit approval of that revision before closing the specification
   phase or starting the implementation phase.
   Check that the actual delivered paths and links match the documented tree.

Detailed steps: `references/workflow-write-spec.md`. Phase ownership and
approval
evidence: `references/gsd-phase-workflow.md`.

## Hard rules

- Each specification phase and each implementation phase goes through
  **discussion → research → plan → execution → review/verification**. Alternate
  a small specification phase with its implementation phase; do not draft a
  milestone-sized contract for one human review.
- Agent `APPROVE`, green checks, silence and autonomous mode do not replace the
  user's approval. A changed contract needs a new review and approval.
- Use string UUID entity identifiers, cursor pagination for live collections,
  and semantic success statuses including `201` for creation where applicable.
- Author OpenAPI **3.0.3** for the current toolchain; use its schema dialect.
  Include deliberate validation constraints. Never copy Estesis's numeric-ID,
  offset-only, `200`-only, no-validation or framework-specific multipart bans.
- Human-readable repository artifacts are English; preserve exact identifiers.
  Clarification and conversational handoff follow the user's language.
- Do not invent business rules, auth schemes, roles, status transitions or
  field bounds. Resolve missing decisions before presenting a complete contract.
- Every stage YAML is self-contained. Its supporting docs provide provenance
  and planning context; they are not required to decode a payload or error.
- Keep authored specifications separate from generated
  `openapi/server-2.openapi.json`. Change generated output through the backend's
  schema/export process in the implementation phase.
- Existing implementation drift is an implementation requirement when deliberate
  and accounted for. Unacknowledged consumer breaks, contradictory requirements
  or impossible behavior remain specification findings.
- Follow the consuming repository's Git rules; this skill grants no exception
  to branch protection, publication or destructive-operation controls.

## Scope boundary

This skill owns HTTP contract authoring and its phase handoff. Backend code uses
`solidstats-server-ts-conventions`; review uses the companion spec reviewer.
Internal-only work without an HTTP contract does not need invented Swagger
endpoints. Record its requirements in the owning GSD artifacts instead.

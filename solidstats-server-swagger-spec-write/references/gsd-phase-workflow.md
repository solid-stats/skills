# GSD Phase Workflow for Server-2 API Specifications

This reference binds an OpenAPI iteration to the SolidStats GSD lifecycle. It
does not install hooks, change GSD configuration, or duplicate OpenAPI bodies
into `.planning/`. The writer and reviewer use these rules; a consumer
repository wires them through its normal GSD instructions and owner-native
documents.

## Operating model

Use a small, coherent specification phase followed by its implementation phase,
then start the next specification phase only when the next contract slice is
ready. Every phase receives the complete GSD cycle: discussion, research,
planning, execution, review, and verification. The milestone is intentionally a
short contour of common entities, boundaries, and dependencies, not a giant
full-milestone API specification.

The specification phase produces the desired OpenAPI contract in
`swagger/changes/NNN_name/`. The implementation phase makes code, migrations,
generated output, and clients conform to the approved contract. Planning
documents track work and decisions; they do not become a second copy of paths,
schemas, or response bodies.

## Specification phase record

The specification phase keeps contract material in `swagger/changes/NNN_name/`:

- `CONTEXT.md` — shared scope, roles, business rules, acceptance map,
  dependency,
  and migration/compatibility implications.
- `INDEX.md` — lifecycle/evidence map: milestone, spec phase, implementation
  phase,
  review reference, baseline source revision/digest, validation evidence, and
  human
  approval reference.
- `CHANGES.md` — dated draft decision history and explicit supersession chain.
- `XX_server_<slug>.yaml` — sequential OpenAPI contract stages; use `XX_YY` only
  for genuinely independent siblings.

The owning GSD artefacts record phase-native checkpoints and intent: the roadmap
identifies the phase and its relationship to the milestone, `CONTEXT.md`
captures phase discussion, `PLAN.md` captures executable implementation work and
verification, and `STATE.md` records active lifecycle state. Keep the two
CONTEXT documents distinct by path and purpose: `.planning` context supports a
phase; `swagger/changes/.../CONTEXT.md` supports the contract. Neither should
copy the other wholesale.

## Approval boundary and phase transition

Human approval is mandatory before closing a specification phase and before
beginning discussion, research, planning, or execution of its implementation
phase. An agent review verdict, YAML validation pass, generated API comparison,
`YOLO`, autonomous chaining, or a default checkpoint outcome never implies that
approval.

Present the exact reviewable contract body to the human and request an
ordinary-text approval. Record the response with a stable reference, the
immutable content revision, and an exact content digest in the iteration
`INDEX.md`. Do not use a moving `main` or `latest` pointer as evidence.

List each approved contract file and its SHA-256: stage YAML, `CONTEXT.md`, and
the decision record at approval. Keep the approval metadata in `INDEX.md`
outside that digest set to avoid a self-referential hash. Metadata may append
verification links without changing the approved contract or its approval.

Until approval, revise the existing draft and retain its decisions in
`CHANGES.md`. After approval, a substantive contract change is a new numbered
specification iteration and requires a new review and approval. If
implementation reveals an unresolvable contract conflict, stop the affected
implementation work, create the new specification revision, and return to its
human approval boundary; do not silently reshape the approved contract.

## Lifecycle recording

Use explicit relationships rather than prose inference:

<!-- markdownlint-disable MD013 -->

| Fact | Owner-native location |
| --- | --- |
| Milestone scope, common entities, and dependency contour | `ROADMAP.md` |
| Specification phase identity and outcome | roadmap entry and phase `CONTEXT.md` / `STATE.md` |
| Exact desired API operations and schemas | `swagger/changes/NNN_name/*.yaml` |
| Shared contract rules and acceptance coverage | `swagger/changes/NNN_name/CONTEXT.md` |
| Baseline source, digest, phase ids, review, validation, approval | `swagger/changes/NNN_name/INDEX.md` |
| Draft decision history | `swagger/changes/NNN_name/CHANGES.md` |
| Executable implementation tasks, dependencies, and verification | implementation `PLAN.md` |

<!-- markdownlint-enable MD013 -->

The `INDEX.md` lifecycle record includes `milestone_id`,
`specification_phase_id`, `implementation_phase_id`, `review_ref`, validation
content revision and digest, and `human_approved_ref`. Mark unavailable values
as `pending` during draft work rather than omitting the relationships.

## Required gates when source input is absent

Before a contract assertion that depends on missing source input, stop and ask
in ordinary text for the missing product decision, baseline, consumer contract,
or acceptance condition. Do not invent a user answer, use a question form, or
hide the issue in a private planning note. Record the resolved input in the
appropriate owner-native document with a source anchor.

This gate applies to material ambiguity in roles, access, payloads, responses,
error semantics, migration expectations, cross-app compatibility, ordering, and
naming. It does not forbid routine implementation choices that do not change the
contract.

## Contract and implementation relationship

The approved specification describes desired behaviour. Existing code, database
schema, and generated OpenAPI reveal the as-is state and can expose an
implementation gap, but they do not override the approved desired state. The
implementation phase explicitly plans and verifies:

- application and persistence changes needed for the desired behaviour;
- database and data migration effects, including rollback/compatibility
  implications
  where applicable;
- generated OpenAPI update from `openapi/server-2.openapi.json`;
- client and adjacent-service compatibility, especially the generated web API
  client;
- tests for changed operations and preservation of untouched surface.

Do not turn this specification skill into a standalone backend-refactor
programme. It identifies implementation gaps so implementation planning can own
them.

## Validation and review

Automatic validation of YAML, `$ref`, and OpenAPI structure is approved. The
shared validation reference and script verify authoring correctness. They are
necessary evidence, not approval evidence.

Review compares the generated API with the intended changed operations,
request/response schemas, error semantics, and preserved constraints. It must
also check that untouched public surface remains preserved. Do not require byte
equality between the complete generated server artifact and a partial stage
YAML: they represent different scopes. Compare only the relevant changed slices
and the constraints they intentionally preserve.

When a baseline snapshot is used, it is an optional immutable as-is copy under
`swagger/baselines/`, tied to the generated OpenAPI source revision and digest.
It is never edited to make the desired contract appear implemented.

## Anti-patterns

### Closing specification work from an agent verdict

An agent reports “no findings” and implementation planning starts automatically.
This is invalid because review quality does not replace the human product
decision. Keep the specification phase open until explicit approval of the
identified immutable body.

### Hiding API bodies in GSD planning files

Putting full OpenAPI paths and schemas in `PLAN.md` produces two authoritative
contracts. Keep contract bodies in `swagger/changes/`; let planning documents
link to their exact revision and describe work, dependencies, and verification.

### Mutating an approved YAML during implementation

Changing an approved field because migration work is inconvenient turns
implementation pressure into an unreviewed product change. Record the conflict,
create a new specification iteration, and obtain human approval before
implementation resumes on the revised contract.

### Treating the generated file as the desired contract

Copying `openapi/server-2.openapi.json` over a proposed stage merely documents
current implementation. Use it as baseline evidence; write the required desired
behaviour in the iteration YAML.

## Sources

- `solidstats-shared-project-standards/SKILL.md#A-GSD-Workflow`
- `solidstats-shared-project-standards/SKILL.md#D-Cross-App-Boundary-Map`
- `solidstats-shared-project-standards/SKILL.md#E-Cross-App-Compatibility-Protocol`
- `solidstats-shared-planning-standards/SKILL.md#A-Source-anchors`
- `solidstats-shared-planning-standards/SKILL.md#B-The-premises-ledger`

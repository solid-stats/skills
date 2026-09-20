# Workflow: write-spec

Follow the Estesis authoring sequence with the SolidStats profile. The current
GSD specification phase owns the work; its discussion, research and plan happen
before YAML authoring. See `gsd-phase-workflow.md` for the implementation gate.

## Step 0. Read the rules

Load the entry point's mandatory references and every pattern category matching
the target. Read the consumer instructions and current planning context. A
reference merely named by another file is not evidence that it was read.

## Step 1. Clarify before writing

Check goal, boundaries, actors, authorization, lifecycle, input/output,
empty/conflict/retry cases, live ordering, compatibility and acceptance. Ask
when two plausible answers produce different contracts. Use ordinary chat,
group related choices, at most three questions per turn. Do not turn silence
or an agent recommendation into an agreed business rule.

Keep the slice small enough for one useful human review. Establish the
milestone's common entities and dependencies in the owning GSD context without
expanding the current slice into a full milestone specification.

## Step 2. Load context and research

Read the active phase, requirements, relevant product briefs, approved prior
iterations, current generated OpenAPI and the relevant source/tests. Inspect
adjacent contracts when this change affects them. Resolve source checkouts
through task context, not a fabricated machine-local registry.

Research genuine protocol/toolchain uncertainty through current free primary
documentation. Record the evidence and limitations. Existing behavior is a
baseline; research may show why it needs to change. A supported target must
have a clear path to implementation, not necessarily an existing one.

## Step 3. Locate and plan the specification

Use `swagger/changes/NNN_name/` and the iteration rules. Map the specification
phase and dependent implementation phase in `INDEX.md` and the owning GSD plan.
The plan accounts for YAML, supporting documents, validation, independent
review and the human checkpoint. It does not implement product code.

## Step 4. Design the contract

Apply the profile, core rules and relevant domain patterns. Make each YAML
self-contained and describe every in-scope acceptance condition. Use local
references to avoid duplication inside the file. Model presence/nullability,
live cursor behavior, errors, roles and state transitions explicitly.

Record intended changes to existing behavior and their migration, persistence,
frontend/client or operational consequences. A deliberate difference is not a
defect merely because the current backend lacks it. An unacknowledged break,
unresolved conflict with an accepted standard or impossible guarantee is still
a blocker to resolve.

## Step 5. Write the prose

Put field rules on fields, parameter rules on parameters and failure conditions
on their response status. Use English prose, exact identifiers and real
paragraph breaks. Explain behavior not already expressed by the schema.
Keep domain semantics available to a developer reading only the YAML.

## Step 6. Record decisions

Synchronize `CONTEXT.md`, `INDEX.md`, `CHANGES.md` and the stage files. Mark
superseded decisions explicitly. Record current and target behavior separately,
including required implementation changes. Preserve approved historical bodies;
do not rewrite an old iteration to make it look compatible with a new one.

## Step 7. Validate and self-review

Run the bundled validator as described in `validation.md`. Fix structural
errors and rerun it on the final bytes. Read the companion reviewer and run its
applicable checks, including acceptance coverage and cross-stage dependencies.
Validation does not prove semantics or implementation conformance.

## Step 8. Independent review and human handoff

Run `solidstats-server-swagger-spec-review` on the exact proposed revision.
Address findings and re-review changed content, preserving finding identities.
Present a short summary of the target changes, checked evidence, unresolved
gaps and the artifact location. Use an actual GitHub revision link when
published, or a working local file link labeled unpublished.

Ask the user to approve the identified specification revision. Record approval
according to `gsd-phase-workflow.md`. A positive agent verdict is separate from
that decision. End the specification phase at the checkpoint until the user
answers; do not start implementation planning or code because the run is
autonomous. Hand the approved contract and implementation gaps to the next
phase's discussion, research and plan.

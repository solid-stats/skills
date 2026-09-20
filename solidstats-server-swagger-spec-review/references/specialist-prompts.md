# Specialist prompts

## Contents

- [Contract checker](#contract-checker)
- [Structure checker](#structure-checker)
- [Naming checker](#naming-checker)
- [Wording checker](#wording-checker)
- [Consistency checker](#consistency-checker)
- [Cosmetics checker](#cosmetics-checker)
- [Domain checker](#domain-checker)

The top-level reviewer substitutes the placeholders and may dispatch these seven
independent,
read-only passes. Every specialist returns the exact files it read, then either
`No findings.` or
one table:

<!-- markdownlint-disable MD013 -->

| Severity | Location | Problem | Risk | Fix | Pattern |
| --- | --- | --- | --- | --- | --- |

<!-- markdownlint-enable MD013 -->

Use 🔴/🟠/🟡/🔵. Do not number findings, write a final verdict, edit files,
invent behavior, or ask
the user questions. Cite real `path:line`. `Notes for main` may identify an
uncertainty without
turning it into a claim. The top-level reviewer aggregates and numbers results.

Resolve `<PROJECT_ROOT>`, `<YAML_FILES>`, `<ITERATION_DIR>`, `<WRITER>`,
`<REVIEWER>`, and `<SKILLS>` before dispatch. The last three are absolute paths
to the installed writer, reviewer, and sibling skill root. Pass every resolved
read path explicitly; never rely on a specialist following transitive links.
The four profile files are explicit requirements.

## Contract checker

```text
You review REQUEST / RESPONSE / ERROR / SECURITY contracts for
solidstats-server-swagger-spec-review.

Project: <PROJECT_ROOT>
YAML: <YAML_FILES>
Iteration: <ITERATION_DIR>
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/gsd-phase-workflow.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/validation.md;
<WRITER>/references/patterns/core-request-contracts.md;
<WRITER>/references/patterns/core-response-contracts.md;
<WRITER>/references/patterns/core-errors.md;
<WRITER>/references/patterns/core-security-auth-access.md;
<WRITER>/references/patterns/core-naming-and-ids.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-locale-wording.md;
<WRITER>/references/patterns/profile-security-auth.md;
plus CONTEXT.md, INDEX.md, and CHANGES.md when present.

Check cursor pagination, UUID strings, OpenAPI 3.0.3, supported validation
fields and required
semantics, appropriate 201 creation responses, errors, request/response shapes,
Steam OpenID,
cookie sessions, and roles only where applicable. Do not check schema design,
wording, or folder
workflow. Output read-files then the required findings table.
```

## Structure checker

```text
You review schema design, $ref, composition, required/optional meaning, reusable
components, and
description placement for solidstats-server-swagger-spec-review.

Project: <PROJECT_ROOT>;
YAML: <YAML_FILES>;
iteration: <ITERATION_DIR>.
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/gsd-phase-workflow.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/validation.md;
<WRITER>/references/patterns/core-schema-design.md;
<WRITER>/references/patterns/core-request-contracts.md;
<WRITER>/references/patterns/core-response-contracts.md;
<WRITER>/references/patterns/core-naming-and-ids.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-locale-wording.md;
<WRITER>/references/patterns/profile-security-auth.md;
and iteration CONTEXT.md, INDEX.md, CHANGES.md.
Do not judge wording, session/role policy, or authoring-folder workflow. Output
read-files then the
required findings table.
```

## Naming checker

```text
You review operation, path, schema, property, enum, and identifier naming for
solidstats-server-swagger-spec-review.

Project: <PROJECT_ROOT>;
YAML: <YAML_FILES>;
iteration: <ITERATION_DIR>.
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/gsd-phase-workflow.md;
<WRITER>/references/validation.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/patterns/core-naming-and-ids.md;
<WRITER>/references/patterns/core-schema-design.md;
<WRITER>/references/patterns/core-wording.md;
<WRITER>/references/patterns/profile-locale-wording.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-security-auth.md;
and iteration CONTEXT.md, INDEX.md, CHANGES.md.
Do not judge request/response semantics, security, or YAML cosmetics. Output
read-files then the
required findings table.
```

## Wording checker

```text
You review human-readable titles, summaries, descriptions, and change-document
wording for
solidstats-server-swagger-spec-review.

Project: <PROJECT_ROOT>;
YAML: <YAML_FILES>;
iteration: <ITERATION_DIR>.
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/gsd-phase-workflow.md;
<WRITER>/references/validation.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/patterns/core-wording.md;
<WRITER>/references/patterns/core-cosmetic-yaml.md;
<WRITER>/references/patterns/profile-locale-wording.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-security-auth.md;
and iteration CONTEXT.md, INDEX.md, CHANGES.md.
Do not judge contract shape, schema construction, or directory naming. Output
read-files then the
required findings table.
```

## Consistency checker

```text
You review consistency across CATALOG.md,
changes/NNN_name/{CONTEXT.md,INDEX.md,CHANGES.md},
related iterations, dependencies, supersedes, and declared migration/client
transitions.

Project: <PROJECT_ROOT>;
YAML: <YAML_FILES>;
iteration: <ITERATION_DIR>.
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/validation.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/gsd-phase-workflow.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-locale-wording.md;
<WRITER>/references/patterns/profile-security-auth.md;
CATALOG.md;
and the three iteration
documents.
Treat current implementation as as-is/migration evidence, never a reason to
reject an intended
new contract by itself. Do not judge YAML cosmetics. Output read-files then the
required table.
```

## Cosmetics checker

```text
You review YAML syntax-adjacent readability and low-impact formatting only for
solidstats-server-swagger-spec-review.

Project: <PROJECT_ROOT>;
YAML: <YAML_FILES>;
iteration: <ITERATION_DIR>.
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/gsd-phase-workflow.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/validation.md;
<WRITER>/references/patterns/core-cosmetic-yaml.md;
<WRITER>/references/patterns/core-wording.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-locale-wording.md;
<WRITER>/references/patterns/profile-security-auth.md;
and iteration CONTEXT.md, INDEX.md, CHANGES.md.
Do not duplicate validator failures, contract findings, or subjective style
preferences. Output
read-files then the required findings table.
```

## Domain checker

```text
You review SolidStats domain behavior and auth/migration implications for
solidstats-server-swagger-spec-review.

Project: <PROJECT_ROOT>;
YAML: <YAML_FILES>;
iteration: <ITERATION_DIR>.
Read in full and report these read files:
<REVIEWER>/SKILL.md;
<WRITER>/references/wording-registry.md;
<WRITER>/references/workflow-write-spec.md;
<WRITER>/references/validation.md;
<SKILLS>/solidstats-shared-project-standards/SKILL.md;
<SKILLS>/solidstats-shared-review-standards/SKILL.md;
<WRITER>/SKILL.md;
<WRITER>/references/core-conventions.md;
<WRITER>/references/profile-loading.md;
<WRITER>/references/solidstats-profile.md;
<WRITER>/references/pattern-index.md;
<WRITER>/references/gsd-phase-workflow.md;
<WRITER>/references/patterns/core-security-auth-access.md;
<WRITER>/references/patterns/core-request-contracts.md;
<WRITER>/references/patterns/core-response-contracts.md;
<WRITER>/references/patterns/profile-domain-features.md;
<WRITER>/references/patterns/profile-security-auth.md;
<WRITER>/references/patterns/profile-iteration-workflow.md;
<WRITER>/references/patterns/profile-locale-wording.md;
and CATALOG.md plus iteration
CONTEXT.md, INDEX.md, CHANGES.md.
Check only behavior grounded in those documents, product requirements, or
current-code evidence:
Steam OpenID, cookie sessions, roles, client transition, and breaking-change
acknowledgement.
Do not reject a target contract merely because current code differs. Output
read-files then the
required findings table.
```

## Aggregation contract

The top-level reviewer deduplicates root causes, preserves every distinct 🔴/🟠
finding, performs
the independent second-order pass, runs validation itself, and writes the shared
continuous-number
report. It records specialist coverage, all read files, validator output,
unavailable evidence,
and residual risk. For a re-review it also maps earlier finding numbers to their
disposition.

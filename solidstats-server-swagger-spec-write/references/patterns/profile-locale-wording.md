# SolidStats locale and artifact wording

Keep the Estesis editorial checks while using the SolidStats documentation
language and repository locations. Examples are synthetic.

## profile/wording-english-artifacts

### Write technical artifacts in English

**Severity:** LOW, calibrated by the actual consequence.

**Rule:** YAML summaries/descriptions, supporting Markdown and formal review
reports are English. Keep RU+EN trigger phrases only in skill metadata.
User-facing discussion may remain Russian.

**Detection:** Inspect prose as well as headings, comments and examples; do
not translate identifiers or values just to match prose.

**Good example (synthetic):** An English description explains a snake_case
error code without renaming it.

**Bad example (synthetic):** A copied Estesis pattern requires Russian prose
or translates an API enum for presentation.

**Evidence to load:** SolidStats managed documentation-language rule and
shared review standard.

## profile/wording-product-and-service-names

### Use the actual SolidStats vocabulary

**Severity:** LOW, calibrated by the actual consequence.

**Rule:** Use wording-registry.md for product and service names. Keep players,
users, replays and parse jobs distinct. Avoid borrowed calendar/resource/shop
terminology without a real feature decision.

**Detection:** Check whether an example sounds like a current product claim.
Mark invented teaching examples explicitly and remove false repository
citations.

**Good example (synthetic):** A synthetic parse-job example says it is
illustrative and cites the normative rule.

**Bad example (synthetic):** A nonexistent historical iteration is listed as
evidence for a SolidStats rule.

**Evidence to load:** The wording registry and verified source artifacts.

## profile/wording-spec-file-links-github

### Use accurate artifact links and immutable approval identity

**Severity:** MEDIUM, calibrated by the actual consequence.

**Rule:** Public artifact links use the actual server-2 GitHub ref and swagger
path. Working-tree links are labeled unpublished. Supporting Markdown may use
relative links; an API remains self-contained without those files.

**Detection:** Verify repository, branch/commit and path. Approval evidence
must identify the reviewed bytes, not only a moving branch URL.

**Good example (synthetic):** The handoff links the committed stage and
records its digest in the phase evidence.

**Bad example (synthetic):** The handoff claims an unpublished master URL
already contains the new spec or reuses a GitLab URL.

**Evidence to load:** The SolidStats profile, current Git state and GSD phase
workflow.

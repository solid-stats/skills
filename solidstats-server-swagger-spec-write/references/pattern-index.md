# Pattern index

Read the full linked rule card before applying a rule. Core patterns define
the default contract; profile patterns define SolidStats domain and lifecycle
behavior. Severity follows `solidstats-shared-review-standards` and actual risk.

## core-cosmetic-yaml

- [core/cosmetic-yaml-indentation](patterns/core-cosmetic-yaml.md#corecosmetic-yaml-indentation)
- [core/cosmetic-yaml-key-order](patterns/core-cosmetic-yaml.md#corecosmetic-yaml-key-order)
- [core/cosmetic-yaml-blank-lines](patterns/core-cosmetic-yaml.md#corecosmetic-yaml-blank-lines)

## core-errors

- [core/errors-shared-shape](patterns/core-errors.md#coreerrors-shared-shape)
- [core/errors-describe-condition](patterns/core-errors.md#coreerrors-describe-condition)
- [core/errors-401-vs-403](patterns/core-errors.md#coreerrors-401-vs-403)
- [core/errors-404-not-found](patterns/core-errors.md#coreerrors-404-not-found)
- [core/errors-409-conflict](patterns/core-errors.md#coreerrors-409-conflict)
- [core/errors-declared-statuses-only](patterns/core-errors.md#coreerrors-declared-statuses-only)

## core-naming-and-ids

- [core/naming-preserve-contract-field-style](patterns/core-naming-and-ids.md#corenaming-preserve-contract-field-style)
- [core/naming-preserve-baseline-enums](patterns/core-naming-and-ids.md#corenaming-preserve-baseline-enums)
- [core/naming-enum-value-style](patterns/core-naming-and-ids.md#corenaming-enum-value-style)
- [core/ids-string-uuid](patterns/core-naming-and-ids.md#coreids-string-uuid)

## core-request-contracts

- [core/request-cursor-pagination](patterns/core-request-contracts.md#corerequest-cursor-pagination)
- [core/request-sort-and-order](patterns/core-request-contracts.md#corerequest-sort-and-order)
- [core/request-enum-default](patterns/core-request-contracts.md#corerequest-enum-default)
- [core/request-optional-list-default](patterns/core-request-contracts.md#corerequest-optional-list-default)
- [core/request-optional-nullability](patterns/core-request-contracts.md#corerequest-optional-nullability)
- [core/request-multipart-encoding](patterns/core-request-contracts.md#corerequest-multipart-encoding)
- [core/request-search-and-filters](patterns/core-request-contracts.md#corerequest-search-and-filters)

## core-response-contracts

- [core/response-cursor-pagination-envelope](patterns/core-response-contracts.md#coreresponse-cursor-pagination-envelope)
- [core/response-list-shape](patterns/core-response-contracts.md#coreresponse-list-shape)
- [core/response-success-status](patterns/core-response-contracts.md#coreresponse-success-status)
- [core/response-empty-204](patterns/core-response-contracts.md#coreresponse-empty-204)

## core-schema-design

- [core/schema-self-contained](patterns/core-schema-design.md#coreschema-self-contained)
- [core/schema-nullability-30](patterns/core-schema-design.md#coreschema-nullability-30)
- [core/schema-nullability-scope](patterns/core-schema-design.md#coreschema-nullability-scope)
- [core/schema-ref-and-reuse](patterns/core-schema-design.md#coreschema-ref-and-reuse)
- [core/schema-allof-default](patterns/core-schema-design.md#coreschema-allof-default)
- [core/schema-polymorphism](patterns/core-schema-design.md#coreschema-polymorphism)
- [core/schema-const-vs-enum](patterns/core-schema-design.md#coreschema-const-vs-enum)
- [core/schema-validation-keywords](patterns/core-schema-design.md#coreschema-validation-keywords)
- [core/schema-description-on-property](patterns/core-schema-design.md#coreschema-description-on-property)
- [core/schema-default-once](patterns/core-schema-design.md#coreschema-default-once)
- [core/schema-openapi-303](patterns/core-schema-design.md#coreschema-openapi-303)

## core-security-auth-access

- [core/security-required-auth-declaration](patterns/core-security-auth-access.md#coresecurity-required-auth-declaration)
- [core/security-optional-auth-declaration](patterns/core-security-auth-access.md#coresecurity-optional-auth-declaration)
- [core/security-explicit-role-policy](patterns/core-security-auth-access.md#coresecurity-explicit-role-policy)
- [core/security-roles-in-context](patterns/core-security-auth-access.md#coresecurity-roles-in-context)
- [core/security-ownership-access](patterns/core-security-auth-access.md#coresecurity-ownership-access)
- [core/security-public-read-private-write](patterns/core-security-auth-access.md#coresecurity-public-read-private-write)
- [core/security-relation-redaction](patterns/core-security-auth-access.md#coresecurity-relation-redaction)

## core-wording

- [core/wording-no-internal-paths-leak](patterns/core-wording.md#corewording-no-internal-paths-leak)
- [core/wording-place-semantics-at-smallest-scope](patterns/core-wording.md#corewording-place-semantics-at-smallest-scope)
- [core/wording-no-default-duplication](patterns/core-wording.md#corewording-no-default-duplication)
- [core/wording-paragraph-spacing](patterns/core-wording.md#corewording-paragraph-spacing)
- [core/wording-laconic-style](patterns/core-wording.md#corewording-laconic-style)

## profile-domain-features

- [profile/feature-api-boundaries](patterns/profile-domain-features.md#profilefeature-api-boundaries)
- [profile/feature-replay-job-lifecycle](patterns/profile-domain-features.md#profilefeature-replay-job-lifecycle)
- [profile/feature-live-pagination](patterns/profile-domain-features.md#profilefeature-live-pagination)
- [profile/feature-canonical-identity](patterns/profile-domain-features.md#profilefeature-canonical-identity)
- [profile/feature-moderation-and-audit](patterns/profile-domain-features.md#profilefeature-moderation-and-audit)
- [profile/feature-attachments-and-storage](patterns/profile-domain-features.md#profilefeature-attachments-and-storage)
- [profile/feature-baseline-changes](patterns/profile-domain-features.md#profilefeature-baseline-changes)

## profile-iteration-workflow

- [profile/iteration-no-rewriting-approved-folders](patterns/profile-iteration-workflow.md#profileiteration-no-rewriting-approved-folders)
- [profile/iteration-draft-vs-approved-body](patterns/profile-iteration-workflow.md#profileiteration-draft-vs-approved-body)
- [profile/iteration-changes-md-required](patterns/profile-iteration-workflow.md#profileiteration-changes-md-required)
- [profile/iteration-changes-no-silent-revert](patterns/profile-iteration-workflow.md#profileiteration-changes-no-silent-revert)
- [profile/iteration-acceptance-coverage](patterns/profile-iteration-workflow.md#profileiteration-acceptance-coverage)
- [profile/iteration-source-and-adjacent-docs](patterns/profile-iteration-workflow.md#profileiteration-source-and-adjacent-docs)
- [profile/iteration-folder-naming](patterns/profile-iteration-workflow.md#profileiteration-folder-naming)
- [profile/iteration-stage-numbering](patterns/profile-iteration-workflow.md#profileiteration-stage-numbering)
- [profile/iteration-parallel-stages-independent](patterns/profile-iteration-workflow.md#profileiteration-parallel-stages-independent)
- [profile/iteration-index-md-content](patterns/profile-iteration-workflow.md#profileiteration-index-md-content)
- [profile/iteration-context-md-content](patterns/profile-iteration-workflow.md#profileiteration-context-md-content)
- [profile/iteration-changed-baselines](patterns/profile-iteration-workflow.md#profileiteration-changed-baselines)
- [profile/iteration-depends-on-explicit-not-numeric](patterns/profile-iteration-workflow.md#profileiteration-depends-on-explicit-not-numeric)
- [profile/iteration-baseline-snapshots](patterns/profile-iteration-workflow.md#profileiteration-baseline-snapshots)

## profile-locale-wording

- [profile/wording-english-artifacts](patterns/profile-locale-wording.md#profilewording-english-artifacts)
- [profile/wording-product-and-service-names](patterns/profile-locale-wording.md#profilewording-product-and-service-names)
- [profile/wording-spec-file-links-github](patterns/profile-locale-wording.md#profilewording-spec-file-links-github)

## profile-security-auth

- [profile/security-session-and-role-policy](patterns/profile-security-auth.md#profilesecurity-session-and-role-policy)
- [profile/security-public-projections](patterns/profile-security-auth.md#profilesecurity-public-projections)
- [profile/security-browser-mutations](patterns/profile-security-auth.md#profilesecurity-browser-mutations)

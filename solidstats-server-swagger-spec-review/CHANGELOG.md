# Changelog — solidstats-server-swagger-spec-review

## 2026-10-04 — Distinguish union coverage and error closure

- Make specialist prompts distinguish exclusive `oneOf` from overlapping
  `anyOf`, including evidence for nested unions.
- Check closed error envelopes separately from typed dictionaries in details;
  consume the repaired validator and shared contract rules.

## 2026-10-04 — Strict public HTTP contract

- Require the shared HTTP profile in every specialist context.
- Gate approval on strict profile and payload checks; review active error-code
  inventory and exact generated variants.

## 2026-09-21 — initial reviewer port

- Added a SolidStats server-2 OpenAPI specification reviewer with independent
  specialist passes,
  aggregation, re-review tracking, and mandatory validator reporting.
- Adapted authoring structure, contract authority, approval gates, and GSD phase
  boundaries to the
  SolidStats Swagger workflow.

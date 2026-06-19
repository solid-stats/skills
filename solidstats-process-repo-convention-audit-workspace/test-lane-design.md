# Test Lane — design note (in progress)

Accumulated requirements + plan for adding a TEST LANE to `repo-convention-audit.workflow.js`.

**Status: IMPLEMENTED in v1.2 (2026-06-17).** Recon `whtv5dfno` done (→ `test-recon-result.json`,
`test-recon` brief). All 6 production fixes + the test lane + edge-case lane + `appliesToTests`
applied to the workflow. JS orchestration validated end-to-end with mocked agents
(`/tmp/wf_harness.mjs`): routing split, mechanical in-scope filter (no test-file leak), test catalog
+ universal-subset on test files, §F severity cap, edge-case `static:unconfirmed` leads, dedup, lane
tagging. The agent PROMPTS (audit quality) are NOT yet validated by a real run — the user is not
re-running the expensive audit this week. See CHANGELOG v1.2.

## Why
The v1 audit excluded test files (`includeTests:false`). Wrong — tests are reliability-critical and
have dedicated skills. The v1.1 pilot also leaked 27 test-file findings into the **Mechanical** lane
(it grepped the whole repo, not the in-scope list) and judged them by PRODUCTION rules.

## Requirements (from the user, across turns)
1. **Audit tests, don't exclude them.**
2. **Tests must be checked against the TEST conventions** (`solidstats-<stack>-tests` +
   `solidstats-shared-testing-standards`): RITE, AAA, determinism/no-real-sleep, over-mock,
   oracle strength, naming, unit-vs-integration boundary, coverage-suppression abuse,
   test-only-exports.
3. **Tests must ALSO be checked against the ORDINARY/universal conventions** — the stack-neutral
   code-style/quality/typing rules that apply to *all* code (`type-over-interface`, `no-any`,
   `no-unexplained-as-cast`, import-order, naming, comments-english, srp-function-length…).
   NOT the production-architecture rules (band/layer, ingest invariants, Zod-config-form,
   exit-codes, DB-write-scope) — those don't apply to tests.
4. **Find uncovered edge cases** (shared-testing-standards §H: every branch/boundary/error-path
   exercised; "if you can break production behavior without breaking a test, the tests aren't
   thorough enough").

## Model
Each production catalog rule gets an **`appliesToTests`** flag (Scope classifies: universal
code-style/quality/typing = true; production-architecture/domain = false).

Routing (Enumerate splits, doesn't exclude):
- **Production file** → full active production catalog (Find/Mechanical/Structural).
- **Test file** → `{ universal subset (appliesToTests=true) of the production catalog } + { test
  catalog }`. Never the architecture/domain rules.
- **Rust inline `#[cfg(test)]`** → the surrounding `.rs` file is dual-routed: production code → prod
  catalog; the `#[cfg(test)]` block → test catalog + universal subset.
- fixtures/helpers in `/tests/` → test catalog (lighter), still universal subset.

Lanes added:
- **Test Scope** — extract the TEST catalog from the test skills (+ §F severity).
- **Test Find** — test files × (test catalog + universal subset), same Verify funnel.
- **Edge-case / thoroughness** — pair each production module with its test(s) via the pairing rule;
  enumerate prod branches/throws/edge-inputs; flag the ones no test exercises, as **leads** (static,
  no execution — explicit caveat). Severity per §H/§F.

Output: test-lane findings tagged `lane:"test"` (or `kind:"test"` / `kind:"edge-case"`); severity by
shared-review-standards **§F** — test quality ≤ REQUEST CHANGES, except a test that masks a real bug
= 🔴.

## Pending production-lane fixes (from the v1.1 pilot + spot-check, separate from the test lane)
1. **🔴 always-adjudicated** + budget bump — DONE: `OPUS_BUDGET` default 24→40; still need to add 🔴
   to the always-adjudicate set (currently architecture-only).
2. **Guard regex anchored** — DONE (was false-drop risk).
3. **Coverage dir-mislabel** — DONE (don't list a dir as skipped when it has findings).
4. **Structural-finder retry** — TODO (a `StructuredOutput` failure dropped `no-replay-parsing`).
5. **Composition-root exemption** — TODO: `band-no-skip`/`band-downward-only` must not flag wire-time
   DI imports at the composition root (`commands/shared.ts resolveDependencies`); only end-use
   orchestration in `commands/` is a real band-skip. Add `compositionRoot` to layerMap + exempt in
   the band-rule prompts. (Spot-check FP.)
6. **Mechanical lane precision** — TODO: (a) restrict the grep to the enumerated in-scope files via a
   JS membership filter (deterministic fix for the test-file leak); (b) tighten the `mechanical`
   criterion in Scope — a rule needing ANY interpretation (blanket-vs-targeted `eslint-disable`) is
   NOT mechanical → route through Find+verify. (Spot-check FPs: targeted disables flagged as blanket.)

## Pilot/spot-check facts to preserve
- v1.1 (commit c850190): 324 findings (🔴5 🟠62 🟡146 🔵111), architecture 17, mechanical 226,
  rulesNotChecked 5; 283 agents / 10.9M tokens. Saved: `pilot-v1.1-result.json`.
- Spot-check (27 stratified): FP-rate 3/27 = 11%; all 5 🔴 real. Saved: `spotcheck-result.json`.
  FP classes: composition-root DI wiring; test files in mechanical lane; targeted-vs-blanket
  eslint-disable.
- Triggering: discrimination test 20/20 (run_loop harness can't score a Workflow-wrapper skill).

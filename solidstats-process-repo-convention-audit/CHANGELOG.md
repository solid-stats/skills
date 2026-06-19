# Changelog — solidstats-process-repo-convention-audit

## 2026-06-20 — make direct-invoke only via `disable-model-invocation`
- Added `disable-model-invocation: true` to the frontmatter. Per the Claude Code skills docs this removes the skill's description from per-session context entirely (not just shortens it), so it now costs zero tokens per session in every consuming repo while the FULL description is kept as documentation. The skill is still invoked by name (and read by its hard-requirers via file path); Claude no longer auto-triggers it.


## 2026-06-17 — v1.2: test lane + spot-check fixes (JS-validated, not re-run end-to-end)
The v1.1 pilot + an adversarial spot-check (FP-rate 3/27 ≈ 11%, all 5 🔴 confirmed real) drove these.
The whole workflow was executed with mocked agents to validate the JS orchestration (routing, the
mechanical in-scope filter, the test lane, the §F cap, dedup, lane tagging); the agent PROMPTS (audit
quality) are not yet validated by a real run.

**Test lane (new) — tests are reliability-critical and had been wrongly excluded.**
- Enumerate now ROUTES files into production / test / fixture instead of dropping tests (test kinds:
  unit / integration / contract; Rust `#[cfg(test)]` files dual-route — production span + test span).
- Each catalog rule carries `appliesToTests`: test files are judged by the UNIVERSAL subset of
  production conventions (type-over-interface, no-any, naming…) **plus** a dedicated TEST catalog from
  `solidstats-<stack>-tests` + `solidstats-shared-testing-standards` (RITE/AAA/determinism/over-mock/
  oracle/coverage-suppression/no-test-only-export…) — never by architecture/domain rules.
- **Edge-case / thoroughness lane** (§H): pairs each production module with its tests and emits
  untested-branch / no-paired-test **leads**, tagged `static:unconfirmed` (no execution).
- Test-lane severity capped per shared-review-standards §F (≤ REQUEST CHANGES; 🔴 only when a test
  masks a real bug). Findings tagged `lane:"test"`, `kind:"test"|"edge-case"`. New output:
  `summary.test`, `summary.edgeCase`, `meta.testLaneRan`, `findings[].lane`, `findings[].static`.
- This also eliminates the pilot's 27 test-file false findings (test files no longer enter the
  production lanes; a deterministic in-scope filter is the belt-and-suspenders backstop).

**Production-lane fixes (from the spot-check FPs):**
- **🔴-critical + architecture/structural findings are now ALWAYS adjudicated** by Opus; the budget
  (default 24→40) caps only the lower-severity tail (v1.1 left all 5 🔴 on Haiku-only verdicts).
- **Guard regex anchored** so it drops only a LEADING "false positive" verdict, never a confirming
  message that contains "…not a false positive" (would have false-dropped 2 real findings).
- **Mechanical precision**: tighter `mechanical` criterion (blanket-vs-targeted eslint-disable routes
  to verify, not the unverified pattern lane) + the deterministic in-scope filter.
- **Composition-root exemption**: `band-no-skip`/`band-downward-only` no longer flag wire-time DI
  imports at the composition root (`compositionRoot` in the catalog).
- **Structural-finder retry** (a `StructuredOutput` drop lost `no-replay-parsing`).

## 2026-06-17 — v1.1 (post-pilot fixes)
First pilot on `replays-fetcher` (54 files, 196 agents, 7.9M tokens, 124 findings) surfaced four
defects; all fixed:
- **FP-leak closed.** The pilot shipped a `dependency-cycle` finding with `verified:true` whose own
  message said *"false positive… no cycle exists"* (Haiku mis-verify + an Opus-budget skip).
  Verifier prompt now frames `verified` as a verdict (a message that argues the finding away forces
  `verified=false`); a JS self-contradiction guard drops any survivor; and **architecture/structural
  findings are now ALWAYS adjudicated** — the Opus budget caps only the non-architecture tail, never
  drops an architecture finding (`meta.opusAdjudications.architectureAlwaysAdjudicated`).
- **Full-catalog coverage.** A single Find pass over ~86 rules let Haiku cherry-pick ~11 (≈75 rules
  never checked). Find now runs **batch × rule-group** (the catalog split into ~10-rule groups, one
  focused pass each) so every rule is applied to every batch; Recall reframed accordingly (a
  zero-candidate rule is now presumptively clean, not skipped).
- **Architecture lane deepened.** The structural lane swept all rules in one freeform pass (found
  only 1 cycle, skipped every band/fence rule). It now sweeps **one structural rule at a time** over
  the shared import map, so each fence/band/cycle/orphan rule is actually applied.
- **Mechanical-rule lane.** Lint/formatter-enforced rules (e.g. `type-over-interface`, which alone
  was 96 of 124 pilot findings) are tagged `mechanical` and handled by a cheap one-grep-per-rule
  **inventory** — counted + listed, never sent through verify/adjudicate (shared §G: don't re-derive
  the linter). Cuts the verify storm and most of the token cost. Output gains `summary.mechanical`,
  `findings[].mechanical`, `findings[].verifiedBy`, and `kind: "mechanical"`.

Robustness: the Scope catalog is the run's single point of failure (a transient API drop there
aborts the whole audit before it starts — observed once as "Connection closed mid-response"). It now
retries up to 3× before failing.

Known limitation recorded: the skill-creator `run_loop` triggering harness can't score a Workflow-
wrapper skill (it counts only `Skill`/`Read` as the first tool, and one-shot `claude -p` can't run a
top-level Workflow) — triggering was validated instead by a discrimination test (20/20: 10/10 recall,
10/10 specificity vs the competing `*-code-review` / `review-lenses` / `*-conventions` / `security` /
`codebase-map` / `graphify` skills).

## 2026-06-17 — Initial
- Whole-repo convention-compliance audit skill whose purpose is to **drive a refactor milestone** —
  surface every way the existing code diverges from the prescribed solidstats standard,
  **architecture included**, as JSON for a downstream fix agent. Decision pack:
  `plans/product/REPO-CONVENTION-AUDIT-SKILL.md`; build prompt: `/tmp/repo-convention-audit-skill-prompt.md`.
  Trigger wrapper for the bundled Workflow `workflows/repo-convention-audit.workflow.js`; invoking
  the skill makes the top-level session run it.
- Reuses, does not fork: the Discovery → fan-out → Merge skeleton + Workflow shape from
  `solidstats-process-review-lenses`; severity buckets (🔴🟠🟡🔵) and `[conv:]`/`[std:]` citation +
  evidence-before-opinion from `solidstats-shared-review-standards`. Overrides that standard's §B
  scope-discipline (whole repo is the target), §G noise filter (report every occurrence), §D
  markdown format (emit JSON), AND the diff-reviewer's gate-suppression of not-yet-PR-enforced
  checks — the audit reports those gaps because closing them is the milestone's job.
- Rule source is single-sourced and re-derived every run: the Scope stage extracts a rule catalog
  ({ ruleId, howToDetect, severity, citation, architecture, suspended, crossFile }) **plus a
  `layerMap`** (bands/layers/crates with `dirs`/`mayDependOn`/`fences`) from the live
  `solidstats-<stack>-conventions` + `-code-review` + shared standards under `<repo>/.claude/skills/`
  — never a persisted copy that can drift.
- **Architecture is a first-class target, in two lanes.** `suspended` is reserved for genuinely
  *undecided* rules (no agreed target) — an approved-but-unmet convention (fetcher's five-band
  layering, signed off 2026-06-13; server-2's layer rules) is active and its gaps are findings.
  Per-file layer rules (placement + a file's own import direction, judged against the `layerMap`)
  run in **Find**; cross-file invariants (dependency cycles, transitive band-skips, forbidden
  cross-band client imports, orphaned/unregistered modules) run in a **Structural** lane that sources
  its import edges from the graphify graph at `.planning/graphs/` — **refreshing it with `graphify
  update` (no API cost) when the built-commit lags HEAD** rather than degrading, grep only if
  graphify is unavailable — and reasons over it. Both lanes feed one shared Verify → Adjudicate funnel.
- Stages, model-tiered for the Claude Max 20x subscription: Scope (Sonnet) → Enumerate (Haiku) →
  Find (Haiku, pipeline) → Structural (Sonnet) → Verify (Haiku) → Recall (Haiku) → Adjudicate
  (budgeted Opus, contested/🔴🟠/architecture subset only). The final JSON is assembled
  deterministically in JS (exact-dup dedup only — no cross-file grouping). Output:
  `meta.{purpose,structuralLaneRan,blindSpots,opusAdjudications}`, `coverage.{suspendedRuleIds,
  rulesNotChecked,dirsSkipped,recallGaps}`, `summary.{byRule,bySeverity,architecture}`, and
  `findings[]` with `architecture`/`kind` flags.
- Rate-limit policy baked in: an in-script Opus semaphore (default 5, the 429 burst lever) plus a
  per-run Opus-call budget (default 24, the weekly-Opus lever) with architecture findings prioritized
  into it, a shared verbatim Opus prefix (catalog + layer map) for prompt-cache reuse, and
  `meta.opusAdjudications.used / skippedByBudget` reporting. All wide fan-out stays on Haiku.
- Static read only — no Bash/typecheck/tests/run; `meta.blindSpots` always carries the runtime +
  grep/graph caveats (the structural graph may lag HEAD).
- **Graphify / MemPalace**: graphify artifacts are excluded from enumeration (`graphify-out/`
  untracked+gitignored; `.planning/graphs/` under the excluded `.planning/`), and the graph is
  *consumed* by the Structural lane (mirrors `solidstats-shared-review-standards` §I.2). MemPalace
  has no in-repo footprint and is deliberately kept out of the rule/finding path to preserve the
  single-source-of-truth discipline.
- Enumerate validated against the three target working trees (recon pass): drive from `git ls-files`;
  exclude test code by PATH SEGMENT (`/tests/` `/test/` `/__tests__/`, not just `.test.*`); exclude
  `.planning/` (fetcher ships a spike `violations.ts` of intentional violations); exclude root
  `openapi/` while keeping `src/openapi/`; anchor `/examples/`+`/tests/` so `src/bin/` production
  binaries stay in scope; drop `vitest.config.ts`. Rust inline `#[cfg(test)]` blocks are skipped by
  the Verify stage. Validated in-scope counts: fetcher ≈ 54, server-2 ≈ 93, parser 47 `.rs` across 5
  crates.
- Direct-use, triggerable skill (RU + EN triggers); run by the top-level session (needs the
  Workflow/Agent tool — a subagent cannot spawn the fan-out).

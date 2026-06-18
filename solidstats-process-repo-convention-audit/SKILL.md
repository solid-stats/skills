---
name: solidstats-process-repo-convention-audit
description: >
  Audit an ENTIRE SolidStats repo against its full convention ruleset — ARCHITECTURE and layering
  INCLUDED — and emit every deviation as JSON to drive a refactor milestone that brings the codebase
  fully into line with the skills. Reads every source file in scope (no file cap, no grep narrowing,
  no diff scope), maps each against a rule catalog + layer map extracted live from the stack's
  solidstats-<stack>-conventions + -code-review + shared standards skills, runs a structural pass
  over the import graph (reusing the graphify knowledge graph) for cross-file layer/fence/cycle
  violations, verifies each candidate, critiques coverage, and adjudicates the contested subset.
  This is the trigger wrapper for the bundled repo-convention-audit Workflow; invoking it makes the
  top-level session run that Workflow. Use it whenever someone wants a whole-repo / full-repo /
  legacy convention sweep, an architecture-compliance inventory, a pre-refactor cleanup list, or
  "find every place that breaks our conventions / architecture" across replays-fetcher, server-2, or
  replay-parser-2 — even when they don't say "audit." This is NOT a diff/PR review (use
  solidstats-<stack>-code-review) and NOT a single-claim check (use
  solidstats-process-deep-code-research). Must be invoked by the top-level session (it needs the
  Workflow/Agent tool — a subagent cannot run it).
  Triggers: "audit the repo", "whole-repo convention audit", "full convention sweep", "inventory all
  convention violations", "find every architecture violation", "refactor the codebase to the skills",
  "check the entire repo against our conventions", "find every deviation", "compliance audit",
  "legacy code convention audit", "аудит репозитория", "аудит всего репозитория", "прогон по
  конвенциям", "вскрой все нарушения архитектуры", "приведи кодбазу в соответствие со скиллами",
  "проверь весь репозиторий на конвенции", "найди все нарушения конвенций", "инвентаризация
  нарушений", "полный аудит соответствия конвенциям", "проверь легаси на конвенции".
---

# SolidStats Repo Convention Audit — whole-repo compliance sweep

This skill runs an **open-ended, whole-repo convention-compliance audit** whose purpose is to
**drive a refactor milestone**: it reads every source file in a SolidStats service repo, judges
each against the *full* convention ruleset — **architecture and layering included** — and emits
every deviation as machine-readable JSON for a **downstream fix agent** to work through until the
codebase fully matches the skills. It is the trigger wrapper around the bundled Workflow
[`workflows/repo-convention-audit.workflow.js`](workflows/repo-convention-audit.workflow.js).

The conventions skills are **prescriptive** (repo policy, AGENTS.md): they define the *desired*
standard, and existing code is brought into line over time — not the reverse. So a gap between the
current code and an *agreed* convention is exactly a finding, even an architecture gap the
day-to-day diff-reviewer defers. This audit is the inventory that feeds the cleanup.

**Why a wrapper.** Only the top-level session holds the `Workflow` / `Agent` tool; a subagent
cannot spawn the fan-out. So this skill exists to be read by the session, which then runs the
Workflow. It reads the `solidstats-*` rule skills but edits none of them — the catalog is
re-derived from the live skills every run, never a forked copy that can drift.

## What this is — and what it is NOT

This audit sits next to two existing harnesses; picking the wrong one wastes a lot of tokens:

| You want… | Use |
|-----------|-----|
| Every convention deviation across a whole repo, as data for an agent | **this skill** |
| A diff / PR reviewed before merge, as a human report | `solidstats-<stack>-code-review` |
| One high-stakes claim verified ("is this path ever authorized?") | `solidstats-process-deep-code-research` |

The audit deliberately **overrides three diff-review disciplines** from
`solidstats-shared-review-standards` because its consumer is an agent, not a reviewer reading a PR:

- **§B scope-discipline is OFF** — the whole repo IS the target, not a change.
- **§G noise filter is OFF** — report every occurrence; do not group or suppress.
- **§D markdown format is OFF** — emit the JSON contract below, not a human report.

It **keeps** the §C severity buckets (🔴🟠🟡🔵, as a sortable field) and the `[conv:]` / `[std:]`
citation + evidence-before-opinion discipline (every finding cites the rule it breaks, with a
verbatim quote at a real `file:line`).

## Scope — targets and rule sources

One audit per repo (3 runs, 3 JSON reports). Each run derives its catalog from that stack's live
skills:

| Repo | Stack | Rule source skills (read live from `<repo>/.claude/skills/`) |
|------|-------|--------------------------------------------------------------|
| `replays-fetcher` | `fetcher` | `solidstats-fetcher-ts-conventions` + `-code-review` + `solidstats-shared-backend-ts-standards` + `solidstats-shared-ts-standards` |
| `server-2` | `server` | `solidstats-server-ts-conventions` + `-code-review` + `solidstats-shared-backend-ts-standards` + `solidstats-shared-ts-standards` |
| `replay-parser-2` | `parser` | `solidstats-parser-rust-conventions` + `-code-review` |

In-scope source files (after excluding tests/fixtures/generated/config, validated against each
repo's working tree): `replays-fetcher` ≈ 54, `server-2` ≈ 93, `replay-parser-2` 47 `.rs` across 5
crates. All three have the rule-source skills installed under `.claude/skills/`.

`solidstats-shared-review-standards` is always read (severity + citation discipline).

## How to run it

1. **Confirm you are the top-level session** with the `Workflow` tool. A subagent without it cannot
   run this — surface that and stop.
2. **Invoke the bundled Workflow.** `scriptPath` is this skill's own copy:

   ```
   Workflow({
     scriptPath: '<this-skill-dir>/workflows/repo-convention-audit.workflow.js',
     args: { repo: '/abs/path/to/replays-fetcher', stack: 'fetcher' },
   })
   ```

   `args` (all optional, but pass `repo` + `stack` to skip inference):
   - `repo` — absolute path to the repo to audit (default: the session cwd).
   - `stack` — `fetcher` | `server` | `parser` (auto-detected from `package.json`/`Cargo.toml` when omitted).
   - `commit` — recorded in `meta.commit` (auto-read from HEAD when omitted).
   - `includeTests` — audit test files too (default `false`; tests are a separate lighter lane in v1).
   - `opusBudget` — max Opus adjudication calls per run (default `24`).
   - `opusConcurrency` — max concurrent Opus calls, the 429 lever (default `5`).

3. **Hand the returned JSON to the downstream agent.** The Workflow returns the contract object
   (see below) directly — there is no markdown report to surface. If a human asks for a summary,
   read `summary.bySeverity` / `summary.byRule` and `meta`; the full `findings[]` array is for the
   consuming agent.

## What the Workflow does (so you can explain it)

Model-tiered for the Claude Max 20x subscription (cheap fan-out, strong model only for judgment).
Findings come from **three lanes** — per-file, structural, and mechanical — the first two feeding one
Verify → Adjudicate funnel, the third a cheap pattern inventory:

```
Scope      → extract the rule CATALOG + LAYER MAP from the live skills. Each rule:
             { ruleId, howToDetect, severity, citation, architecture, crossFile, mechanical, suspended }.
             layerMap = the bands/layers/crates as data (dirs, mayDependOn, fences).
             Derived every run — never a persisted fork.                                      [Sonnet]
Enumerate  → git ls-files (tracked only) → keep in-scope exts; exclude node_modules/dist/target/
             coverage/.planning/graphify-out/gsd-briefs/docs/deploy/ + d.ts/migrations + root
             openapi/ (keep src/openapi/) + vitest.config.ts; drop test code by PATH SEGMENT
             (/tests/ /test/ /__tests__/, *.test.*, *.fixtures.*, crates/*/{tests,examples}/)
             without catching src/bin/; batch by module/dir.                                  [Haiku]
Find       → batch × RULE-GROUP: the semantic per-file catalog is split into ~10-rule groups and
             each group run as its own focused pass, so no pass can cherry-pick a few rules and
             skip the rest. Per-file layer rules judged against the layerMap.                  [Haiku, pipeline]
Mechanical → lint/formatter-enforced rules (type-over-interface, no-any, import-order…): ONE grep
             sweep per rule → a counted occurrence inventory. NOT sent through verify/adjudicate
             (re-deriving ESLint is the waste §G warns against).                              [Haiku]
Structural → refresh the graphify graph to HEAD, then sweep each cross-file rule ONE AT A TIME
             over the import map: dependency cycles, transitive band-skips, forbidden cross-band
             client imports (fences), orphaned/unregistered modules.                          [Sonnet]
Verify     → per Find/Structural candidate: re-Read the cited span, confirm the quote is still
             there, is LIVE code, and truly breaks the rule. `verified` is a verdict — a message
             that argues the finding away forces verified=false (+ a JS self-contradiction guard). [Haiku]
Recall     → which ruleIds / dirs / fences were never meaningfully checked → coverage gaps.   [Haiku]
Adjudicate → ARCHITECTURE/structural AND 🔴-critical findings are ALWAYS adjudicated (the
             milestone's point and the top FP-risk); the Opus budget only caps the lower-severity
             contested tail. Behind an Opus semaphore + a shared cached prefix.                [budgeted Opus]
Test       → routed TEST files × the TEST catalog (RITE/AAA/determinism/over-mock/oracle/coverage-
             suppression, from the test skills) + the UNIVERSAL subset of production conventions
             (appliesToTests) — never architecture/domain rules. Plus an EDGE-CASE pass: pair each
             production module with its tests, emit untested-branch leads (static:unconfirmed).
             Severity capped per §F (≤ REQUEST CHANGES; 🔴 only if a test masks a bug).         [Haiku]
```

The per-file lane catches a file importing upward in its *own* imports; the structural lane catches
what no single file reveals (cycles, transitive skips, orphans). Grouping (Find) guarantees every
rule is applied; the mechanical lane keeps lint-enforced rules from flooding the funnel; the test
lane audits tests against test + universal conventions (never production architecture); and
architecture/critical findings are never dropped by the Opus budget.

**Rate-limit policy.** All wide fan-out is Haiku; Scope is Sonnet; Opus runs only on the contested
subset, bounded by an in-script semaphore (the 429 burst lever) *and* a per-run call budget (the
weekly-Opus-budget lever). `meta.opusAdjudications` reports `used` vs `skippedByBudget`. See the
script header and global memory `claude-max-20x-rate-limits` for the rationale.

## Output — the JSON contract

The Workflow returns this shape (no markdown). `coverage` is first-class so the consumer can tell
"checked, clean" from "not checked":

```jsonc
{
  "meta": {
    "repo", "stack", "commit",
    "staticOnly": true,
    "purpose": "refactor-milestone — surface every deviation, architecture included",
    "structuralLaneRan": true,           // false if the repo had no layer map / structural rules
    "testLaneRan": true,                 // false if no test files were routed
    "blindSpots": ["runtime invisible", "grep/graph-evading constructs", "structural graph may lag HEAD"],
    "opusAdjudications": { "used": N, "skippedByBudget": M, "alwaysAdjudicated": A }
  },
  "coverage": {
    "suspendedRuleIds": [],   // ONLY genuinely-undecided rules (no agreed target) — NOT approved-but-unmet architecture
    "rulesNotChecked": [],    // rules no lane meaningfully checked (e.g. structural rules when the lane couldn't run)
    "dirsSkipped": [],        // excluded dirs + recall-flagged silent dirs
    "recallGaps": []
  },
  "summary": {
    "byRule": { "<ruleId>": count },
    "bySeverity": { "🔴": n, "🟠": n, "🟡": n, "🔵": n },
    "architecture": n,        // findings that are layering/fence/placement — the milestone's core
    "mechanical": n,          // lint-enforced occurrences (run the formatter/linter to auto-fix)
    "test": n,                // test-lane findings (test quality + universal conventions on tests)
    "edgeCase": n             // untested-branch / no-paired-test leads (static, unconfirmed)
  },
  "findings": [
    { "ruleId", "severity", "stack", "lane": "production" | "test",
      "file", "lineStart", "lineEnd", "quote", "message", "fix",
      "citation", "architecture": bool, "mechanical": bool,
      "kind": "per-file" | "structural" | "mechanical" | "test" | "edge-case",
      "static": "unconfirmed",   // present ONLY on edge-case leads (no test execution)
      "verified": true, "verifiedBy": "llm" | "pattern" | "static", "adjudicated": bool }
  ]
}
```

## Constraints baked into the run

- **Static only (on the target code).** No typecheck / tests / run of the audited code. The one
  permitted side effect is refreshing the audit's *own* analysis input — `graphify update <repo>`
  when the graph lags HEAD — which graphify documents as no-API-cost static extraction, not a build
  or test of the product. Every report carries runtime + grep/graph blind-spot caveats in
  `meta.blindSpots` — a clean finding set means "static read found nothing," not "runtime-proven."
- **Architecture IS reported** — it is the milestone's point. An *approved* convention the code
  doesn't yet meet (the fetcher's five-band layering, signed off 2026-06-13; server-2's layer rules)
  is a finding, even though the day-to-day diff-reviewer defers that check for PR noise — this audit
  overrides that deferral like it overrides §B/§G/§D. `suspended` is reserved for rules that are
  *genuinely undecided* (no agreed target shape yet); those, and only those, sit in
  `coverage.suspendedRuleIds`.
- **Two finding lanes.** Per-file layer rules (a file's own placement + import direction, judged
  against the `layerMap`) run in **Find**; cross-file invariants (cycles, transitive band-skips,
  global fences, orphaned/unregistered modules) run in **Structural**. The Structural lane sources
  its edges from the **graphify** knowledge graph at `.planning/graphs/` (it resolves
  re-exports/barrels/type-only imports a grep would blur); when the graph's built-commit lags HEAD it
  is **refreshed with `graphify update`** (no API cost) rather than degrading — grep is a last resort
  only if graphify is unavailable. Its cycle/orphan findings are leads to confirm with
  `depcruise`/`clippy`, not proof.
- **Graphify & MemPalace.** Graphify artifacts are never audited as source: `graphify-out/` is
  untracked + gitignored, and `.planning/graphs/` sits under the excluded `.planning/`. The graph
  itself is *consumed* by the Structural lane (above). **MemPalace** has no in-repo footprint and is
  deliberately kept out of the rule/finding path — the catalog is single-sourced from the live
  skills only, so MemPalace memories never become rules or excuse a finding (it can inform the
  downstream *fix* agent, which is outside this skill).
- **Rust uses the parser skills**, not the TS standards, and judges inline `#[cfg(test)]` blocks as
  test scaffold (the Verify stage rules them out of production-code findings).

## First milestone — pilot on `replays-fetcher`

Pilot the full pipeline on `replays-fetcher` (≈54 source files, the cheapest target) before
generalizing to `server-2` (≈93) and `replay-parser-2` (47 `.rs` across 5 crates). Dogfood:
hand-check a sample of findings against their cited spans, confirm the Verify stage kills a planted
false-positive and the Recall critic flags a deliberately-skipped rule, and confirm no 429 at the
chosen `opusConcurrency`. Tune `opusBudget` from the pilot's contested count.

**Known scope traps the Enumerate stage already handles** (validated against the working trees):
`replays-fetcher` ships `.planning/spikes/**/probe/violations.ts` — a spike file of *intentional*
violations that must never be audited; `server-2` keeps ~13 non-`.test.ts` test helpers
(`fixtures.ts`, `utilities.ts`, …) inside `/tests/` dirs and a generated root `openapi/`;
`replay-parser-2` keeps production binaries in `crates/parser-quality/src/bin/` (must stay in scope)
and inline `#[cfg(test)]` blocks inside production `.rs` files (the Verify stage skips those).

**Architecture rule-source nuance (by design, reported — not suspended):** `replays-fetcher`'s
five-band layering is APPROVED in `solidstats-fetcher-ts-conventions` (2026-06-13) even though
`solidstats-fetcher-ts-code-review` still defers the layer checks for everyday PRs. Since the
architecture is an *agreed target*, the Scope stage catalogs those rules as **active** (not
`suspended`) and the audit **reports** the layer/band/dependency-direction gaps — that is the
milestone fuel. The diff-reviewer's PR-gate deferral is a noise concern this audit overrides; mark
`suspended` only a rule with no agreed shape at all. Same for `server-2`: its `.dependency-cruiser`
fences are "aspirational" (preset uninstalled, real inversions expected by design) — the conventions
explicitly say the first run *should* report many violations to pull the code into line, so they are
reported (per-file placement in **Find**, cross-file fences/cycles in **Structural**), not hidden.

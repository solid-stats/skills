# Evals & milestone artifacts — solidstats-process-repo-convention-audit

Versioned record of how this skill was built and validated. The live working copies live in the
sibling `*-workspace/` (untracked, per repo convention); these are the durable snapshots.

## Design

- [`test-lane-design.md`](test-lane-design.md) — the running spec / decision record for the test
  lane and the post-pilot production fixes (status: IMPLEMENTED in v1.2). Start here.

## Triggering eval

The skill-creator `run_loop` harness **cannot** score a Workflow-wrapper skill (it counts only
`Skill`/`Read` as the first tool, and one-shot `claude -p` can't run a top-level Workflow), so
triggering was validated by a discrimination test instead.

- [`trigger-eval.json`](trigger-eval.json) — 20 queries (10 should-trigger, 10 near-miss).
- [`discrimination-eval.workflow.js`](discrimination-eval.workflow.js) — routes each query to one
  skill among the real menu and scores recall vs specificity. Result: **20/20**.

## Quality validation (replays-fetcher pilot)

- [`results/pilot-v1.1-result.json`](results/pilot-v1.1-result.json) — the v1.1 audit run on
  `replays-fetcher` (commit `c850190`): 324 findings (🔴5 🟠62 🟡146 🔵80→111), 17 architecture, 226
  mechanical; 283 agents / ~10.9M tokens. The milestone artifact.
- [`spotcheck.workflow.js`](spotcheck.workflow.js) — adversarial verifier over a stratified sample.
- [`results/spotcheck-sample.json`](results/spotcheck-sample.json) — the 27-finding sample.
- [`results/spotcheck-result.json`](results/spotcheck-result.json) — FP-rate **3/27 ≈ 11%**, all 5
  🔴 confirmed real. FP classes: composition-root DI wiring, test-file mechanical leak,
  targeted-vs-blanket eslint-disable — all addressed in v1.2.

## Quality validation — v1.2 (real end-to-end run, 2026-06-20)

First real run of the agent prompts (v1.2 had previously been mocked-agents only), at the same pilot
commit `c850190` for an apples-to-apples comparison.

- [`results/pilot-v1.2-result.json`](results/pilot-v1.2-result.json) — the v1.2 audit: 335 findings
  (🔴0 🟠24 🟡100 🔵211), 16 architecture, 155 mechanical, 88 test, 16 edge-case; 500 agents /
  21.27M tokens / ~83 min.
- [`spotcheck-v1.2.workflow.js`](spotcheck-v1.2.workflow.js) — parameterized adversarial verifier
  (`args.repo` + `args.sample`), reusable across runs (the v1.1 `spotcheck.workflow.js` hardcodes its
  sample).
- [`results/spotcheck-v1.2-sample.json`](results/spotcheck-v1.2-sample.json) — 29-item stratified
  sample: the 5 v1.1 🔴 (before/after) + 24 v1.2-strata findings.
- [`results/pilot-v1.2-spotcheck-analysis.md`](results/pilot-v1.2-spotcheck-analysis.md) — the
  write-up. Headline: the 🔴 5→0 is mostly a **correction** of v1.1 over-grading (v1.2 right on 3/5),
  with 2 real defects (an under-graded contract-defeat cast; a missed multi-line as-cast) tracked for
  v1.3. Methodology: the v1.1 "all 5 🔴 confirmed" verdict above was a too-lenient **Haiku** pass —
  grade 🔴/LSP with Opus.

## Test-landscape recon

- [`results/test-recon-result.json`](results/test-recon-result.json) — per-repo test landscape
  (routing, pairing, harnesses, coverage config, test-quality rule groups T1–T11) + the synthesis
  brief that designed the test lane.

> NOTE: the v1.2 JS orchestration was first validated with **mocked agents**; the agent prompts were
> then validated by a **real end-to-end run** on 2026-06-20 (see "Quality validation — v1.2" above and
> `CHANGELOG.md`). That run confirmed v1.2 is a net improvement over v1.1 but surfaced 2
> detection/grading defects tracked for v1.3.

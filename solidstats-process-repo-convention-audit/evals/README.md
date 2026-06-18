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

## Test-landscape recon

- [`results/test-recon-result.json`](results/test-recon-result.json) — per-repo test landscape
  (routing, pairing, harnesses, coverage config, test-quality rule groups T1–T11) + the synthesis
  brief that designed the test lane.

> NOTE: the v1.2 production-lane fixes and the test lane were validated by executing the workflow
> with **mocked agents** (JS orchestration); the agent prompts are not yet validated by a full real
> run. See the skill `CHANGELOG.md` (v1.2).

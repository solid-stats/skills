# Decision records

Why the SolidStats skill set is shaped the way it is. Each ADR captures one decision that cuts
across more than a single skill's `CHANGELOG.md` — the taxonomy, the per-stack architecture calls,
and the cross-stack rules. Per-skill `CHANGELOG.md` files still record local edits; these records
hold the reasoning a single changelog can't.

The records came out of the 2026-06-13 skills-taxonomy run (multi-variant taxonomy debate +
per-service deep research). The raw provenance — the debate, the judge panel, the research reports,
the corpus audit, and the suppression triages — lives in [`research/`](research/) and is cited from
each ADR's Sources section.

## Records

| ADR | Decision | Scope |
|-----|----------|-------|
| [0001](0001-skill-taxonomy-v5.md) | Taxonomy V5 + the `process-`→`shared-` rename (meta layer, intensional audiences, bidirectional parity headers) | all skills |
| [0002](0002-replays-fetcher-architecture.md) | replays-fetcher five-band layering + checkpoint design | fetcher trio |
| [0003](0003-server-2-schema-library-typebox-to-zod.md) | server-2 schema library: migrate TypeBox → zod 4 | server trio, `shared-backend-ts` |
| [0004](0004-server-2-boundary-and-testing.md) | server-2 boundary & testing decisions (no-pass-through, `getDecorator`, depcruise, mocking-by-layer) | server trio |
| [0005](0005-lint-and-coverage-suppression-policy.md) | Lint & coverage suppression policy (never silence a structural gate; config-once; narrow exceptions) | `shared-ts`/`-testing`, `parser-rust`, all `-tests` |
| [0006](0006-replay-parser-2-convention-deltas.md) | replay-parser-2 convention deltas (observability §K–§M, determinism, worker) | parser trio |

## Code-side follow-ups

These records changed the skills. The matching code cleanup in the consuming repos is tracked as
non-blocking briefs in the planning repo, not here:

- `plans/server-2/briefs/server-2-skill-cleanup-followup.md` — config-once lint, the 6 missing
  branch tests + god-file splits, the TypeBox→zod code migration, the boundary decisions applied.
- `plans/replays-fetcher/briefs/fetcher-architecture-code-followups.md` — shared S3/pg client,
  the `RunSummary` move, the `cli.ts` split, the depcruise preset.
- `plans/replay-parser-2/briefs/replay-parser-2-gate-cleanup.md` — clippy config-once and the live
  risk: 14 expired coverage-allowlist entries + coverage not wired into CI.
- `plans/product/SKILLS-REVIEW-FEEDBACK-TIER.md` — proposed `solidstats-process-review-feedback`
  learning tier for the reviewer family (backlog, size M).

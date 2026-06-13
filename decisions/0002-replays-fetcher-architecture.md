# ADR 0002 — replays-fetcher architecture (five-band layering + checkpoint design)

- Status: Accepted (2026-06-13)
- Scope: `replays-fetcher` repo; the `solidstats-fetcher-ts-conventions` / `-code-review` / `-tests` skill trio
- Supersedes: none

## Context

`replays-fetcher` is a run-once CLI ingest job: discover new replay files from an external
HTTP source, fetch their bytes, store raw objects in S3-compatible storage, write
staging/outbox records to PostgreSQL with checkpoint/resume. It carries no domain logic, must
never parse replay contents (that belongs to `replay-parser-2`), and must never touch
`server-2` business tables. The architecture brief proposed a five-band layout (Variant A) but
left four questions open: flat capability dirs versus a re-nested `stage/` taxonomy; where the
`check/`/`contract-check/` diagnostics sit; where checkpoint/idempotency live; and how
resilience is layered. A deep-research pass (Variant B) was run to pressure-test the brief
before any of it was encoded into the fetcher skill. The fork: adopt the brief as-is, replace it
with the research's hexagonal recommendation, or converge.

A second open question was the checkpoint protocol. The first research pass flagged
checkpoint/resume as the weakest-evidenced area in OSS TS/Node tooling (OpenETL has it only as a
future feature), so a wave-2 pass went directly to mature connector SDKs (Airbyte, Singer,
Meltano, Temporal) to confirm or refute the proposed design.

## Decision

Variant A's five bands survive, converged with the research into the layout now encoded in
`solidstats-fetcher-ts-conventions` (SKILL.md §A/§B):

- **Five bands, downward-only.** Command (`cli.ts` + `commands/`) → Orchestration (`run/`) →
  Capability (`discovery/ storage/ staging/ checkpoint/ evidence/ contract-check/ check/`) →
  Adapter (`*-client / *-store / *-storage / *-repository`), with a cross-cutting band
  (`config.ts errors/ logging/ source/`) imported downward only.
- **Flat capability dirs.** The existing `discovery/ storage/ staging/ checkpoint/ evidence/`
  layout already *is* the pipeline-stage taxonomy; no `stage/` re-nesting. The brief's open
  question is closed: flat.
- **No port ceremony.** The factory-contract pattern (a typed `type` plus `create…(deps)`)
  already yields swappable adapter interfaces; no separate port-interface files are added on top.
- **Named read-only diagnostics band.** `check/` and `contract-check/` form a diagnostics band
  that may import adapters and capabilities to *read* (connectivity pings, contract checks) but
  never the write path. Review enforces read-only because dependency-cruiser cannot distinguish
  a read import from a write one.
- **Command-band split.** `cli.ts` is command registration only (`buildCli` +
  `resolveDependencies` + the four `program.command().action()` registrations); per-command
  option parsing and dispatch live in `commands/<command>.ts` (`check`, `contract-check`,
  `discover`, `run-once`); all orchestration logic lives in `run/`. The current 822-line
  `cli.ts` carrying orchestration functions is the anti-pattern this splits.
- **Idempotency = orchestration + a staging unique key.** `run/` owns resume decisions; the
  staging table carries a unique natural key (checksum + source identity) and writes are
  `ON CONFLICT DO NOTHING`-style idempotent. Checkpoint state only narrows the re-scan window —
  it does not, on its own, guarantee no duplication.
- **Resilience cross-cutting, policies orchestration-owned.** Retry/backoff primitives live in
  cross-cutting `source/`; their per-stage policies are configured and applied by `run/`.
  Adapters do not hard-code retry semantics.

**Eight dependency-cruiser fences** encode the band invariants as `forbidden` import rules
(SKILL.md §A "Boundary fences"):

1. Downward-only — a lower band never imports an upper one; cross-cutting imports nothing upward.
2. No band-skipping — command goes through orchestration; orchestration composes capabilities,
   not raw clients.
3. No replay parsing — no module imports an OCAP parser / replay-content reader (`forbidden` on
   parser packages and any content-decode path).
4. PG write scope — only `staging/` (write) and the read-only diagnostics band may import the
   PostgreSQL client; the client is built once at composition and injected.
5. S3 write scope — only `storage/ checkpoint/ evidence/` (write) and the read-only diagnostics
   band may import the S3 client; one shared client built once and injected (today's four
   `new S3Client(...)` collapse to one).
6. Discovery is read-only — `discovery/` never imports `storage/` or `staging/`.
7. Resilience is cross-cutting — `source/` is imported by adapters and never imports them back.
8. Diagnostics never import the write path — `check/ contract-check/` may read adapters and
   capabilities but never the staging/storage write path.

**Checkpoint design** (confirmed against SDK practice, with three adjustments):

1. A single versioned opaque state object — one S3 key per pipeline, value `{v: 1, cursor: {...}}`;
   state is not sharded across keys (mirrors Meltano's S3 state backend and Temporal
   `heartbeatDetails`, which hand the next run the whole blob).
2. Checkpoint write sequenced strictly *after* the staging batch commit returns. A crash between
   the two is absorbed by `ON CONFLICT DO NOTHING` on the next run. No transactional coupling
   between PostgreSQL and S3 — this is by-design at-least-once.
3. Batch-granularity checkpoints with a time ceiling — checkpoint per discovery page / staging
   batch; Airbyte's ≤30-min target is a sane upper bound for pathological batches. Per-file
   checkpointing is not used by any SDK and is not adopted here.

## Rationale

The research confirmed two first-principles results that pushed the design toward "light." First,
hexagonal/ports-and-adapters is the canonical isolation mechanism for a batch script driving
external adapters (Cockburn's original definition names batch scripts as drivers) — so the
read-source / write-sink split is the right structural rule. Second, and decisively, full
hexagonal is over-engineering when domain complexity is low (Rentea): a raw-bytes fetcher with no
business rules sits exactly in the CRUD-like category where vertical slices / a plain
pipeline-stage taxonomy beat ceremony. That is why the converged design keeps the five bands but
**rejects** added port-interface files and **rejects** re-nesting capabilities under `stage/` —
both add churn without buying isolation the factory contracts and flat dirs already provide.

Resilience placement follows the one verified implementation in the field (OpenETL): exponential
backoff with jitter is configured once at the orchestrator and applied uniformly, not duplicated
per adapter. Hence primitives in `source/`, policies in `run/`.

The idempotency decision rests on a refuted claim: "checkpointing enables precise resumption
without duplication" is materially false — Airbyte documents incremental sync as at-least-once
*by design*. Dedup is the sink's job. So the defensible pattern is at-least-once delivery plus a
write-side idempotency key (`INSERT … ON CONFLICT DO NOTHING`), with checkpoint state used only
to narrow the re-scan window. This is what the wave-2 SDK survey corroborated end-to-end: opaque
JSON cursor in an external durable store, batch/page granularity, write-durably-then-advance-cursor,
at-least-once plus idempotent sink. The three adjustments are the small deltas between "matches
practice" and "matches practice exactly" — collapse state to one versioned blob, name the
PG-commit-then-S3-checkpoint ordering as a hard invariant rather than coupling the two stores,
and cap checkpoint cadence by batch with a time ceiling.

No published dependency-cruiser or eslint-boundaries ruleset for ingest isolation was verifiable,
so the preset is written in-house (the vocalclub precedent for an own preset stands). The wave-2
snippet survey supplied the patterns to copy: named layer-path arrays referenced in rules,
`pathNot` interface escape hatches, `dependencyTypesNot` to keep npm/core/type-only imports legal,
and the convention of running boundary validation as a separate `deps:validate` script rather than
folding it into lint. One structural rule — modules importable only via their `index.ts` — cannot
be expressed in depcruise `forbidden` rules (`via` applies only to cycles) and would need ESLint
`no-restricted-imports`; it is not among the eight fences.

## Consequences

- The fetcher architecture is marked **APPROVED (2026-06-13)** in `solidstats-fetcher-ts-conventions`
  §A — the layout questions are closed. The `.dependency-cruiser.cjs` preset draft exists
  (`plans/replays-fetcher/briefs/fetcher-dependency-cruiser.cjs`); it ships as the repo preset and the
  fetcher reviewer's layer checks switch on when the fetcher trio is wired into the `replays-fetcher`
  repo. Until that migration the §A fences are documented, not yet enforced against the code.
- The preset predicts three violations in the current tree. The real code fix:
  `evidence/s3-evidence-store.ts` imports `RunSummary` from `run/types.ts` — an upward import that
  fires fence #1 (downward-only; the preset's own label for it is `F3-no-capability-upward`).
  `RunSummary` moves to a cross-cutting `types/` band while the
  `run/summary.ts` builder stays. The other two predicted violations are exemption decisions:
  `cli.ts` as a composition root that directly constructs capabilities, and the diagnostics
  adapters in `check/` that import `pg` / `@aws-sdk/client-s3` for connectivity pings.
- Code-side follow-ups deferred to the refactor: split the 822-line `cli.ts`, move `RunSummary`,
  collapse the four `new S3Client(...)` constructions to one injected client. Tracked in
  `skills/decisions/research/gate-suppression-backlog.md` §D.
- The §B ingest invariants (never parse contents; write scope = S3 raw + PG staging only; never
  touch `server-2` business tables; no RabbitMQ publishing) are *not* pending — they bind today
  as the `replays-fetcher` AGENTS hard rules and any violation is a blocking review finding.
- Checkpoint design needs no redesign; the three adjustments are small and applied in the
  conventions. Crash-recovery correctness depends on the ordering invariant holding in `run/`,
  which review must check since no tool enforces "PG commit before S3 checkpoint write."

## Sources

- `skills/decisions/research/architecture-convergence.md` §1 — Variant A/B recap, the convergence, the layout sign-offs,
  the wave-2 fold-in
- `skills/decisions/research/research-fetcher.md` — hexagonal-as-isolation and over-engineering-for-CRUD findings, the
  orchestrator-level backoff result, the refuted no-duplication claim
- `skills/decisions/research/research-fetcher-wave2.md` §1 — checkpoint design confirmed vs Airbyte/Singer/Meltano/Temporal,
  the three adjustments; §2 — depcruise snippet patterns and the index-only tool-split caveat
- `plans/replays-fetcher/briefs/fetcher-depcruise-notes.md` — wiring, the exact-vs-sign-off fence split, the three
  predicted current-tree violations
- `solidstats-fetcher-ts-conventions/SKILL.md` — the implementing skill: §A five bands +
  eight fences (APPROVED 2026-06-13; fences activate on repo-wiring), §B hard ingest invariants
- `skills/decisions/research/RECOMMENDATION.md` — tone calibration; the sign-off checklist context

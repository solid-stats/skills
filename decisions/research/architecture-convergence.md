# Architecture Convergence — fetcher / server-2 / parser

**Status:** filled — all three research passes landed (fetcher / server-2 / parser).

## 1. replays-fetcher — Variant A (in-house, from the brief) vs Variant B (research)

### Variant A recap (from `plans/replays-fetcher/briefs/fetcher-architecture-conventions.md`)

Five bands, downward-only dependencies:

| Band | Holds today | Role |
|------|-------------|------|
| Command | `cli.ts` | commander commands; parse args, load config, assemble deps, dispatch |
| Orchestration | `run/` | one ingest cycle: discover → fetch → store raw → stage, checkpoint/resume, run summary; idempotency boundary |
| Capability | `discovery/ storage/ staging/ checkpoint/ evidence/ contract-check/ check/` | one ingest job each; typed errors; delegates I/O to its adapter |
| Adapter | `*-client / *-store / *-storage / *-repository` | the only code talking to S3 / PostgreSQL / the HTTP source; write-scope boundary |
| Cross-cutting | `config.ts errors/ logging/ source/` | config, typed errors, logger, resilience primitives |

Fences (→ depcruise `forbidden`): downward-only; no layer-skipping; no replay parsing;
write-scope isolation (PG only via `staging/`; S3 only via `storage/checkpoint/evidence`);
discovery read-only; resilience is cross-cutting and imports nothing upward.

Open questions A left for research: flat capabilities vs pipeline-stage taxonomy; where
`check/`/`contract-check/` (diagnostics band?) sit; checkpoint/idempotency placement; resilience
layering.

### Variant B (deep-research findings — see `research-fetcher.md`)

Run stats: 6 angles, 12 sources, 38 claims extracted → 3 confirmed high, 11 killed, rest unverified.
What survived verification:

1. **Hexagonal/ports-and-adapters is the canonical isolation mechanism** for "batch script
   driving external adapters" (Cockburn's original definition names batch scripts as drivers) —
   the port/adapter split is exactly the structural rule that keeps an extractor out of the
   system-of-record. _High._
2. **Full hexagonal is over-engineering for a zero-domain-logic pipeline** (Rentea): when the
   challenge is not business-rule complexity, vertical slices / a plain pipeline-stage taxonomy
   beat ceremony. A raw-bytes fetcher sits exactly there. _High._
3. **Resilience primitives (exp backoff + jitter) are configured once at the orchestration
   level**, not re-implemented per adapter (verified OpenETL implementation). _High, single
   source._
4. Checkpoint/resume: an **orchestration concern**, and checkpointing alone never guarantees
   no-duplication — at-least-once + **write-side idempotency keys** (unique key per discovered
   file, `INSERT … ON CONFLICT DO NOTHING`) is the defensible pattern. _Low confidence (OSS
   TS tooling immature here), but consistent with Airbyte's documented at-least-once semantics._
5. **No published depcruise/eslint-boundaries ruleset for ingest isolation was verifiable** —
   we will be writing our own preset, which is fine (vocalclub precedent); the tools' general
   forbidden-rule capability is real.

### Convergence — the architecture the fetcher skill will carry (proposed)

Variant A's five bands survive, with four research-driven adjustments:

1. **Keep the layering light — no port ceremony.** The factory-contract pattern (typed `type` +
   `create…(deps)`) already gives us swappable adapter interfaces for free; do NOT add separate
   port-interface files/abstractions on top (finding 2: ceremony without domain logic).
2. **Flat capability dirs stay; no `stage/` re-nesting.** The current
   `discovery/ storage/ staging/ checkpoint/ evidence/` layout is the pipeline-stage taxonomy
   already — renesting adds churn, not legibility (finding 2). The brief's open question is
   closed: **flat**.
3. **Diagnostics band named.** `check/` and `contract-check/` form a read-only diagnostics band:
   they may import adapters/capabilities to *read*, never the write path. Becomes fence #7.
4. **Idempotency is orchestration + database constraint, not checkpoint magic.** `run/` owns
   resume decisions; the staging table carries a unique natural key (checksum + source identity)
   and writes are `ON CONFLICT DO NOTHING`-style idempotent; checkpoint state only narrows the
   re-scan window (finding 4). Resilience primitives live in cross-cutting `source/`, but their
   **policies are configured and applied by orchestration** per stage — adapters don't hard-code
   retry semantics (finding 3).

Fences (→ `.dependency-cruiser.cjs` preset, ours to write):
downward-only; command never skips orchestration; no replay parsing anywhere; PG imports only in
`staging/`; S3 imports only in `storage/ checkpoint/ evidence/`; `discovery/` read-only;
`source/` imports nothing upward; diagnostics band never imports the write path.

### Layout decisions confirmed (2026-06-13)

The leftover §A layout questions, signed off:

1. **Command band split** — `cli.ts` thin registration + `commands/` per-command handlers;
   orchestration logic moves to `run/`. Forced by the no-disable-`max-lines` rule (the 822-line
   god-file is the anti-pattern).
2. **Diagnostics band** (`check/ contract-check/`) — read-only; may import `pg`/S3 clients for
   connectivity checks (write-scope fences carve them out), never the write path. Review enforces
   read-only (depcruise can't tell read from write).
3. **`RunSummary` → cross-cutting `types/`** — the type moves out of `run/types.ts` (which
   `evidence/` imports upward — a real violation); the builder `run/summary.ts` stays.
4. **Adapters stay per-capability** (not a shared `adapters/` dir), but the **shared S3/pg/HTTP
   client is built once at composition and injected** — today's four `new S3Client(...)` collapse to
   one (the External-adapters rule). The "duplication" was the client construction, not the adapters.

Code-side follow-ups (when the fetcher is refactored): `gate-suppression-backlog.md` §D.

### Wave-2 adjustments (confirmed by SDK practice)

Three checkpoint adjustments confirmed against Airbyte / Singer / Meltano / Temporal practice
(full evidence in `research-fetcher-wave2.md §1`):

1. **Single versioned opaque state object.** One S3 key per pipeline; the value is
   `{v: 1, cursor: {...}}`. Do not shard state across keys — every SDK treats state as a single
   blob the next run receives whole (mirrors Meltano S3 backend / Temporal `heartbeatDetails`).
2. **Hard ordering invariant in `run/`.** Checkpoint write is sequenced strictly after the staging
   batch commit returns. Crash between the two is absorbed by `ON CONFLICT DO NOTHING` on the next
   run. No transactional coupling between PG and S3 — this is by-design at-least-once; do not add
   distributed-transaction machinery.
3. **Batch-granularity checkpoints with a time ceiling.** Checkpoint per discovery page / staging
   batch; Airbyte's ≤30-min ceiling is a sane upper bound for pathological batches. Per-file
   checkpointing is not used by any SDK and is not needed here.

The boundary preset draft now exists at `drafts/fetcher-dependency-cruiser.cjs`; wiring and
sign-off items are documented in `drafts/fetcher-depcruise-notes.md`.

## 2. server-2 — validation deltas

Current conventions: 4-layer feature modules (controller → usecase → service → repository),
functional factories + Fastify-plugin DI, TypeBox→OpenAPI as the contract, Kysely-only data
access, queue-consumer discipline.

Research (`research-server.md`): pass 1 (strict verified harness) was inconclusive — treat as
harness calibration, except the RabbitMQ prefetch byproduct. Pass 2 (pragmatic practice survey,
validated against 2024–2026 Fastify org repos/docs, Collina's modular_monolith, RabbitMQ official
docs, Kysely docs, real rulesets) produced the verdicts below.

### Verdicts

| Topic | Verdict | Why |
|-------|---------|-----|
| Layering (controller → usecase → service → repository) | **keep-with-note** | Feature modules are exactly canon. Fastify reference codebases are radically flatter (fastify/demo: two layers; Collina's modular_monolith: no controller/usecase/service layers anywhere) — our 4-layer stack is not contradicted, but unsupported by ecosystem precedent. Transaction-as-argument and usecase-as-optional match precedent. |
| DI (functional factories + fp decoration, no container) | **keep** | Plugin decoration IS the Fastify DI mechanism (Collina's word: "crude"); maintainers endorse per-domain decorated repositories over containers; no maintainer recommends tsyringe/inversify. |
| ~~TypeBox~~ → **MIGRATE to zod 4** → @fastify/swagger → OpenAPI → TS client | **migrate (decided 2026-06-13)** | Code-first pipeline stays; the schema lib changes. TypeBox `Type.Ref` breaks Fastify handler inference (issue #263), forcing an inline-vs-$ref tradeoff. `fastify-type-provider-zod` + `z.globalRegistry` decouples them — pass the schema variable (inference intact) **and** emit `$ref` via `jsonSchemaTransformObject`. Plus zod is already the org standard (fetcher + web); server-2 was the TypeBox outlier. (Verified via context7.) Scope: 12 schema files + 2 setup files, **zero** existing `Type.Ref`/`addSchema` usage. |
| Kysely over pg | **keep** | Production-mainstream (Deno, Maersk, Cal.com); stricter query-level type safety than Drizzle. The claimed Fastify endorsement failed spot-check — dropped. |
| Module-boundary enforcement | **adjust (gap)** | We rely on convention; mature TS monoliths enforce boundaries mechanically (dependency-cruiser group-capture rules, eslint-plugin-boundaries `element-types` + `entry-point`). |
| RabbitMQ via amqplib | **keep-with-adjust** | All high confidence from official docs: manual ack only (autoAck officially "unsafe"); per-consumer prefetch 100–300; global prefetch deprecated in 4.0 (hard channel error on quorum queues); quorum delivery limit = 20 → DLX effectively mandatory; nack-requeue does not increment delivery-count, reject does; consumers idempotent. |

### Applied tonight (in the skill drafts)

- **Queue rule wording:** the queue-reliability rule says **per-consumer prefetch** explicitly
  (RabbitMQ 4.0 deprecates global/per-channel prefetch entirely), not just "prefetch/QoS cap".
- **Schema lib: migrate TypeBox → zod 4** (decided 2026-06-13). The earlier "inline-vs-`Type.Ref`
  tradeoff / OpenAPI-rule reversal" is **moot** — it only existed because TypeBox's `$ref` broke
  inference. With `fastify-type-provider-zod` + `z.globalRegistry`, `$ref` dedup and handler
  inference coexist. The conventions/reviewer/standards skills were rewritten to zod; the server-2
  **code** migration (deps swap, 12 schema files, 2 setup files) is a backlog item
  (`gate-suppression-backlog.md` §E). OpenAPI 3.0.x pin note stands (a @fastify/swagger property,
  lib-independent).
- **Kysely rules:** (1) kysely-codegen with `--verify` in CI to catch schema drift;
  (2) `Selectable<T>`/`Insertable<T>`/`Updateable<T>` as the only row types exposed on
  repository signatures.

### Applied — the four deferred decisions (decided 2026-06-13)

Brief + options: `server2-deferred-decisions.md`. As confirmed:

- **A — no-pass-through rule ONLY.** A usecase/service that only forwards (no guard, transaction,
  orchestration, or row→domain map) must be collapsed. **Controller → repository was NOT allowed**
  — controller→service for plain CRUD stays the only carve-out (the "trivial CRUD" shortcut was
  rejected as a judgment-call loophole). Usecase optional, tx boundary in usecase — unchanged.
- **B — adopt `getDecorator<T>()`/`setDecorator<T>()`** (Fastify ^5.8.5, ≥5.3 confirmed). Register
  via `app.decorate`, access via `app.getDecorator<Contract>(name)` (fail-fast
  `FST_ERR_DEC_UNDECLARED` at boot), drop the `declare module 'fastify'` global augmentation.
- **C — dependency-cruiser** (NOT eslint-plugin-boundaries) — **one tool across both TS services**
  (user chose depcruise everywhere). Two rules: (1) cross-module imports only via `index.ts`;
  (2) layer allowlist downward-only, no upward imports, `infra/`/`config/` import nothing from
  `modules/`. Preset draft: `drafts/server-2-dependency-cruiser.cjs`.
- **D — test mocking, both by layer.** Unit tests inject mocks into `createX(deps)` directly;
  route integration tests override via `app.setDecorator<T>()` after `buildApp()` (decision B) —
  no `fastify-override` dep.

Encoded into `solidstats-server-ts-conventions` / `-code-review` / `-tests`. Code-side application
(server-2 repo: the depcruise config + CI step, the `getDecorator` access migration, collapsing any
pass-through layers) is a backlog item.

## 3. replay-parser-2 — validation deltas

Current reality: 5-crate workspace (`parser-cli`, `parser-contract`, `parser-core`,
`parser-quality`, `parser-worker`); tokio + lapin worker; thiserror; schemars/semver contract;
tracing. Conventions skill: §A crate architecture, §B lint floor, §C determinism, §D errors,
§E types, §F parsing/malformed input, §G contract, §H async/worker, §I docs/perf, §J build/CI.
Known gap: no §Z/§AA/§AB observability doctrine analog.

Research (`research-parser.md`): claim-level adversarial verification; confidence per finding
noted below.

### Confirmed deltas — applied tonight (in the skill drafts)

- **§C determinism — BTreeMap/serde_seq rule:** IndexMap's default serde implementation provides
  *no guarantee* that serialization formats preserve key-value pair ordering. For
  canonical/bit-for-bit deterministic JSON output, use BTreeMap or serialize IndexMap via
  serde_seq (sequence of tuples); never rely on IndexMap's default serde output. _High
  confidence — official IndexMap docs._
- **§H worker — lapin auto-recovery:** enable automatic connection + topology recovery via
  `ConnectionProperties::default().enable_auto_recover()`, then
  `channel.wait_for_recovery(error).await` on recoverable errors. _High confidence — primary
  source (lapin README + source)._
- **§H worker — semaphore note:** `basic_qos` prefetch_count controls delivery backpressure,
  **not** task-level concurrency — application-level semaphores are still needed for true
  concurrency caps (prefetch ≠ concurrency).
- **Tests skill — insta sorted redactions:** insta supports sorting a map or sequence at a
  selector, making snapshots stable for HashSet-like collections with non-deterministic
  serialization order without requiring BTreeMap everywhere. _High confidence — insta.rs docs._
- **Observability gap closed — §K–§M:** new `references/observability-and-lifecycle.md` in
  `solidstats-parser-rust-conventions` (Rust idiom, from
  `drafts/parser-rust-observability-section.md`), with a bidirectional parity header to
  §Z/§AA/§AB in `solidstats-shared-backend-ts-standards`.

### Confirmed as correct — existing choices, keep

- **Workspace layout:** Cargo workspace with separate core/cli/worker crates is the standard
  layout for parser projects shipping multiple binaries — core exposes the deterministic parser
  as a library; cli and worker are thin binary wrappers adding error context at the edge. _Medium
  confidence — community consensus; no primary-source quote verified this run._
- **thiserror layering:** thiserror for typed, structured errors in the library crates + anyhow
  at the binary boundary is the current Rust community consensus for the
  library-vs-application split. _Medium confidence — well-established practice, not independently
  verified this run._ (Our §D is anyhow-free in libraries — consistent with this.)
- **lapin as the AMQP client:** runtime-agnostic (tokio default, smol/async-global-executor via
  feature flags); `basic_qos(prefetch_count, options)` to limit unacknowledged delivery. _High
  confidence — primary source._

### Research caveats (not acted on)

- Graceful lapin shutdown: the `Channel::close()` pattern was refuted on entailment — consult
  current lapin API docs before codifying a close pattern.
- cargo-fuzz coverage workflow: all specific tooling claims (compiler flags, `cargo fuzz
  coverage` behavior, llvm-tools-preview) were refuted — the cargo-fuzz book is the
  authoritative source; only the general "visualize coverage to optimize corpus/targets"
  recommendation is confirmed.
- Cross-language contract versioning (Rust producer → TS consumer): entirely unverified this
  run (_low confidence_) — our schemars/semver contract stands on its own reasoning.

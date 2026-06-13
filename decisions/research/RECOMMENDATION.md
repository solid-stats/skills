# RECOMMENDATION — Skill Taxonomy V5 + Converged Architectures

**Verdict: Variant V5 with the four breaker fixes** (see `taxonomy-variants.md` for the full
debate, scores, and the breaker report). V1 is the fallback. Status: implemented as **drafts**
in the skills repo working tree — nothing committed, no consumer repo touched.

> **APPROVED 2026-06-13** — the user signed off V5 (item 1). Naming finalized: `process-`→`shared-`
> scope, server-2 skill scope `backend`→`server`, shared service tier `solidstats-shared-backend-ts-standards`.
> Also added this session: a **lint-suppression policy** (`shared-ts-standards §C` + Rust analog in
> `parser-rust-conventions §B`) and a **coverage-ignore policy** (`shared-testing-standards §H` +
> per-stack `-tests`) — never silence a structural gate; configure genuine noise once; keep only
> narrow, reasoned exceptions. Code-side cleanup tracked in `gate-suppression-backlog.md`. The
> fetcher **Command-band split** (thin `cli.ts` + `commands/`; orchestration in `run/`) is confirmed
> (item 2 of the fetcher architecture).

## Target taxonomy

```text
META LAYER (process- prefix = read by other skills, never triggered directly)
  solidstats-shared-project-standards      all repos (unchanged tonight)
  solidstats-shared-review-standards       all repos (unchanged)
  solidstats-shared-testing-standards      all repos (unchanged)
  solidstats-shared-ts-standards           all TS repos
      + NEW: utility libraries (es-toolkit/type-fest/day.js/nanoid) — single home
      + NEW: TS test idioms (typed builders, test.each, @ts-expect-error, fake timers)
  solidstats-shared-backend-ts-standards   ← renamed from the parked process-backend-standards
      audience (intensional): every TS *service-side* repo — currently server-2 + replays-fetcher
      content: naming/factories, typed-error base, enums, config discipline, external adapters,
      async safety, process lifecycle, LSP/SOLID/DRY, §Z/§AA/§AB (TS form)
      utilities section REMOVED (→ ts-standards); bidirectional parity header on §Z/§AA/§AB ↔
      parser-rust-conventions §K–§M

DIRECT-USE LAYER (scope = repo/domain)
  solidstats-server-ts-conventions/-code-review/-tests     server-2 ONLY
      conventions: §B naming → pointer; fetcher baseline note dropped; [HTTP] tags dropped;
      references keep only Fastify/TypeBox/Kysely/queue/security + envalid specifics
      code-review: rule libraries = conventions + backend-ts-standards; [conv:]/[std:] citation
      map REWRITTEN same-pass (breaker fix 4); severity table annotated "derived"
      tests: fetcher note dropped; testcontainers keep RabbitMQ
  solidstats-fetcher-ts-conventions/-code-review/-tests     replays-fetcher (NEW trio)
      conventions: converged architecture (see architecture-convergence.md §1) marked
      "PROPOSED — pending user sign-off"; AGENTS invariants as fences; Zod config form;
      CLI error boundary (exit codes + run summary)
      code-review: Phase 1 = ingest-boundary gate (no parsing, write-scope, evidence,
      idempotency); CLI-shaped risk order; severity table
      tests: testcontainers postgres + minio (no rabbitmq); 100% reachable-source gate;
      idioms inherited from ts-standards
  solidstats-parser-rust-conventions/-code-review/-tests    replay-parser-2
      conventions: + references/observability-and-lifecycle.md (§K–§M, Rust idiom, from
      drafts/parser-rust-observability-section.md) with bidirectional parity header
      + §C/§H deltas from research-parser.md (BTreeMap/serde_seq rule; lapin auto-recover;
      prefetch ≠ concurrency → semaphore note)
      tests: + insta sorted-redactions note
  solidstats-frontend-react-conventions/-code-review/-tests web
      conventions: utilities + restated TS baseline in typescript.md → pointers to ts-standards
```

## Naming rule (codified in skills-repo AGENTS.md)

`process-` prefix **means** meta/shared layer: read by other skills, never triggered directly;
its target segment names the **audience** (`ts` = all TS repos, `backend-ts` = TS service-side
repos, none = all repos). Direct-use skills never carry `process-`. Scope list gains `fetcher`.
Audiences are defined intensionally (breaker fix 2). A second Rust repo is the documented
trigger to extract a `process-rust-standards` layer — not before.

## Anti-drift mechanics (breaker fixes 1, 4)

- §Z/§AA/§AB carry **bidirectional** parity headers (TS file names the Rust mirror; Rust file
  names the TS source). Editing either side without the other is a review finding.
- The backend reviewer's citation map rewrite is part of this pass; its severity table is
  annotated as derived from conventions+standards tags.

## Architecture decisions (see `architecture-convergence.md`)

- **Fetcher**: Variant A five-band layering, converged with research — flat capability dirs
  (no stage/ re-nest), no port ceremony beyond factory contracts, named read-only diagnostics
  band (`check/ contract-check/`), idempotency = orchestration + staging unique key
  (`ON CONFLICT`), resilience primitives cross-cutting with orchestration-owned policies.
  Eight depcruise fences listed there; the `.dependency-cruiser.cjs` preset ships when the
  architecture is signed off.
- **server-2**: 4-layer module pattern kept; queue rule wording: per-consumer prefetch
  (global prefetch deprecated in RabbitMQ 4). Further deltas: `research-server.md` pass 2.
- **parser**: 5-crate workspace + thiserror/anyhow-free §D confirmed; determinism §C gains the
  IndexMap-serde warning (BTreeMap/serde_seq); §H worker gains lapin auto-recover +
  semaphore-for-concurrency.

## Migration plan (after morning sign-off)

1. Review drafts in the skills repo working tree (`git status` shows every file); fix-up pass.
2. Commit skills repo; push.
3. Rewire consumer repos: locks (fetcher: swap backend trio → fetcher trio + backend-ts-standards;
   server-2: + backend-ts-standards; all four repos: sync AGENTS GSD:skills tables with locks —
   they are out of sync today, see corpus-audit.md), reinstall via `scripts/update-all-skills.sh`.
4. Sign off the fetcher architecture → unlock the PENDING block + ship the depcruise preset +
   enable layer checks in fetcher-ts-code-review.
5. Backlog: estesis-style review-feedback learning loop for the family; split ci-cd-pattern.md
   stack halves out of project-standards; consider `process-code-standards` (V2-lite) only if
   the parity contract demonstrably drifts.

## What was drafted where (drafting pass `wf_fea68be0-3df`, verified + fixed)

All drafts are **uncommitted working-tree changes** in the skills repo (`git status` shows the
full list). **Post-fixer re-verify (2026-06-13, run `wf_eac80a00-10d`): clean** — 0 blockers;
1 major (a `pg.Pool` param list duplicated between backend and the standards layer) and 1 minor
(parser parity header missing the "§AB DB-rows leg N/A" note) found and fixed; conservation,
all `[conv:]`/`[std:]` citations, bidirectional parity headers, and the frontend dedup all
confirmed clean. New: `solidstats-shared-backend-ts-standards/` (renamed from the evening draft),
`solidstats-fetcher-ts-{conventions,code-review,tests}/`,
`solidstats-parser-rust-conventions/references/observability-and-lifecycle.md` (§K–§M).
Modified: the backend trio (server-2-only + citations rewritten), `solidstats-shared-ts-standards`
(+§F utilities, +§G TS test idioms), frontend `typescript.md` (dedup → pointers), parser
conventions/tests (research deltas), `AGENTS.md` (naming rule + fetcher scope), `README.md`
(catalog). Every touched skill has a CHANGELOG entry. Verification: 12 findings, all resolved
(the one "blocker" was a verifier false alarm).

## ⚠️ Morning sign-off checklist (decisions embedded in the drafts)

1. **Taxonomy V5 + the rename** `solidstats-shared-backend-ts-standards` (supersedes the
   evening's `process-backend-standards` pick) — approve or pick the V1 fallback.
2. **Fetcher architecture §A** in `solidstats-fetcher-ts-conventions` — marked PROPOSED; on
   sign-off: ship the depcruise preset + enable layer checks in the fetcher reviewer.
3. **server-2 schema lib: MIGRATE TypeBox → zod 4** (decided 2026-06-13, supersedes the earlier
   "OpenAPI inline-vs-`Type.Ref` reversal" — that tradeoff only existed under TypeBox). `Type.Ref`
   broke Fastify handler inference (#263); `fastify-type-provider-zod` + `z.globalRegistry` give
   `$ref` dedup *and* inference, and zod is already the org standard (fetcher + web). Conventions/
   reviewer/standards rewritten to zod; **code** migration (server-2 repo) is backlog
   `gate-suppression-backlog.md` §E (small: 12 schema files + 2 setup files, zero `Type.Ref` today).
4. **server-2 deferred decisions — DECIDED 2026-06-13** (brief: `server2-deferred-decisions.md`):
   **A** no-pass-through rule only (no controller→repo); **B** adopt `getDecorator`/`setDecorator`
   (Fastify ^5.8.5 ✓); **C** dependency-cruiser as the boundary tool — **one tool across both TS
   services** (depcruise everywhere, not eslint-plugin-boundaries); **D** test mocking both-by-layer
   (unit=inject, route=`setDecorator`). Encoded into the server-2 trio; code-side application is
   backlog. See `architecture-convergence.md` §2.
5. Migration steps 2–4 (commit/push, consumer-repo rewires, AGENTS-table sync) — awaiting your go.

## Night extras (after the core run)

- **Wave-2 research** (`research-fetcher-wave2.md`): the checkpoint design is **confirmed** by
  SDK practice (Airbyte/Singer/Meltano/Temporal) with three small adjustments (single versioned
  state object; checkpoint strictly after staging commit, no PG↔S3 coupling; batch granularity +
  time ceiling) — folded into `architecture-convergence.md` §1.
- **Depcruise preset draft**: `drafts/fetcher-dependency-cruiser.cjs` + notes. It predicts three
  violations in the CURRENT fetcher tree; the real one to fix in code later:
  `evidence/s3-evidence-store.ts` imports `run/types.ts` (upward) — `RunSummary` should move to
  cross-cutting. The other two are composition-root/diagnostics exemption decisions.
- **Fetcher skills smoke-test** (`drafts/fetcher-skills-smoke-test.md`): four fixes found and
  **applied to the drafts** (staging-DDL ownership stated as pending — no invented owner;
  cross-app schema-compat pointer to project-standards; `source/` resilience API stub; the
  reviewer's PENDING carve-out tightened to layer-placement only).
- **Review-feedback loop proposal** (`drafts/review-feedback-loop-proposal.md`): the missing
  estesis-style learning tier — size M, CAPTURE-first recommendation. Backlog.
- **server-2 deferred-decisions brief** (`server2-deferred-decisions.md`) — see item 4.

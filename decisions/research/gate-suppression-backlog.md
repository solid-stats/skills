# Quality-Gate Suppression — Cleanup Backlog

Consolidated from the two triages (`eslint-disable-triage.md`, `coverage-clippy-triage.md`).
The **conventions** are encoded (lint policy → `shared-ts-standards §C` + `parser-rust-conventions §B`;
coverage policy → `shared-testing-standards §H` + per-stack `-tests`). This file is the **code-side
cleanup** that brings the repos into line — to do over time, not blocking.

Headline: across **197 suppressions, only ~7 are real hidden gaps**. 24 evaporate via config; 165
are genuine by-construction/contract/I-O exceptions.

## A. Config-once (deletes the most inline suppressions; do first — cheap)

**server-2 `eslint.config.js`** — promotes ~100 inline disables to config:
- `unicorn/no-null: "off"` → removes **67**.
- `camelcase: ["error", { properties: "never" }]` → removes **33** (DB/parser snake_case rows).
- a `**/*.test.ts` override turning off `no-magic-numbers`, `max-lines`, `max-lines-per-function`,
  `class-methods-use-this`, the `no-unsafe-*` family, `prefer-promise-reject-errors`,
  `no-empty-function`, `require-unicode-regexp`, `no-inline-comments`.
- `no-use-before-define: { classes: false }` (17), `id-length` exceptions for parser wire fields
  (10), `max-classes-per-file: "off"` (5).
- ~~`new-cap` `capIsNewExceptions` += `Type.Integer/Type.Null/…` (10)~~ — **moot after the zod
  migration** (§E): zod uses lowercase `z.object`/`z.string()`, so the `new-cap` noise from TypeBox
  `Type.X` disappears entirely; those 10 disables vanish with the migration, no config needed.
- (The first three lines — `no-null`, `camelcase`, the test override — are already in the shared
  baseline `shared-ts-standards §C`; server-2 inherits them, so only the repo-specific ones above
  need adding locally.)

**replays-fetcher `eslint.config.js`** — `camelcase` already inherits `properties: never`; add
`allow: ["^run_id$"]` for the cross-service contract key (4). Test-file override inherited from baseline.

**replay-parser-2 root `Cargo.toml` `[workspace.lints.clippy]`**:
- `trivially_copy_pass_by_ref = "allow"` (8 sites, one rationale).
- optionally `missing_const_for_fn = "allow"` (1, private builders).
- **delete** the 9 redundant test-module `#![allow(clippy::expect_used)]` (already covered by
  `clippy.toml allow-expect-in-tests`).

**Coverage excludes (config, not inline):**
- server-2 `vitest.config.ts coverage.exclude` += `src/operations/*.ts` (removes 4 bootstrap ignores).
- replays-fetcher `vitest.config.ts coverage.exclude` += `src/cli.ts` (removes 2; the file is excluded
  once it becomes a thin entrypoint anyway).

## B. Real refactor / missing-test backlog (the ~7 genuine gaps + god-files)

**Write the missing tests (fixture-only, no infra):**
- server-2 `modules/public-stats/repository.ts` — **6 inline v8-ignores on real branches**: slug-based
  event lookup, `rotationId` undefined in `buildReplayWhere`, `eventRowCursor` null `occurred_at`,
  `playerStatsSql` row-absent, `mappedStats` undefined, `page.limit <= 0`. Write 6 targeted unit
  tests, delete the ignores. Also migrate that file's 2 `// c8 ignore` → `/* v8 ignore */`.
- replay-parser-2 `raw_compact.rs:716` — split the one `too_many_lines` test fixture into per-key-group
  helpers.

**Split the god-files (structural `max-lines`, the Rule-B findings):**
- server-2 `public-stats/repository.ts` (**1927 lines**, 17 ignores → 11 after the tests),
  `statistics/repository/repository.ts` (938), `ingest/repository/repository.ts` (878) — split by
  query group (reads/writes or per-aggregate).
- server-2 `max-params` (4) — SQL builders with 4+ positional args → options object.
- replays-fetcher `cli.ts` (822 → thin registration + `commands/`; orchestration to `run/`),
  `run-once.ts` (1073), `discover.ts` (707) — split per the fetcher Command-band decision.

## C. Process fixes — Rust coverage (the real risk; fix or the discipline is theatre)

The parser's `coverage/allowlist.toml` discipline is well-designed (per-entry owner, reviewer,
expiry, co-located `// coverage-exclusion:` marker; legit categories only). But:
1. **All 14 allowlist entries are EXPIRED** (expiry `2026-05-28`; today `2026-06-13`). Renew or resolve.
2. **CI does not run coverage.** `cd.yml` runs only `cargo test --workspace`; the strict gate
   (`scripts/coverage-gate.sh --strict`, guarded by `COVERAGE_ALLOW_HEAVY=1`) is local-only. Add a
   verify-job step so the allowlist + thresholds are actually enforced.

## D. Fetcher §A architecture follow-ups (code-side, when the fetcher is refactored)

Confirmed §A layout decisions (2026-06-13) that need code changes in `replays-fetcher`:
- **One shared S3 client.** Today `s3-raw-storage`, `s3-checkpoint-store`, `s3-evidence-store`, and
  `check/s3-connectivity` each call `new S3Client({...})` — **4 duplicated constructions**. Build the
  S3 client once at composition (the `commands/` handler / composition root) and inject the existing
  `sender` into all three stores; the `*FromConfig` convenience factories collapse. Same for `pg`.
- **Move the `RunSummary` type** out of `run/types.ts` into a cross-cutting `types/` module (the
  builder `run/summary.ts` stays) — removes the upward import in `evidence/s3-evidence-store.ts`.
- **Split `cli.ts`** (822 lines) into thin registration + `commands/` + orchestration into `run/`
  (also listed under §B above).

## E. server-2 TypeBox → zod 4 migration (code-side; decided 2026-06-13)

The conventions are rewritten to zod; the `server-2` repo code migration:
- **Deps:** drop `@sinclair/typebox` + `@fastify/type-provider-typebox`; add `zod@^4` +
  `fastify-type-provider-zod`.
- **Setup (2 files):** `src/app.ts` + `src/openapi/register-openapi.ts` — swap to
  `setValidatorCompiler(validatorCompiler)` / `setSerializerCompiler(serializerCompiler)`,
  `withTypeProvider<ZodTypeProvider>()`, and swagger `transform: jsonSchemaTransform` +
  `transformObject: jsonSchemaTransformObject`.
- **Schemas (~12 files):** `Type.Object`→`z.object`, `Static<typeof X>`→`z.infer<typeof X>`,
  bounds (`.max()`/`.int().min().max()`), `.strict()` on request objects; register shared response
  schemas via `z.globalRegistry.add(X, { id })` where `$ref` dedup is wanted (inference stays).
- **Unchanged:** the OpenAPI export/verify pipeline (`openapi:export`/`verify` + `openapi-typescript`
  → web client); the OpenAPI 3.0.x pin.
- Easier than feared: **zero** existing `Type.Ref`/`addSchema`/`$id` usage to untangle (server-2 is
  already all-inline), so the "inline-vs-$ref" question never applied.

## Genuine exceptions (no action — keep, per policy)

165 suppressions are legitimate: fetcher `no-await-in-loop` (deliberate pacing / S3 CAS / source
order, 14), TS coverage defensive-throw guards (47), Rust by-construction `expect`/cast/contract
allows (11), the Rust allowlist's live-I/O / serde-Visitor / select-cancellation entries (107).
Each must stay narrow + reasoned (and, for Rust coverage, within a live expiry).

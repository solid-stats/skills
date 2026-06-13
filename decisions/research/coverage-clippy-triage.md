I'll write the brief directly from the three inventories provided. The data is complete and self-consistent, so no tooling is needed.

# Quality-Gate Suppression Audit — Action Brief

## 1. Rust lint (clippy) — 31 suppressions

### Move to `[workspace.lints.clippy]` in root `Cargo.toml` (config-fixable) — **18 sites**
These are pedantic/restriction lints fired workspace-wide where every site shares one rationale. Delete the per-site/per-module `#[allow]`/`#![allow]` and centralize:

```toml
[workspace.lints.clippy]
trivially_copy_pass_by_ref = "allow"   # borrowed RawReplay signature is the contract — 8 sites
missing_const_for_fn       = "allow"   # private combat builders kept signature-consistent — 1 site (events.rs module-level)
```
- **`trivially_copy_pass_by_ref` (8)** — all carry the same "plan requires a borrowed `RawReplay` signature" reason; pure pedantic-deny artifact. Move and drop all 8.
- **`expect_used` in test modules (9)** — fully redundant: `clippy.toml` already sets `allow-expect-in-tests = true`. Just **delete** the 9 inner `#![allow]`; no table entry needed.
- **`missing_const_for_fn` (1)** — module-level on `events.rs`. Move to the table if const-elision is acceptable for private builders codebase-wide (it is); otherwise leave the one narrow file-level allow.
- **`multiple_crate_versions` (1)** — already correctly at `[lints.clippy]` with an AWS-SDK/AMQP comment. No action.

### Keep as narrow `#[allow]`/`#[expect]` with a reason (genuine exception) — **11 sites**
By-construction invariants and contract boundaries that must stay per-function:
- **`expect_used` in production (5)** — SHA-256 always-64-hex, `SourceRefs::new` on a fresh non-empty vec, internal error-code constants. Convert to `#[expect(...)]` so the compiler warns if the invariant breaks.
- **`as_conversions` + `cast_precision_loss`/`cast_possible_truncation` (4)** — documented u64→f64 legacy frame-math (metadata.rs) and usize→u64 event indexes (events.rs).
- **`needless_pass_by_value` (1)** — `normalize_combat_events` consumption-semantics contract.
- **`too_many_arguments` (1)** — `ParseCompletedMessage::new`, 8 mandatory 1:1 wire fields; keep as `#[expect]`.
- **`panic` in tests (2)** — deliberate join-panic task + a `panic!` assertion.

Convert the `#[expect]`-eligible ones (too_many_arguments, the 5 production expects) so they self-retire if the invariant changes.

### Refactor instead of suppress (complexity smell) — **1 site**
- **`too_many_lines` (1)** — test `compact_root_entity_and_shape_helpers_should_cover_source_keys` (raw_compact.rs:716). Split into per-key-group helpers (entity fields / event fields / markers); do not silence.

**Rust-lint tally: 18 config → 11 keep-narrow → 1 refactor (+1 already-correct = 31).**

---

## 2. Coverage — TS — 59 inline ignores

### Legitimate `coverage.exclude` globs (entry/bootstrap — config, not inline) — **6 sites → 2 globs**
Identical `import.meta.url` bootstrap guards; the bodies are tested, only the guard is uncovered:
- **server-2** `vitest.config.ts`: add `src/operations/*.ts` to `coverage.exclude` (same treatment as `server.ts`) → removes **4** ignores.
- **replays-fetcher** `vitest.config.ts`: add `src/cli.ts` → removes **2** entrypoint ignores.

### Inline v8-ignores that must become tests (refactor) — **6 sites, all in one file**
- **server-2 `modules/public-stats/repository.ts` (6)** — real branches with real semantics, each names its missing fixture: slug-based event lookup, `rotationId` undefined in `buildReplayWhere`, `eventRowCursor` null `occurred_at`, `playerStatsSql` row-absent, `mappedStats` undefined, `page.limit <= 0`. **No new infra — fixture inputs only.** Write the 6 targeted unit tests and delete the ignores.

### Genuine narrow exceptions (keep) — **47 sites**
Defensive throws / injection defaults / SQL-row invariants that are structurally unreachable in a passing run: test-utility auth guards (8), route pre-handler `user===null` (2), SQL single-row/`EXISTS` invariants (9), replay-mapper upstream-contract nulls (4), `defaultSleep`/`defaultNow` & `execFile` injection stubs (5+1), cli.ts internal guards (4), byte-client/source-client non-Error catches (4), connectivity non-Error catches (2), run/summary array-invariant guards (4), html regex-group guard (1), valid_from NOT NULL guards (2). Two cleanups: migrate the **2 `// c8 ignore`** sites in repository.ts to `/* v8 ignore */` (mixed c8/v8 syntax is confusing), and add a fixture for the `winnerSide.state !== 'present'` mapper path (weakest of the 4 — real data can produce non-`present`).

### Cluster smells (the file is the signal) — flag
- **`server-2/.../public-stats/repository.ts`** — **17 ignores** in one file (6 refactor + 9 SQL-invariant + 2 c8). The hot spot; once the 6 tests land it drops to 11 genuine.
- **`replays-fetcher/src/cli.ts`** — **6 ignores** (2 bootstrap + 4 internal guards). After excluding the file/entrypoint at config level it's effectively zero inline.

**TS tally: 6 config-glob (→2 globs) → 47 keep-narrow → 6 refactor-to-tests = 59.**

---

## 3. Coverage — Rust — current gate + what to tighten

**Current state:** Sole tool is `cargo-llvm-cov`; no tarpaulin, no `--ignore-filename-regex`, no blanket file excludes. Every production line is covered or listed in `coverage/allowlist.toml`. The allowlist is genuinely strict — 14 entries (~107 inline markers) each require exact line numbers, a reviewer, an expiry date, and a co-located `// coverage-exclusion:` marker within 8 lines. Categories are legitimate: live I/O boundaries (AMQP/S3/signals/axum), serde `Visitor` arms, `tokio::select` cancellation races, defensive schema-drift fallbacks. `--no-cfg-coverage` is the correct stable-toolchain setting.

**Tighten — two real gaps:**
1. **All 14 allowlist entries are EXPIRED** (expiry `2026-05-28`, today `2026-06-13`). The postprocessor mandates current expiry dates → renew or resolve every entry now.
2. **CI does not run coverage at all.** `cd.yml` runs only `cargo test --workspace`; the strict gate (`scripts/coverage-gate.sh --strict`, guarded by `COVERAGE_ALLOW_HEAVY=1`) is local-only. The allowlist and thresholds are **unenforced**. Add a verify-job step: `COVERAGE_ALLOW_HEAVY=1 scripts/coverage-gate.sh --strict`. Without it, both the expiry discipline and the allowlist are honor-system.

No suppressions to remove here — the gate is well-designed but not wired into CI and is currently stale.

---

## 4. Unified policy wording

**(a) Rust-lint analog of TS rule B — for `solidstats-parser-rust-conventions §B`:**
A clippy lint that fires across multiple sites for one shared, codebase-wide reason is a configuration decision, not a per-site exception: set it once in `[workspace.lints.clippy]` (`lint = "allow"`/`"warn"`) rather than scattering `#[allow]`. Reserve inline `#[allow]`/`#[expect]` for genuine, narrowly-scoped exceptions backed by a by-construction invariant or a contract boundary, and always pair them with a one-line reason. Prefer `#[expect(...)]` over `#[allow(...)]` for invariant guards so the compiler retires the suppression automatically if the condition ever changes. Never silence a complexity lint (`too_many_lines`, `too_many_arguments`, cognitive-complexity) to avoid work the lint is correctly demanding — refactor, or justify the suppression as an irreducible wire/contract shape.

**(b) Coverage-ignore policy — for `solidstats-shared-testing-standards` + each per-stack `-tests` skill:**
Never add a coverage ignore to a real, reachable branch just to hit the number — if the branch has semantics, it gets a test (most need only a new fixture input, not new infrastructure). Blanket file-level excludes belong in tool config (`vitest.config.ts coverage.exclude`, the Rust `allowlist.toml`), and only for genuinely non-unit-testable entry/bootstrap code (CLI `parseAsync`, `import.meta.url` guards, live-I/O boundaries) — never for ordinary application logic. Every inline ignore must be narrow (single line/branch) and carry a reason naming the invariant that makes the branch unreachable in a passing run; a file accumulating many inline ignores is itself the smell and triggers a refactor. Where the tooling supports it, suppressions carry an owner and an expiry and are enforced in CI — an allowlist no job checks is not a gate.

---

## 5. Net — across all 197 suppressions

| Disposition | Rust lint | Coverage TS | Coverage Rust | **Total** |
|---|---|---|---|---|
| **Vanish via config** (move to table / exclude glob / already-correct) | 18 | 6 | — | **24** |
| **Legit — keep narrow + reasoned** | 11 | 47 | 107 (allowlist, pending renewal) | **165** |
| **Refactor / write tests** | 1 | 6 | — | **7** |
| Repo total | 31 | 59 | 107 | **197** |

**Decisive read:** Only **~7 suppressions represent actual hidden gaps** that need new work — 1 Rust test split + 6 TS repository.ts unit tests, all fixture-only, no infra. **24 evaporate** by moving config-level decisions to config (the 18 clippy allows → workspace table, 6 TS bootstrap guards → 2 exclude globs). The remaining **165 are genuine** by-construction/contract/I/O-boundary exceptions. Two process fixes dominate the risk, not the suppression count: the Rust allowlist is **expired** and the Rust coverage gate is **not run in CI** — fix both or the entire Rust coverage discipline is theatre. Single worst file: `server-2/.../public-stats/repository.ts` (17 ignores); after the 6 tests + c8→v8 migration it settles at 11 genuine SQL-invariant guards.
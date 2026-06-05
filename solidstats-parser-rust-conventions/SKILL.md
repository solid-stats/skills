---
name: solidstats-parser-rust-conventions
description: >
  Prescriptive architecture and coding conventions for the SolidStats Rust OCAP parser
  (replay-parser-2). Defines the crate architecture, the determinism rules (byte-identical
  artifacts), the versioned parser-contract discipline, error handling (thiserror), domain typing,
  malformed-input totality, async/worker rules, and docs/performance — all built on top of the
  repo's already-strict lint floor. Consult before writing or changing any parser Rust; it is the
  rule source that solidstats-parser-rust-code-review enforces and solidstats-parser-rust-tests
  assumes.
  Triggers: "rust conventions", "parser conventions", "edit the parser", "add a parser feature",
  "ocap parsing", "конвенции парсера", "правила rust", "поменяй парсер", "добавь в парсер",
  "разбор ocap".
---

# SolidStats Parser Conventions — Rust / OCAP

These are the **prescriptive** conventions for `replay-parser-2`: the deterministic OCAP-JSON →
artifact parser (CLI + durable worker). They define what good parser code *should* look like; where
current code diverges, the code is brought into line — the convention wins. This skill is the rule
source that [`solidstats-parser-rust-code-review`](../solidstats-parser-rust-code-review/SKILL.md)
enforces and that [`solidstats-parser-rust-tests`](../solidstats-parser-rust-tests/SKILL.md) assumes.

Two rules are non-negotiable and everything else serves them: **(1) the parser is deterministic**
(§C) and **(2) the parser-contract is versioned and stable** (§G). A parser whose output drifts run
to run, or whose artifact shape changes silently, breaks every consumer downstream.

---

## A. Crate architecture

The workspace is five crates, each with one job. Keep logic in the core, keep binaries thin.

| Crate | Responsibility | Depends on |
|-------|----------------|------------|
| `parser-contract` | The versioned `ParseArtifact` envelope, `ParseStatus`, worker messages, and the JSON Schema (schemars + semver). The published contract consumers (server-2 ingest) depend on. | — |
| `parser-core` | Deterministic parsing, normalization, aggregation. Pure logic — no I/O, no clock, no network. | contract |
| `parser-cli` | `clap` binary `replay-parser-2` (Parse / Schema / Worker / Healthcheck). Thin adapter. | core, contract |
| `parser-worker` | Durable RabbitMQ/S3 worker + axum healthcheck + graceful shutdown. | core, contract |
| `parser-quality` | Coverage and fault-report quality gates (build-time, not runtime). | — |

- **`parser-core` is pure and deterministic**: it takes input and returns artifacts/errors with no
  side effects — no clock reads, no filesystem, no network, no randomness. I/O lives in the
  binaries (`cli`, `worker`).
- Dependencies point toward `parser-contract`; binaries depend on `core` + `contract`; nothing
  depends on a binary.
- Binaries hold **no parsing logic** — they wire arguments/transport to `parser-core` and serialize
  the result.

---

## B. The lint floor

The workspace already denies a large surface (`unsafe_code = forbid`, `warnings = deny`,
`missing_docs = deny`, clippy `all`/`cargo`/`nursery`/`pedantic = deny`, plus `unwrap_used`,
`expect_used`, `panic`, `todo`, `unimplemented`, `float_cmp`, `as_conversions`, `integer_division`,
`print_stdout`, `dbg_macro`). These conventions **build on that floor — they do not restate it.**

- A clean `cargo clippy` and `cargo build` (warnings are errors) is a hard gate, not a nicety.
- Never silence a lint with `#[allow(...)]`. Use `#[expect(lint, reason = "…")]` so the suppression
  is justified and fails the build when it becomes unnecessary.
- `unwrap`/`expect`/`panic` are denied — a parser never panics on input (§F); reach for typed errors.

---

## C. Determinism — the headline rule

The same input must produce a **byte-identical** artifact on every run, machine, and process. The
`deterministic_output` test enforces this; every new derived field must preserve it.

- **Ordered output only.** Serialize from `BTreeMap` / sorted `Vec`, never from `HashMap`/`HashSet`
  iteration — their order is randomized per process and will desync artifacts.
- **No nondeterministic sources in derived data.** No `SystemTime`/`Instant`, no `rand`, no env
  reads, no thread-scheduling-dependent ordering feeding anything that lands in the artifact.
- **Floats compare with an epsilon** (`float_cmp` is denied); define a tolerance, don't `==`. Prefer
  integers/fixed-point for derived quantities where feasible.
- **Float *serialization* is deterministic too** — build `serde_json` with the **`float_roundtrip`**
  feature (Ryu shortest round-trip) so an `f64` emits byte-identical text on every architecture.
  Do **not** reach for `arbitrary_precision` for this — it preserves the input *string*, not the value.
- **Integers are overflow-checked** — set `overflow-checks = true` in `[profile.release]`. Release
  mode otherwise wraps silently, turning an overflow on an untrusted count/offset into a
  wrong-but-non-panicking, arch-dependent result; use `checked_*`/`saturating_*` where graceful
  handling is wanted.
- **Canonical form for hashing** *(only if artifact content is ever hashed/signed)* — canonicalize
  per RFC 8785 (JCS), not `BTreeMap` byte order: JCS sorts object keys by UTF-16 code units, which
  diverges from Rust's UTF-8 byte order for non-ASCII keys (they agree while keys stay ASCII).
- **Total, stable ordering.** When you sort, sort by a total key (e.g. a stable id), so equal-looking
  records can't reorder between runs.
- Any new aggregation/normalization step is reviewed against this section and gets a
  `deterministic_output` fixture.

---

## D. Error handling

- **`thiserror` everywhere** — typed error enums per crate (libraries *and* binaries; the repo
  deliberately avoids `anyhow`). One error enum per crate/module surface, variants named for the
  failure.
- Return `Result<T, E>`; propagate with `?`; no match-chain boilerplate.
- **No `panic`/`unwrap`/`expect`** (lint-denied) on any path — malformed input is a typed error
  variant, never a crash (§F).
- Preserve the source: `#[from]` / `#[source]` so the cause chain survives; carry an identifying
  detail (the offending field/offset) in the variant where it helps diagnosis.

---

## E. Types & domain modeling

- **Newtypes over primitive obsession** — `ReplayId(String)`, `SteamId64(String)`, a typed event
  kind, etc. A bare `String`/`u64` for a domain id is a finding.
- **Exhaustive matches** — match every enum variant explicitly; avoid a `_` wildcard that would
  silently absorb a new variant (the parser must consciously handle each OCAP shape).
- **Make invalid states unrepresentable** — encode invariants in the type (type-state / enums) so a
  bad combination doesn't compile, rather than guarding it at runtime.
- Prefer borrows (`&str`, `&[T]`) in signatures; `Cow` when ownership is conditional; pass small
  `Copy` types by value.
- **Conversions** are `From` / `TryFrom` (raw parser output → contract types), never a hand-written
  `Into` / `TryInto` — those come free from the blanket impl (Rust API Guidelines C-CONV).

---

## F. Parsing & malformed input

The parser consumes **untrusted** OCAP JSON. It must be **total** over arbitrary bytes — every input
either parses to an artifact or returns a typed error; nothing panics, hangs, or silently drops data.

- Use `serde` derives; reach for zero-copy (`&str`, `Cow`, `serde_json::value::RawValue`) on hot
  paths where it avoids allocation.
- **Validate at the boundary** and convert violations into typed errors (§D) — never `unwrap` a
  parse, never index without a bounds-aware accessor.
- **Bound the input size.** `serde_json` has no internal size guard, so untrusted bytes from S3 /
  RabbitMQ are read through a cap — `serde_json::from_reader(reader.take(MAX_BYTES))` — and an
  oversized payload is rejected rather than allowed to exhaust worker memory.
- **Respect the recursion limit.** Never enable `serde_json`'s `unbounded_depth` /
  `disable_recursion_limit` on untrusted input — the 128-depth guard prevents stack-overflow DoS on
  adversarial nesting (RUSTSEC-2024-0012). The parse guard does **not** cover recursive `Drop` of a
  deeply-nested value tree, so cap nesting at the boundary if arbitrarily deep input is ever
  legitimate.
- Unknown/extra fields and unexpected shapes are handled deliberately (rejected with a typed error or
  explicitly ignored per the contract) — not a silent default that hides corruption.
- Because totality can't be proven by example tests alone, fuzzing the decode path is **required**
  (see the tests skill) — the convention here is that the decode path is written to *be* fuzzable
  (no panics, bounded work).

---

## G. The parser-contract — versioned & stable

`parser-contract` is the published interface: the `ParseArtifact` envelope, `ParseStatus`, and the
JSON Schemas in `schemas/` that downstream consumers (server-2 ingest) validate against. Treat it
exactly like a public API.

- **Any change to artifact shape is a contract change.** Bump the contract version (`ParserInfo` /
  semver), regenerate the JSON Schema (`Schema` subcommand / schemars), and update the golden
  manifest so `schema_drift_status` stays green.
- **Additive/backward-compatible vs breaking.** Adding an optional field is additive; removing,
  renaming, retyping, or changing the meaning of a field is breaking and requires a version bump
  **and** coordination with the consumer (server-2) — never land a breaking artifact change silently
  (the code-review gate checks this).
- Contract types are documented (`missing_docs` denied) and `#[non_exhaustive]` where future growth
  is expected, so consumers don't break on additive change.
- **Semver is mechanized, not left to review** — `cargo-semver-checks` runs in CI against the last
  published `parser-contract` and fails a PR on a breaking change. (It doesn't yet catch field *type*
  changes like `i64 → String`, so those stay a manual review point.)
- **The JSON Schema is diffed at PR time** — the generated schema is committed and diffed in CI
  (catching a schema break on the PR, not only at publish), and the consumer (server-2) validates
  golden payloads against it.
- **Hide representation behind newtypes** where a contract struct exposes a collection — a
  `Players(Vec<Player>)` newtype lets the storage change without a semver break (C-NEWTYPE-HIDE).
  *(Optional: gate serde/schemars derives behind a `serde` Cargo feature per C-SERDE — usually
  unnecessary here, since the contract crate exists to serialize.)*

---

## H. Async & worker

Applies to `parser-worker` (the `parser-core` logic stays sync and pure).

- **tokio discipline**: never `std::thread::sleep` on an async path; never hold a lock across
  `.await`; honor `Send` bounds; bound concurrency with a semaphore / `JoinSet` rather than
  unbounded spawning.
- **Durability**: the worker coordinates through durable `parse_jobs` state — never fire-and-forget.
  Honor ack/nack semantics, make processing **idempotent** (a redelivered message must not double
  apply), and support **graceful shutdown** (`CancellationToken` / the existing `shutdown.rs`).
- Instrument with `tracing` (structured spans/fields), correlating by `replayId` / `jobId`.
- *(Optional, once an OTLP collector exists)* propagate `traceparent` through the RabbitMQ message and
  export worker spans via `tracing-opentelemetry` / OTLP, so a parse is followable from server-2's
  dispatch span through the worker in one distributed trace.

---

## I. Docs, API hygiene & performance

- `missing_docs` is denied → every public item has a `///` doc (what/how); `//` comments explain
  **why**. `TODO(#issue)` only, never a bare `TODO`.
- `#[must_use]` on functions whose result must not be ignored; `#[non_exhaustive]` on public enums
  expected to grow.
- Static dispatch (generics) by default; `dyn` only for genuinely heterogeneous collections, boxed
  at the boundary.
- **Performance**: profile before optimizing; benchmark only in `--release`; prefer iterators, avoid
  needless `.collect()` and clones in loops, box large enum variants. The `parser-quality`
  cargo-budget gate guards build/size — respect it.

---

## J. Build, supply-chain & CI gates

Beyond the lint floor, the parser's build and dependency graph are gated — a deterministic parser
that publishes a versioned artifact needs an audited, reproducible toolchain.

- **`cargo-deny`** runs all four checks in CI: `advisories` (RustSec DB), `licenses` (an allowlist),
  `bans` (reject duplicate major versions of core deps), and `sources` (crates only from crates.io +
  any trusted private registry — blocks silent git/registry substitution).
- **`cargo-audit`** runs on a nightly schedule against the pinned `Cargo.lock`, catching advisories
  disclosed *between* dependency bumps — complementary to `cargo-deny`'s PR-time check.
- **MSRV** is declared via `rust-version` in `Cargo.toml` and CI-enforced (a job pinned to exactly
  that toolchain); never raised in a patch release.
- **`overflow-checks = true`** in `[profile.release]` (see §C). Consider **`panic = "abort"`** for the
  worker binary *only if* no `Drop`-based cleanup must run on panic — it removes unwind machinery but
  also skips destructors.
- **Reproducible binary** *(when it matters)* — build with `cargo build --locked` and
  `RUSTFLAGS=--remap-path-prefix=$PWD=.` so the artifact-producing binary embeds neither absolute
  paths nor a drifting dependency graph.
- **Benchmark budgets** — the `parser-quality` cargo-budget gate guards size/build; for runtime,
  compare `criterion` baselines across commits (critcmp / Bencher) and fail on a regression beyond a
  threshold.

---

## Testing

Test conventions — the golden/parity harness, required proptest/insta/fuzz, determinism tests, and
the coverage gate — live in
[`solidstats-parser-rust-tests`](../solidstats-parser-rust-tests/SKILL.md), on top of
[`solidstats-process-testing-standards`](../solidstats-process-testing-standards/SKILL.md).

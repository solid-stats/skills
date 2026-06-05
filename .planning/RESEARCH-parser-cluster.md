# Parser cluster — deep-research findings (2026-06-06)

**Method:** the `estesis-process-deep-research` workflow harness (`Workflow` tool) was unavailable
in the session environment, so this was a manual fan-out — 3 parallel web-research agents (sonnet)
over authoritative sources (Rust API Guidelines, serde/serde_json, Rust Fuzz Book, Trail of Bits
testing handbook, proptest/insta docs, RustSec, cargo-deny / cargo-semver-checks). Source-grounded
(URLs + quotes) but **without** the engine's formal quote-provenance / cross-source adjudication.
Confidence below = the agents' source-backed judgment; HIGH = official-docs-backed and on-point.

---

## Folded into `solidstats-parser-rust-conventions` (done, committed)

- **`float_roundtrip`** serde_json feature for cross-arch float *serialization* determinism (not
  `arbitrary_precision`) — §C. [serde_json features]
- **Input-size cap** `from_reader(reader.take(MAX))` + **recursion-limit discipline** (never enable
  `unbounded_depth`; `Drop` of deep `Value` bypasses the parse guard) — §F. [RUSTSEC-2024-0012;
  std::io::Take]
- **`overflow-checks = true`** in `[profile.release]` — §C/§J. [Cargo Book profiles; RustSec]
- **RFC 8785 JCS** note for canonical hashing (UTF-16 order ≠ BTreeMap byte order) — §C, MED.
- **C-CONV** (impl `From`/`TryFrom`, never `Into`) — §E. [API Guidelines]
- **`cargo-semver-checks`** + **PR-time JSON Schema diff** + **C-NEWTYPE-HIDE** + C-SERDE (opt) — §G.
- **§J build/supply-chain:** `cargo-deny` (advisories/licenses/bans/sources), `cargo-audit` nightly,
  MSRV `rust-version` + CI enforcement, `panic="abort"` (conditional), reproducible builds
  (`--locked` + `--remap-path-prefix`), criterion regression budgets.
- **`tracing-opentelemetry`/OTLP** + `traceparent` propagation through RabbitMQ — §H, MED/optional.

## Pending → `solidstats-parser-rust-tests` (fold in when writing)

- **Structure-aware fuzzing** via `arbitrary` (`#[derive(Arbitrary)]`) on the post-parse IR, **plus**
  the raw `&[u8]` decode target. [Rust Fuzz Book — structure-aware-fuzzing] HIGH
- **`cargo fuzz cmin`** + **commit a seed corpus** under `fuzz/corpus/` (seed from golden fixtures).
  [Trail of Bits handbook] HIGH
- **CI fuzz smoke test** (`-max_total_time=300`, nightly) + upload `fuzz/artifacts/` on failure.
  [Rust Fuzz Book — ci] HIGH
- **`cargo fuzz coverage`** as a fuzzing-effectiveness gate (find unreached branches → add seeds).
  [Rust Fuzz Book — coverage] HIGH
- **Commit `proptest-regressions/`** to source control (a found case becomes a permanent fixture).
  [Proptest Book — failure-persistence] HIGH
- **Insta CI enforcement** (`CI=true` auto-fails drift; `--unreferenced=auto`) + **redactions** for
  non-deterministic fields (`sorted_redaction` placed last). [insta.rs docs] HIGH
- **C-DEBUG-NONEMPTY** test for contract types. [API Guidelines] HIGH
- MED/optional: stateful/model-based proptest for worker orchestration; differential fuzz vs a frozen
  reference version; OSS-Fuzz / ClusterFuzzLite (only if the repo is public).

## Pending → `solidstats-parser-rust-code-review` (fold in when writing)

- **Phase-1 gate** signals to add: `cargo-semver-checks` result, the PR-time JSON Schema diff result,
  and `cargo-deny`/`cargo-audit` clean — alongside the contract/determinism checks.
- **Hunt for:** missing input-size cap; disabled serde_json recursion limit; float serialization
  without `float_roundtrip`; `overflow-checks` off in release; missing/committed-out
  `proptest-regressions/`; hand-written `Into`/`TryInto` impls; unbounded process-lifetime state.

## Key sources

- Rust API Guidelines — https://rust-lang.github.io/api-guidelines/ (interoperability, future-proofing, checklist)
- serde_json features / recursion — https://docs.rs/crate/serde_json/latest/features ; https://github.com/serde-rs/json
- RUSTSEC-2024-0012 (deep-nesting stack overflow) — https://rustsec.org/advisories/RUSTSEC-2024-0012.html
- std::io::Take — https://doc.rust-lang.org/std/io/struct.Take.html
- RFC 8785 (JCS) — https://www.rfc-editor.org/rfc/rfc8785.html
- Rust Fuzz Book — https://rust-fuzz.github.io/book/ (structure-aware-fuzzing, ci, coverage)
- Trail of Bits Testing Handbook (cargo-fuzz) — https://appsec.guide/docs/fuzzing/rust/cargo-fuzz/
- Proptest Book — https://proptest-rs.github.io/proptest/ (failure-persistence, state-machine)
- insta — https://insta.rs/docs/ (redactions, settings, advanced)
- cargo-semver-checks — https://github.com/obi1kenobi/cargo-semver-checks
- cargo-deny — https://github.com/EmbarkStudios/cargo-deny ; RustSec — https://rustsec.org/
- Cargo Book profiles / rust-version — https://doc.rust-lang.org/cargo/reference/
- Pactflow schema contract testing — https://pactflow.io/blog/contract-testing-using-json-schemas-and-open-api-part-2/

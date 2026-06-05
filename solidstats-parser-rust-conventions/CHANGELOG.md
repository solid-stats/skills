# Changelog — solidstats-parser-rust-conventions

## 2026-06-06 — Initial
- Authored fresh — there is no estesis Rust doctrine; grounded on the absorbed Rust generics
  (`rust-best-practices`, `rust-async-patterns`, `rust-testing`) plus replay-parser-2's actual stack.
- **Built on the repo's enforced lint floor** (unsafe forbid, no unwrap/expect/panic, clippy
  pedantic/nursery, float_cmp/as_conversions/print_stdout denied, missing_docs denied) — the
  conventions do not restate the lints, they assume them and add the discipline beyond.
- **Two headline rules:** (C) determinism — byte-identical artifacts, ordered output
  (BTreeMap/sorted), no HashMap/SystemTime/rand in derived data, float epsilon; (G) the versioned
  `parser-contract` — semver + regenerated JSON Schema + golden manifest, breaking artifact changes
  coordinated with server-2.
- Crate architecture: pure/deterministic `parser-core`, contract crate as the published interface,
  thin `cli`/`worker` adapters, `parser-quality` gates.
- thiserror everywhere (no anyhow); typed errors; malformed-input totality (the parser never panics
  on untrusted bytes — which is why fuzzing is required); newtypes + exhaustive matches; tokio/worker
  durability + graceful shutdown; docs/perf.
- **Tooling decision (user-ratified): require** proptest / insta / cargo-fuzz — the decode path is
  written to be fuzzable; specifics live in the tests skill.
- Single SKILL.md (the strict lint floor lets it stay compact); testing detail delegated to
  `solidstats-parser-rust-tests`.
- **Deep-research-driven additions** (manual multi-agent web research, authoritative sources):
  determinism — `float_roundtrip` serde_json feature + `overflow-checks` + RFC 8785 JCS note;
  untrusted-input DoS guards — input-size cap (`Read::take`) + serde_json recursion-limit discipline
  (RUSTSEC-2024-0012); contract — `cargo-semver-checks` + PR-time JSON Schema diff + C-NEWTYPE-HIDE;
  new §J build/supply-chain gates — `cargo-deny`/`cargo-audit`/MSRV-CI/reproducible builds; C-CONV;
  optional `tracing-opentelemetry`. Test- and review-level findings recorded in
  `.planning/RESEARCH-parser-cluster.md` for the remaining two skills.

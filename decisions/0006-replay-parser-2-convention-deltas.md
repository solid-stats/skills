# ADR 0006 — replay-parser-2 convention deltas (observability, determinism, worker)

- Status: Accepted (2026-06-13)
- Scope: `solidstats-parser-rust-conventions` (incl. `references/observability-and-lifecycle.md`, `references/determinism-and-contract.md`, `references/worker-build-perf.md`), `solidstats-parser-rust-tests`; mirrors `solidstats-shared-backend-ts-standards` §Z/§AA/§AB
- Supersedes: none

## Context

The Rust parser conventions skill carried no observability/lifecycle doctrine, while the TS
service-side standards had a worked-out §Z/§AA/§AB triad (log hygiene, diagnosability, resource
lifecycle). A `replay-parser-2` worker is a long-lived process consuming RabbitMQ and reading S3;
the absence of a Rust-idiom analog left log-quality and leak findings to reviewer instinct rather
than a citable rule. Three other parser areas needed verification against current practice before
being treated as settled rules: deterministic serialization order under `IndexMap`, the lapin
worker's recovery and concurrency model, and snapshot stability for non-deterministic collections.

The deltas were validated through adversarial, claim-level deep research
(`skills/decisions/research/research-parser.md`) so each rule lands at a known confidence, not as folklore. The
convergence write-up (`skills/decisions/research/architecture-convergence.md` §3) records which existing choices the research
confirmed and which deltas it forced.

## Decision

1. **Add observability/lifecycle §K–§M as a Rust idiom**, in
   `solidstats-parser-rust-conventions/references/observability-and-lifecycle.md`, sourced from
   `skills/decisions/research/drafts/parser-rust-observability-section.md`. §K log hygiene (structured `tracing` fields, no
   format-string concatenation, level semantics, instrumented state transitions, no whole-struct
   dumps, a `parse_job` span correlating `replay_id`/`job_id`); §L diagnosability (swallowed
   `let _ =`/`.ok()` Results, error source-chain preservation via `err = ?e`, identifying context
   on error paths, S3/lapin upstream detail, happy-path legibility); §M resource lifecycle
   (unbounded `Vec`/`HashMap` on worker state, bounded `mpsc` channels, `tempfile` RAII,
   `abort_multipart_upload` on S3 failure). The file opens with a **bidirectional parity header**
   declaring it the mirror of the TS shared-backend §Z/§AA/§AB; the SKILL.md reference map and the
   `worker-build-perf.md` §H `tracing` bullet forward-reference it instead of restating it.

2. **Determinism §C — `IndexMap`-serde warning.** Canonical artifacts serialize from `BTreeMap`
   (or `serde_seq` as a tuple sequence); never rely on `IndexMap`'s default serde, which gives no
   ordering guarantee. Encoded in `references/determinism-and-contract.md` §C alongside the existing
   `BTreeMap`/sorted-`Vec` rule.

3. **Worker §H — lapin recovery and the prefetch≠concurrency split.** Enable
   `ConnectionProperties::default().enable_auto_recover()` and call
   `channel.wait_for_recovery(error).await` on recoverable errors; treat `basic_qos(prefetch_count)`
   as delivery backpressure only, and cap real task concurrency with a bounded semaphore or bounded
   channel. Encoded in `references/worker-build-perf.md` §H.

4. **Confirm, don't change, the workspace and error layering.** The 5-crate workspace
   (`parser-contract`/`parser-core`/`parser-cli`/`parser-worker`/`parser-quality`) and the
   anyhow-free, `thiserror`-in-libraries split (§D) stand as already documented in SKILL.md §A and
   `references/parsing-types-errors.md`; research confirmed both as community consensus.

5. **Tests — insta sorted-redactions note.** `solidstats-parser-rust-tests` gains the rule that a
   snapshot including a `HashSet` or similarly unordered collection sorts at the selector with
   `insta::sorted_redaction()`, kept strictly to **test-only/non-artifact** values — anything in the
   artifact still serializes from ordered structures per §C.

## Rationale

The §K–§M addition closes a real gap: the worker's two logging boundaries (the job handler and the
ack/nack path) plus the CLI's `main` exit-code path cannot see which branch ran, *why* an error was
raised, or errors swallowed before they reach a boundary — §L targets exactly that residue, and §M
targets leaks that short-lived tests never surface, making review the gate. The Rust idiom was
authored as a mirror rather than a fresh doctrine so the two language forms cannot silently diverge;
the bidirectional parity header makes editing one side without the other a review finding (the
anti-drift mechanic the taxonomy recommendation §"Anti-drift mechanics" already mandates for the
§Z/§AA/§AB pair).

The `IndexMap` rule is high confidence — the official IndexMap docs state outright that the default
serde impl serializes as a normal map "with no guarantee that serialization formats will preserve
the order of the key-value pairs." For a parser whose first non-negotiable is byte-identical output,
that is disqualifying; `BTreeMap`/`serde_seq` is the only defensible canonical form. The research
explicitly **refuted** the stronger claim that `serde_seq` "explicitly addresses deterministic
ordering," so the rule is scoped to "deterministic only insofar as insertion order is," not
over-promised.

The lapin deltas are high confidence from the primary source (README + code): `enable_auto_recover`
+ `wait_for_recovery` is the documented recovery path, and `basic_qos` is documented as limiting
*unacknowledged deliveries*, not running tasks — so an application semaphore is mandatory for a true
concurrency cap. Rejected alternative: codifying a graceful `Channel::close()` shutdown pattern —
that claim was refuted on entailment and is left to current lapin API docs rather than written into
the convention.

Insta's sorted-redaction feature is confirmed by insta.rs docs for HashSet-like collections; the
broader "redaction makes snapshots stable" claim was refuted, so the rule is narrowed to the sorted
case only and fenced off from artifact values.

The workspace/error-layering items are medium confidence (community consensus, no primary quote this
run) — strong enough to *confirm and keep* existing code, not strong enough to justify a rewrite,
which is why this ADR records them as confirmations rather than decisions.

## Consequences

- The §K–§M rules and their severity scheme (§M findings default 🟠, escalate to 🔴 on the hot
  delivery path, relax to 🟡 for low-frequency paths; a leak finding must cite all three legs —
  outlives the job, unbounded write path, nothing removes/caps it) live in
  `references/observability-and-lifecycle.md`. They are **not yet wired into
  `solidstats-parser-rust-code-review`**: its Phase 2 sweep and severity table carry no §K–§M rows,
  so observability/lifecycle violations are not caught by review today. Adding those rows is a
  follow-up.
- The TS↔Rust parity contract now has a live obligation: any change to §Z/§AA/§AB or §K–§M must be
  applied to both sides in the same pass. The parser parity header previously missed a "§AB DB-rows
  leg N/A" note (the parser has no DB-row equivalent); that omission was caught and fixed in the
  drafting re-verify (RECOMMENDATION.md §"What was drafted where").
- Code-side follow-ups in `replay-parser-2` (auditing for swallowed Results, unbounded worker-state
  fields, missing semaphore concurrency caps) are not part of this skills pass; they land when the
  reviewer runs against the repo. The convention wins where code diverges.
- Open items left deliberately uncodified, per research caveats: the graceful lapin shutdown close
  pattern (refuted, consult lapin docs), the cargo-fuzz coverage workflow specifics (tooling claims
  refuted, defer to the cargo-fuzz book), and cross-language Rust→TS contract versioning (unverified
  this run — the existing schemars/semver §G contract stands on its own reasoning).

## Sources

- `skills/decisions/research/research-parser.md` — claim-level confidence per delta; the refuted
  set (serde_seq strong claim, `Channel::close()`, cargo-fuzz flags, cross-language versioning).
- `skills/decisions/research/architecture-convergence.md` §3 — applied deltas and confirmed-keep
  list for replay-parser-2.
- `skills/decisions/research/drafts/parser-rust-observability-section.md` — the §K–§M source text
  and placement note.
- `skills/decisions/research/RECOMMENDATION.md` — taxonomy V5, the bidirectional parity mechanic,
  the parser parity-header fix.
- `skills/solidstats-parser-rust-conventions/SKILL.md` and `references/observability-and-lifecycle.md`,
  `references/determinism-and-contract.md` (§C), `references/worker-build-perf.md` (§H),
  `references/parsing-types-errors.md` (§D) — where the decisions are encoded.
- `skills/solidstats-parser-rust-tests/SKILL.md` — the insta sorted-redactions note (Snapshot
  testing section).

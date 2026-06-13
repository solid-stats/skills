# SolidStats skills — deep analysis (2026-06-06)

**Method.** 16 Opus subagents (read-only): each of the 3 conventions skills got 4 lenses
(correctness / gaps-vs-authoritative-sources / coherence / usability); the 2 standards, 3
code-review, and 3 tests skills got 3 grouped audits; plus 1 suite-level coherence pass. Correctness
and gaps lenses verified against authoritative docs (web). Severity: 🔴 critical · 🟠 high · 🟡 medium ·
🔵 low. Status: **FIXED** (applied this pass) / **FLAGGED** (left for the user — judgment/their domain).

**Overall:** the suite is in strong shape. Structural hygiene passes cleanly (naming = dir, EN+RU
triggers on all 11, CHANGELOGs present, README catalog accurate at 11/11, dependency graph acyclic and
resolving, external/absorb claims consistent). Issues are concentrated in a handful of factual errors
and one systemic coherence bug; no skill needed a rewrite.

---

## Systemic (cross-suite)

| # | Sev | Finding | Resolution |
|---|-----|---------|-----------|
| S1 | 🟠 | **Severity-tag mismatch.** All 3 code-review skills say findings "use the severity the rule is tagged with [in conventions]," but conventions carry few/no severity tags (only backend `correctness-and-quality.md` has them; `layers.md`/`schemas-and-data.md`, all parser, all frontend pattern files have none). | **FIXED** — reworded each code-review to "use the severity from the Severity reference table below; the `[conv: …]` citation identifies the rule, not its severity." |
| S2 | 🟡 | **Generic `code review` / `посмотри код` triggers shared by all 3 reviewers** — ambiguous on a stack-less request. Descriptions scope by stack (server-2/Fastify, Rust/OCAP, web/TanStack). | **FLAGGED** — triggering is best tuned with skill-creator's description-optimizer + an eval set, not hand-guessing. Low risk (stack scoping present). |

---

## solidstats-server-ts-conventions

| Sev | Lens | Finding | Resolution |
|-----|------|---------|-----------|
| 🔴 | correctness | `AppealFull.parse(row)` / `AppealCreate.parse(...)` is **Zod, not TypeBox** — TypeBox has no `.parse()`; won't compile. (layers.md + schemas-and-data.md) | **FIXED** — use `Value.Parse(Schema, x)` from `@sinclair/typebox/value`. |
| 🟠 | correctness | `AppError` ctor `constructor(readonly details?){super()}` is incompatible with the documented `throw new XError({…},{cause})`, drops `cause`, and leaves `error.message` empty. | **FIXED** — ctor takes a message + `ErrorOptions{cause}` and forwards to `super`. |
| 🟡 | correctness | `abstract readonly code` re-declared as a mutable subclass field — TS error under ES2022 class fields. | **FIXED** — abstract `code`/`httpStatus` without `readonly`; subclass sets them. |
| 🟡 | correctness | "422 — Fastify/Ajv emits this": Fastify's default validation status is **400**; 422 is a project override. | **FIXED** — wording corrected. |
| 🔵 | correctness | `Tx` type in examples is undefined; Kysely's is `Transaction<DB>`. | **FIXED** — named `Transaction<DB>`. |
| 🟠 | coherence | SKILL.md/CHANGELOG claim "§T–§AB / §A–§AB" but only §Z/§AA/§AB are lettered in `correctness-and-quality.md`. | **FIXED** — refer by name + the real §Z/§AA/§AB; dropped the bogus contiguous range. |
| 🔵 | coherence/usability | CHANGELOG: "code-review skill (not yet built)" — it's shipped. | **FIXED** — removed stale note. |
| 🟡 | usability | Triggers skew HTTP/route; no repository/migration/Kysely/queue (EN+RU). | **FIXED** — added data/infra triggers. |
| 🔴🟠 | gaps | Missing production hardening: rate-limit, helmet/security-headers, CORS allow-list, `bodyLimit`, graceful SIGTERM shutdown, DB pool config, secrets-not-in-error-responses; queue reliability (manual ack, prefetch/QoS, DLQ), idempotency keys; auth/session cookie + Steam-OAuth `state`/CSRF. | **FIXED** — added a "Security & runtime hardening" section + queue-reliability + auth-session rules. (OWASP API Top-10, Fastify docs.) |

## solidstats-server-ts-code-review

| Sev | Finding | Resolution |
|-----|---------|-----------|
| 🟠 | Severity-tag instruction (S1). | **FIXED.** |
| 🔵 | OpenAPI export path asserted as `src/openapi/` as fact. | **FIXED** — softened to "(e.g. `src/openapi/`)". |

## solidstats-parser-rust-conventions

| Sev | Lens | Finding | Resolution |
|-----|------|---------|-----------|
| 🟠 | correctness | **RUSTSEC-2024-0012 misattributed** — it's `serde-json-wasm`, not `serde_json`; the 128-depth default is a serde_json design feature. | **FIXED** — cite serde_json's own recursion limit; dropped the misattributed advisory. |
| 🟠 | correctness | **`float_roundtrip` rationale inverted** — serde_json serializes `f64` via ryu (shortest round-trip) **unconditionally**; cross-arch byte-identical output is already the default. `float_roundtrip` is a *parse-side* precision flag. | **FIXED** — §C reframed: default emission is already deterministic; `float_roundtrip` = parse→re-serialize canonicalization. |
| 🔵 | correctness | "arch-dependent result" for silent overflow is wrong — wrapping is deterministic. | **FIXED** — "silently wrapped, wrong-but-non-panicking." |
| 🔵 | coherence | Severity table rows not in 🔴→🔵 order (in code-review). | **FIXED** — reordered. |
| 🔵 | coherence | "fault-report" (conv §A) vs `fault_injection_regressions` (tests) naming gap. | **FIXED** — linked the terms. |
| 🟠 | usability | The two headline rules (determinism, contract) had **no trigger phrase**; description is a ~90-word feature inventory. | **FIXED** — added determinism/contract triggers (EN+RU); tightened description. |
| 🟡 | usability | Single file ~235 lines; §J/CI + deep mechanics could move to `references/`. | **FLAGGED** — deliberate single-file choice; revisit if it grows further. |
| 🔴🟠 | gaps | Worker/runtime edges: poison-message/DLX + delivery-limit, `basic_qos` prefetch backpressure, `serde(deny_unknown_fields)` default + duplicate-key note, non-finite floats silently → `null`, AWS S3 retry/timeout, stream + content-length cap before download, `JoinSet` drain on shutdown, lapin consumer-cancel/recovery, C-GOOD-ERR error bounds + sealed traits. | **FIXED** — added to §F (serde/S3 cap), §C (non-finite floats), §H (DLX/prefetch/drain/consumer-cancel/S3 timeouts), §D/§E (C-GOOD-ERR/sealed). |

## solidstats-parser-rust-code-review / -tests

| Sev | Finding | Resolution |
|-----|---------|-----------|
| 🟠 | Severity-tag instruction (S1). | **FIXED.** |
| 🟡 | tests: `-max_total_time=300` must follow `--`: `cargo fuzz run <t> -- -max_total_time=300`. | **FIXED.** |

## solidstats-frontend-react-conventions

| Sev | Lens | Finding | Resolution |
|-----|------|---------|-----------|
| 🔵 | correctness | routing.md: how a zod schema reaches `validateSearch` (Standard Schema directly or `@tanstack/zod-adapter`) unstated. | **FIXED** — added the wiring note. |
| 🔵 | correctness | data-flow.md attributes "SSE wiring" to `openapi-fetch` (which has no SSE feature). | **FIXED** — attributed to the client module, not openapi-fetch. |
| 🔵 | coherence | SKILL.md §29 "openapi-typescript + a typed thin client" reads as two peers. | **FIXED** — clarified openapi-fetch *is* the client over openapi-typescript. |
| 🟡 | usability | §17 table lists `project-patterns.md` as if in `references/patterns/`; it's in `references/`. | **FIXED** — path corrected. |
| 🟠 | usability | "new component/feature" triggers can fire review/tests too; no write-vs-review disambiguation. | **FIXED** (light) — description leads with "before writing TS/TSX." |
| 🔴🟠 | gaps | Server **CSP/security headers** + **env/secret-leakage** (`VITE_` prefix, server-only secrets, no module-scope secret reads); **hydration-mismatch** prevention (ISO/epoch + identical formatting); **font-loading** strategy (self-host WOFF2, `font-display`, metric-matched fallback); route **`errorComponent`/`pendingComponent`/`defer`** streaming primitives. | **FIXED** — added `references/patterns/security.md`; hydration rule → localization.md; font rule → performance.md; error/pending/defer → routing.md + errors.md. |
| 🟠 | gaps | **Form library** (TanStack Form vs RHF) for the 5 request steppers; image-upload component depth; ESLint plugin baseline (`@tanstack/*`, `react-hooks`). | **FLAGGED** — library/architecture choices reserved for the user (frontend is their domain). |

## solidstats-frontend-react-code-review / -tests

| Sev | Finding | Resolution |
|-----|---------|-----------|
| 🟠 | Severity-tag instruction (S1). | **FIXED.** |
| 🔵 | code-review: loose path `conventions/references/project-patterns.md`. | **FIXED** — `../solidstats-frontend-react-conventions/…`. |
| 🟡 | tests: `/* v8 ignore next -- <reason> */` may be stripped by esbuild; use `-- @preserve`. | **FIXED.** |

## solidstats-shared-review-standards / -testing-standards

| Sev | Finding | Resolution |
|-----|---------|-----------|
| 🟡 | review-standards §E vs §C: a pure-🔵 review can't APPROVE (only "no findings" → APPROVE), yet 🔵 is "optional." | **FIXED** — "only 🔵 → APPROVE (note optional nits); 🟡 present → REQUEST CHANGES." |
| 🔵 | "blocking I/O on async" listed 🔴; usually 🟠 unless it stalls a hot/shared path. Missing-test rule double-homed §C/§F. | **FLAGGED** — calibration nuance; the "classify by impact" rule already covers it. |

## solidstats-server-ts-tests (suite check)

| Sev | Finding | Resolution |
|-----|---------|-----------|
| 🟡 | Doesn't reference its conventions skill, while parser/frontend tests both "assume" theirs. | **FIXED** — added the conventions reference. |
| 🔵 | Coverage-gate framing differs per stack (backend 100%-reachable, parser high/100% core, frontend CI budgets) but not stated as intentional. | **FIXED** — added a one-line "per-stack by design" note. |

---

## Flagged for the user (judgment / your domain — not changed)

1. **Code-review generic-trigger collision** — tune triggering with skill-creator's description-optimizer + an eval set rather than hand-edits.
2. **Frontend form library** — pick TanStack Form vs React Hook Form for the 5 request steppers (your domain).
3. **Frontend ESLint/TS plugin baseline** — name the concrete plugins (`@tanstack/eslint-plugin-query`/`-router`, `react-hooks`) when you set the config.
4. **Parser conventions single-file vs split** — consider moving §J/CI + deep contract mechanics into `references/` if it keeps growing.
5. **review-standards calibration** — blocking-I/O default severity (🔴 vs 🟠) and the missing-test §C/§F double-home — leave or tweak to taste.
6. **Frontend image-upload depth** (magic-bytes/EXIF/drag-drop a11y) — partly added via security.md; expand in domain-rules if you want a full upload spec.

---

## Resolution — 2026-06-06 (user directives, all applied)

1. **Trigger collision → aggressive triggering by directive.** User wants skills read proactively even
   when maybe-unneeded (standardization > token thrift). Added a "use proactively" clause to all 9
   conventions/code-review/tests descriptions; recorded in AGENTS.md. Standards stay meta.
2. **Frontend form library → TanStack Form** — new `references/patterns/forms.md`.
3. **Frontend lint/format → Vite+** (`vp check`: Oxlint + Oxfmt + tsgo) — `typescript.md` + code-review/
   tests gates.
4. **Parser conventions → split** into spine + `references/{determinism-and-contract, parsing-types-errors,
   worker-build-perf}`.
5. **review-standards calibration → applied** — blocking-I/O 🟠 (🔴 on hot/shared path); missing-test
   severity owned by §F (propagated to backend).
6. **Frontend image-upload → expanded** in `security.md` (magic-bytes, both-side limits, EXIF strip,
   no-SVG, accessible drop-zone/progress, object-URL cleanup, safe external links).

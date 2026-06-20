# v1.2 validation — replays-fetcher@c850190 (2026-06-20)

First **real end-to-end** run of the audit Workflow since v1.1 (v1.2's earlier validation was
mocked-agents only — JS orchestration, not the agent prompts). Run at the v1.1 pilot commit
`c850190` for an apples-to-apples comparison: same target code, same rule-source skills (they are
git-tracked in the repo and revert with the checkout), so only the audit orchestration changed
v1.1 → v1.2.

## Run cost
- **500 agents, 21.27M subagent tokens, ~83 min** (~2× the v1.1 pilot; the new test + edge-case
  lanes account for the growth).
- `meta`: commit `c850190`, `testLaneRan=true`, `structuralLaneRan=true`,
  `opusAdjudications {used 40, skippedByBudget 5, alwaysAdjudicated 22}`.

## Headline numbers
- `bySeverity`: 🔴 0 · 🟠 24 · 🟡 100 · 🔵 211 = **335 findings**.
- architecture 16, mechanical 155, test 88, edgeCase 16.
- v1.1 pilot (same commit): **5 🔴 / 324 findings**.

## The 🔴 5→0 delta — hand-verified, NOT a regression
The v1.1 pilot's five 🔴, re-judged against the real source at `c850190` (hand-read, not via the
Haiku verifier — see methodology note):

| # | span | real? | verdict |
|---|------|-------|---------|
| 1 | `config.ts:198` `value as SourceTransport` (union `"direct"` \| `"ssh"`) | **YES** — casts any non-empty string to the two-member union with no membership check | v1.1 🔴 framing correct; **v1.2 UNDER-graded** to 🟡 `no-unexplained-as-cast` |
| 2 | `discover.ts:128` `JSON.parse(text) as Partial<SourceFixture>` | NO — guarded by `Array.isArray(parsed.candidates)` before use | v1.1 🔴 over-grade; v1.2 🟡 more correct |
| 3 | `golden-fixtures.ts:59` `JSON.parse(readFileSync) as GoldenManifest` | **YES** — unchecked full-shape cast (in a fixture loader that intends to throw) | v1.1 🔴 defensible; **v1.2 MISSED it entirely** |
| 4 | `payload.ts:63` `match.groups as Record<…>` | NO — regex guarantees the named groups on a guarded successful match | v1.1 🔴 over-grade; v1.2 🟡 more correct |
| 5 | `store-raw-replay.ts:40` `calculateSha256(bytes)` | NO — `createHash().update().digest()` is synchronous CPU hashing, not I/O | v1.1 🔴 misclassification (FP); **v1.2 correctly dropped** |

**Net: v1.2 is better on 3/5** (dropped two over-grades + one misclassified FP) **and worse on 2/5**
(under-graded #1, missed #3). The 🔴=0 is mostly a *correction* of v1.1 over-grading, not a loss.

## v1.3 TODO — detection / grading defects
1. **`lsp-contract-compliance` (🔴) under-detects.** The real contract-defeating cast (#1 — cast to a
   literal-union/branded type with no runtime validation) leaked into the milder 🟡
   `no-unexplained-as-cast` rule. The Recall critic itself flagged `lsp-contract-compliance` as
   zero-candidate-suspicious. Widen its `howToDetect` to cover `X as LiteralUnion | Branded` without
   a guard.
2. **Multi-line as-cast detection gap.** #3 (`JSON.parse(readFileSync(...)) as T` spanning three
   lines) was flagged by no rule at all.
3. **Self-contradiction FP.** The `checkpoint/object-key.ts` typed-errors finding states
   `config.ts:26` is "out of scope — do not touch" (a Zod-transform guard), yet a *separate* finding
   flags `config.ts:26` as 🟠 `typed-errors-only`. A cross-finding contradiction/dedup guard is needed.
4. **Type-only-import band findings.** `config.ts:5` `import type { SourceTransport }` is flagged by
   two band rules at once. Decide whether type-only imports get a fence exemption (otherwise
   double-count).

## Methodology note (load-bearing)
The v1.1 spotcheck (Haiku adversarial verifier) reported "all 5 🔴 confirmed real" — but hand-analysis
shows **2 over-grades + 1 misclassification** among those five. Haiku is too lenient on
grading-sensitive (severity / LSP-contract) judgments. Implication: grade 🔴 / LSP findings with Opus,
not a Haiku Verify pass alone. A full v1.2 FP-rate sweep was deliberately **not** run on Haiku for the
same reason; `spotcheck-v1.2.workflow.js` (parameterized via `args.repo` + `args.sample`) is kept for
an Opus-graded re-check if wanted.

## Artifacts (this directory)
- `pilot-v1.2-result.json` — full audit output (335 findings).
- `spotcheck-v1.2-sample.json` — 29-item stratified sample (5 v1.1 🔴 + 24 v1.2-strata findings).
- `spotcheck-v1.2-contested.json` — the 26-item contested subset (mechanical dropped) sent to Opus.
- `spotcheck-v1.2-opus-result.json` — the Opus-graded verdicts (see correction below).
- `spotcheck-v1.2.workflow.js` — parameterized adversarial-verify harness (now `args.model` + bounded concurrency).

## Opus re-check (2026-06-20) — CORRECTS the hand verdicts above

The 26-item contested subset (the 5 v1.1 🔴 + the 21 disputed v1.2 🟠/🟡/architecture/test findings;
mechanical dropped) was re-verified with **model=opus, concurrency 5**. Opus traces consumers and the
actual rule scope, which overturned several hand verdicts — treat this section as authoritative over
the table above.

**v1.1 🔴 — Opus says 1/5 real:**
- `discovery/discover.ts:128` `JSON.parse(text) as Partial<SourceFixture>` — **real (medium)**: the cast
  site asserts an unguaranteed shape (only `Array.isArray` checked). v1.2 catches this at 🟡
  `no-unexplained-as-cast`.
- `config.ts:198` `value as SourceTransport` — **FP**: the value is Zod-validated downstream
  (`z.enum(["direct","ssh"])` + safeParse → `ConfigValidationError`). The hand verdict #1 was WRONG — it
  missed the downstream Zod guard.
- `golden-fixtures.ts:59` — **FP**: test-support code (imported only by golden integration tests,
  `fixtures` marker, depcruise-excluded), not a production 🔴 LSP defeat. The hand "miss" is RETRACTED —
  v1.2 was right not to flag it 🔴.
- `payload.ts:63` `match.groups as …` — **FP**: regex guarantees the named groups; type-safe narrowing.
- `store-raw-replay.ts:40` `calculateSha256` — **FP**: CPU hash, no I/O.

So v1.2's **🔴 5→0 is essentially correct** — v1.1 over-graded; the one genuine issue v1.2 still catches
at 🟡.

**Contested FP-rate: 13/26 (50%)** — byStratum: as-cast 7/7 real (clean), 🟠-orange 5/10, architecture
0/3 (all FP), test 0/1. This is a **deliberately disputed oversample, NOT v1.2's global rate** (the 155
mechanical findings are near-100% precision). Leaked FP classes (v1.3 targets):
1. **Architecture/band over-flagging** — `band-wrong-placement` / `cross-band-type-in-types-dir` on
   type-only imports between same-tier bands and on allowed payload-type consumption (Opus: misapplied
   §A fences; one rejection also cites the code-review skill's band-suspension, which the audit
   deliberately overrides — so this lane is partly grey-zone, but most rejections are substantive).
2. `graceful-shutdown` on resource CONSTRUCTION (`run-once.ts`) — the daemon (`watch.ts`) holds the real
   SIGTERM teardown.
3. `typed-errors-only` inside a Zod `.transform()` throw (`config.ts:26`) caught by safeParse.
4. `test-naming-does-not-start-capital` — logic-inverted (the name DOES start capital).
5. `test-no-paired-test` on an out-of-scope `scripts/` file.

**Methodology, confirmed:** precision ladder Haiku (5/5 reds "real") ≪ hand-analysis ≪ Opus (1/5). The
audit's own **Verify stage is Haiku** → these 🟠/architecture FPs leaked into the 335-finding output.
**v1.3 priority: adjudicate semantic 🟠/architecture findings with Opus, not a Haiku Verify pass alone**,
plus the five rule-scoping fixes.

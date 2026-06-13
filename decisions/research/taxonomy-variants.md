# Skill-Layer Taxonomy — Variants & Debate

**Status:** seed analysis written inline by the orchestrating session; refined by the corpus
audit; then attacked and scored by an adversarial judge panel (results appended at the bottom).

## The problem

The trigger question: *"should the Rust parser depend on `solidstats-shared-backend-ts-standards`,
since it is also backend?"* — and the honest answer under the current model is "the name says yes,
the content says no". The drafted skill is full of TypeScript idiom (functional factories,
const-union enums, ESLint-enforced rules, es-toolkit/day.js/nanoid) that a Rust crate cannot
consume. Meanwhile the precedent is inconsistent in both directions:

- `process-review-standards`, `process-testing-standards`, `process-project-standards` are
  genuinely **cross-stack** (they bind Rust and React too).
- `process-ts-standards` is **TS-only** but carries the same `process-` prefix.

So "process" today means "shared by more than one repo", *not* "shared by all stacks" — but
nothing states that, and `backend` as a scope word collides with the colloquial sense in which the
parser is also "backend".

## Findings that constrain the design (verified tonight)

1. **Utilities duplication.** The es-toolkit / type-fest / day.js / nanoid guidance exists twice:
   `solidstats-server-ts-conventions → correctness-and-quality.md` and
   `solidstats-frontend-react-conventions → references/patterns/typescript.md`. It is tri-repo TS
   content; its single home should be `solidstats-shared-ts-standards`.
2. **Observability doctrine gap in Rust.** §Z (log hygiene), §AA (diagnosability), §AB (resource
   lifecycle) exist only in TS form. `solidstats-parser-rust-conventions` mentions `tracing`
   instrumentation in its worker section but has no logging-hygiene/diagnosability/resource
   doctrine. Whatever taxonomy wins must close or consciously accept this gap.
3. **TS test idioms are mislocated.** Typed builders, `test.each` tables, `@ts-expect-error`
   for invalid input, fake timers live in `solidstats-server-ts-tests` but are needed verbatim
   by fetcher tests (and largely by web tests). They are all-TS content, not backend content.
4. **The two TS services genuinely share a thick band of rules** (naming/factories, typed-error
   base, enums, config discipline, async safety, external adapters, §Z/§AA/§AB) — ~400 lines that
   would otherwise be duplicated between server-2 and fetcher skills.

## Design axes

Every rule has an **audience** (all repos / all TS repos / the two TS services / one repo), an
**abstraction** (doctrine vs stack idiom), and a **function** (conventions / review / tests /
process-meta). The taxonomy question is which of these axes the *skill boundaries* and the
*naming* should encode, and where translation (doctrine → idiom) happens.

---

## V1 — TS-services shared layer ("the evening direction, fixed")

Keep the split-pass structure but rename the shared layer so the name carries its audience:
`solidstats-shared-backend-ts-standards` (or `solidstats-backend-ts-standards`). Parser is *not*
a consumer — by name construction. Rust closes its doctrine gap inside
`solidstats-parser-rust-conventions` (a one-time translated §Z/§AA/§AB section). Utilities move up
to `process-ts-standards`.

```text
process-project-standards          (all repos)
process-review-standards           (all repos — review behavior)
process-testing-standards          (all repos — test doctrine)
process-ts-standards               (all TS repos; + utilities; + TS test idioms)
process-backend-ts-standards       (server-2 + replays-fetcher: naming/factories, error base,
                                    enums, config, async, adapters, §Z/§AA/§AB in TS form)
backend-ts-conventions/review/tests    (server-2 only: Fastify/TypeBox/Kysely/queue/security)
fetcher-ts-conventions/review/tests    (replays-fetcher: ingest boundary; architecture when converged)
parser-rust-conventions/review/tests   (+ new observability/diagnosability section, Rust idiom)
frontend-react-conventions/review/tests (utilities section becomes a pointer)
```

- **Pro:** no duplication between the TS services; honest names; smallest churn from the current
  state; parser stays fully idiomatic (tracing spans ≠ pino fields — the translation is real work
  done once, in its natural home).
- **Con:** read chain for service work is 4 deep (project → ts → backend-ts → repo skill); the
  doctrine exists in two written forms (TS + Rust) that can drift; "backend" still does double
  duty (scope of `backend-ts-conventions` = server-2, scope of `process-backend-ts-standards` =
  both services) unless AGENTS spells it out.

## V2 — Cross-stack service doctrine layer

Introduce `solidstats-process-service-standards`: stack-agnostic doctrine only (error taxonomy,
observability §Z/§AA, resource lifecycle §AB, config fail-fast, external-adapter taxonomy,
graceful shutdown) with **no code samples**, binding server-2, replays-fetcher, *and* the parser
worker. Per-stack conventions translate doctrine → idiom. The TS translation can still be shared
by the two TS services (a thin V1-style layer) or duplicated.

- **Pro:** answers the parser question with "yes — via doctrine"; one home for principles; review
  skills across stacks cite the same §; closes the Rust gap by force.
- **Con:** review needs *evidence gates*, which are idiom-level — a doctrine skill alone is not
  enforceable, so every rule ends up written twice anyway (doctrine + per-stack gate); +1 read on
  every service task in three repos; doctrine changes fan out to N translations; the precedent
  (review/testing standards) works because review *behavior* is genuinely stack-free, while code
  idiom is not.

## V3 — Self-contained per-repo conventions (no shared service layer)

Kill the shared layer. `backend-ts-conventions` stays server-2's; `fetcher-ts-conventions` is
written self-contained, duplicating the shared band in fetcher flavor (worded for a CLI, examples
from its own modules).

- **Pro:** one conventions read per task (+ ts-standards); no chain hops; examples perfectly
  local; trigger precision trivially high.
- **Con:** ~400 duplicated lines between two skills that must not drift (the whole reason the
  evening split existed); contradicts the repo's "absorb once, single source" authoring standard;
  every doctrine fix is a 2–3-file edit with review needed to keep parity.

## V4 — Repo-scoped renaming (audience always explicit)

Rename per-repo families to repo scopes: `solidstats-server2-ts-*`, `solidstats-fetcher-ts-*`,
`solidstats-parser-rust-*`, `solidstats-web-react-*`, with `process-*` reserved for shared layers
(tiered: all / all-TS / TS-services). Naming becomes fully self-describing.

- **Pro:** the scope word never lies again; "backend" ambiguity dies permanently.
- **Con:** renames 9+ skills → install keys break (locks, AGENTS tables, README, memory of every
  consumer); the gain over V1+documentation is mostly cosmetic; "skills not yet really applied"
  lowers the cost, but it is still the largest mechanical churn of all variants.

## V5 — Hybrid: V1 + parity contract (seed recommendation)

V1's structure, plus explicit anti-drift mechanics instead of a doctrine skill:

1. `solidstats-shared-backend-ts-standards` — the TS-services layer (as V1).
2. **Naming rule codified in AGENTS:** the `process-` prefix *means* "meta/shared layer, read by
   other skills, never triggered directly for a coding task; its target segment names the
   audience" (`ts` = all TS repos, `backend-ts` = the two TS services, none = all repos).
   Direct-use skills never carry `process-`.
3. **Parity contract instead of a doctrine layer:** `parser-rust-conventions` gains its own
   observability/diagnosability/resource section in Rust idiom (tracing spans, `Drop`/RAII,
   bounded channels), headed by a one-line note "mirrors §Z/§AA/§AB of
   process-backend-ts-standards — keep in sync". Drift is managed by a named contract, not a
   shared file.
4. **Utilities and TS test idioms move up** to `process-ts-standards` (single home; backend and
   frontend references become pointers).
5. Fetcher trio created per the evening decision pack; backend trio narrows to server-2.

- **Pro:** all of V1's wins; the parser question gets a *principled* answer (doctrine parity, not
  dependency); fixes the two duplication findings; the naming rule is teachable in one sentence.
- **Con:** parity-by-note is weaker than parity-by-file — it relies on review discipline; chain
  depth for service work is still 4 (mitigated: the standards skills are read-on-demand
  references, and `process-backend-ts-standards` replaces content that would otherwise sit inside
  the repo skill anyway — net tokens per task are roughly equal).

---

## Corpus-audit adjustments (post-seed)

The 19-agent audit (`corpus-audit.md`) adds three deltas to the variants above:

- **V2-lite (new sub-variant):** the audit found exactly six draft-layer sections that are
  genuinely language-agnostic (SOLID thresholds, DRY rule-of-three, comments policy, the
  code-quality bug list's portable half, resource-lifecycle three-legs, the swallowed-error
  principle). V2-lite moves *only those* into a slim cross-stack doctrine home (a new tiny
  `process-code-standards`, or a section of an existing cross-stack skill) instead of a full
  doctrine pyramid. Everything else follows V1/V5. Cost: one more read for every stack including
  web; benefit: parser/web inherit the portable doctrine without translation debt.
- **Utilities home corrected:** es-toolkit/type-fest/day.js/nanoid are duplicated in backend +
  frontend conventions and are *not* yet in ts-standards — every variant should converge them
  into `process-ts-standards` (tri-repo TS content).
- **All variants inherit hygiene fixes:** AGENTS skill-tables in all four repos are missing
  locked skills (project-standards, ts-standards); the backend reviewer's severity table is a
  known second source of truth; project-standards' ci-cd reference conflates TS/Rust/infra CI.
  These are migration-plan items regardless of the winner.

## Judge criteria

1. Tokens/reads per typical task (chain depth × file sizes).
2. Trigger precision (does the right skill fire; do meta skills stay quiet).
3. Duplication / drift risk and the mechanism that manages it.
4. Update ergonomics (one rule change touches how many files).
5. Coherence for parser & web (the trigger question must have a clean answer).
6. Migration cost from today's tree (incl. the parked evening draft).
7. AGENTS naming-convention fit (or the cost of changing the convention).
8. Enforceability by the review skills (evidence gates need idiom).

## Judge-panel results (run `wf_400fdfc7-530`; full data: `judge-panel-raw.json`)

**Average rank (4 lens judges): V5 = 1.5 · V1 = 2.75 · V2-lite = 3.0 · V3 = 4.25 · V2 = 4.75 ·
V4 = 4.75 → leader V5.**

| Lens | Ranking (best→worst) | Key point |
|------|----------------------|-----------|
| token-economics | V3, V5, V1, V4, V2-lite, V2 | Pure tokens favor self-contained repo skills; V5 second because the shared layer replaces content the repo skills would carry anyway. |
| drift-maintenance | V2-lite, V5, V2, V1, V4, V3 | The require-graph shared-file mechanism has zero drift findings in this corpus; note-based delegation has three documented failures. V3 is the institutionalized version of duplication finding #1. |
| enforceability | V5, V1, V2-lite, V4, V3, V2 | Every V5 rule lives at idiom level with inline severity tags review skills can gate on (verified against the parked draft); V2's code-free doctrine is unenforceable without per-stack rewrites. |
| migration-pragmatics | V5, V1, V2-lite, V2, V3, V4 | The parked draft is installed in zero consumer repos — renaming it breaks no lock key. V4's 9 renames are the riskiest churn. |

### Breaker report on V5 (4 scenarios) → accepted fixes

1. **Parity contract is one-directional** (Rust note points at TS; nothing points back), and
   note-based parity is the proven-weakest mechanism in this corpus. → Fix: **bidirectional**
   parity headers on §Z/§AA/§AB in *both* skills, naming each other; plus a migration rule —
   any doctrine edit to those sections touches both files or records a TODO in both CHANGELOGs.
2. **New-repo relapse**: a 5th TS service reads "backend-ts-standards" and AGENTS defines the
   audience extensionally. → Fix: AGENTS defines the audience **intensionally** ("every TS
   service-side repo — currently server-2 and replays-fetcher"); a new TS service adopts the
   skill without renaming anything. A second *Rust* repo is the documented trigger to extract a
   rust-standards layer (YAGNI until then).
3. **Fetcher pays a real token increase** (its conventions content moves from a free-ride note
   to a 4-file chain) and a parser agent still sees the word "backend" in the listing. →
   Accepted honestly: the chain reads are on-demand references, the meta skill is
   never directly triggered, and the fetcher previously read the *wrong* (Fastify-shaped) rules —
   correctness beats the token delta. Name keeps `ts` as the excluding token.
4. **Extraction breaks the backend reviewer's `[conv: §X]` citation map.** → Fix: the citation
   rewrite of `backend-ts-code-review` (and the severity-table annotation "derived from
   conventions+standards tags") is a **mandatory same-pass item**, not a follow-up.

**Final verdict: V5 with the four breaker fixes.** V1 remains the fallback (same structure,
weaker anti-drift mechanics); V2/V2-lite rejected (unenforceable doctrine tier / split
checklists); V3 rejected (institutionalizes the corpus's documented failure mode); V4 rejected
(highest churn for cosmetic gain).

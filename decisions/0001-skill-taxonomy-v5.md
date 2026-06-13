# ADR 0001 — Skill taxonomy V5 + the process-/shared- rename

- Status: Accepted (2026-06-13)
- Scope: all SolidStats skills and the four consumer repos (`server-2`, `replays-fetcher`, `replay-parser-2`, `web`)
- Supersedes: the parked evening draft `process-backend-standards`; the level-based `process-` naming model

## Context

The taxonomy was built on a level model where `process-` meant "shared by more than one
repo". That premise broke on a concrete question: should the Rust parser hard-require the
new backend-standards layer, since the parser worker is also "backend"? Under the old name
the answer was yes; under the content it was no. The drafted layer is full of TypeScript
idiom a Rust crate cannot consume — functional factories, const-union enums, ESLint-enforced
rules, es-toolkit/day.js/nanoid — yet the precedent already pointed both ways: `process-review-`,
`process-testing-`, and `process-project-standards` genuinely bind Rust and React, while
`process-ts-standards` carries the identical prefix and is TS-only. So "process" silently
meant two different things, and `backend` as a scope word collided with the colloquial sense
in which `server-2`, `replays-fetcher`, and the parser worker are all "backend". The name lied.

A 19-agent corpus audit (`skills/decisions/research/corpus-audit.md`) over all 14 skills, 4 repos, and the estesis
reference family surfaced the supporting evidence:

- **Utilities duplicated, no canonical home.** es-toolkit / type-fest / day.js / nanoid live
  in both `backend-ts-conventions → correctness-and-quality.md` and `frontend-react-conventions →
  references/patterns/typescript.md` (day.js/nanoid added to both in db37f07; es-toolkit/type-fest
  earlier), and — contrary to one auditor
  claim, corrected by hand — are absent from `process-ts-standards`. Tri-repo TS content with
  no single source.
- **TS test idioms mislocated.** Typed builders, `test.each` tables, `@ts-expect-error` for
  invalid input, and fake timers sit in `backend-ts-tests` but are needed verbatim by fetcher
  tests and largely match what web tests use — all-TS content filed as backend content.
- **A thick shared band between the two TS services.** ~400 lines (naming/factories, typed-error
  base, enums, config discipline, async safety, external adapters, §Z/§AA/§AB) would otherwise
  be duplicated across server-2 and fetcher.
- **Rust observability gap.** No §Z/§AA/§AB analog in `parser-rust-conventions`: `tracing` is
  mentioned in the worker section, but there is no log-hygiene/diagnosability/resource doctrine.
- **AGENTS skill tables out of sync in all four repos**, the fetcher's real stack (pino, zod 4,
  pg, @aws-sdk/client-s3, p-limit, commander; no HTTP framework) genuinely rejects the
  Fastify-shaped backend conventions, and `project-standards → references/ci-cd-pattern.md`
  conflates TS, Rust, and infra CI in one file.

Six taxonomy variants were drafted, audited, then attacked and scored by an adversarial judge
panel (`skills/decisions/research/taxonomy-variants.md`). The fork was between renaming the shared layer so its name
carries its audience (V1/V5), promoting a stack-agnostic doctrine tier (V2/V2-lite),
self-contained per-repo duplication (V3), and a full repo-scoped rename of 9+ skills (V4).

## Decision

Adopt **V5 with its four breaker fixes**; V1 is the documented fallback.

The `process-` prefix is repurposed and renamed to the **`shared-`** segment. It no longer
means "more than one repo" — it now means a meta/shared layer: read by other skills through
their hard-require lists, never triggered directly for a coding task. In a `shared-*` name the
target segment names the **audience**, defined **intensionally** (by the kind of repo, not an
enumerated list): no target = all repos; `ts` = all TypeScript repos; `backend-ts` = TypeScript
service-side repos (the `ts` token excludes the Rust parser). Direct-use skills never carry
`shared-` and take a **role** scope named for what the repo *is* (`server`, `fetcher`, `parser`,
`frontend`), not the ambiguous bare category "backend". This rule is codified in
`AGENTS.md → Naming convention → "The shared- prefix is a meta layer"`.

Concrete layering:

- **Meta layer:** `solidstats-shared-{project,review,testing}-standards` (all repos, unchanged),
  `solidstats-shared-ts-standards` (all TS repos), `solidstats-shared-backend-ts-standards`
  (TS service-side repos).
- **Direct-use layer** (scope = repo/domain): the server / fetcher / parser / frontend trios of
  conventions + code-review + tests.

Key moves, each already encoded in the skills working tree:

- `process-backend-standards` → `solidstats-shared-backend-ts-standards/`; its utilities section
  removed (moved up to ts-standards), audience stated intensionally in `SKILL.md`.
- The server-2 trio's scope segment goes `backend` → `server`
  (`solidstats-server-ts-{conventions,code-review,tests}`).
- A **new fetcher trio** is created for `replays-fetcher`
  (`solidstats-fetcher-ts-{conventions,code-review,tests}`), replacing the wrong Fastify-shaped
  backend rules it previously read.
- Utilities consolidated into `solidstats-shared-ts-standards` (backend + frontend references
  become pointers); TS test idioms added to the same skill.
- `solidstats-parser-rust-conventions` gains an observability/diagnosability/resource section in
  Rust idiom (`references/observability-and-lifecycle.md`, §K–§M).

## Rationale

V5 wins the judge panel (average rank 1.5 vs V1 2.75, V2-lite 3.0, V3 4.25, V2 4.75, V4 4.75).
It gives the parser question a principled answer — doctrine parity, not a dependency — fixes
both duplication findings, and the naming rule is teachable in one sentence. The four lenses:

- **Enforceability (V5 first):** every V5 rule lives at idiom level with inline severity tags the
  review skills can gate on. V2's code-free doctrine tier is unenforceable without per-stack
  rewrites, so each rule ends up written twice anyway (doctrine + per-stack gate).
- **Drift-maintenance (V5 second behind V2-lite):** the require-graph shared-file mechanism has
  zero drift findings in this corpus. V3 is the institutionalized form of the utilities-duplication
  finding and was rejected for that reason.
- **Migration-pragmatics (V5 first):** the parked draft is installed in zero consumer repos, so
  renaming it breaks no lock key. V4's 9 renames are the riskiest churn for a mostly cosmetic gain
  over V1-plus-documentation.
- **Token-economics (V5 second behind V3):** the shared layer replaces content the repo skills
  would otherwise carry, so net tokens per task are roughly flat; the fetcher's real increase
  (free-ride note → 4-file chain) is accepted because it previously read the *wrong* rules and
  correctness beats the token delta.

V2/V2-lite rejected (unenforceable doctrine tier / split checklists); V3 rejected
(institutionalizes the documented failure mode); V4 rejected (highest churn, cosmetic gain).

The four breaker fixes that hardened V5:

1. **Parity made bidirectional.** Note-based parity is the proven-weakest mechanism in this
   corpus, and the original contract pointed only one way (Rust → TS). Fixed with bidirectional
   parity headers: `solidstats-shared-backend-ts-standards` §Z/§AA/§AB name the Rust mirror, and
   `solidstats-parser-rust-conventions/references/observability-and-lifecycle.md` §K–§M name the
   TS source. §M omits the DB-rows leg of §AB — the parser writes no database rows.
2. **Audience defined intensionally**, to defuse the new-repo relapse: a 5th TS service adopts
   `shared-backend-ts-standards` without renaming anything. A second *Rust* repo is the documented
   trigger to extract a `solidstats-shared-rust-standards` layer — YAGNI until then.
3. **Fetcher token increase accepted honestly:** the chain reads are on-demand references, the
   meta skill never triggers directly, and `ts` stays the excluding token in the name.
4. **Backend reviewer citation map rewritten same-pass.** Extraction would otherwise break the
   `[conv: §X]` citations; the rewrite and the "derived from conventions+standards tags"
   annotation on its severity table are mandatory in this pass, not a follow-up.

## Consequences

- **Anti-drift is now a review finding, not a hope.** Editing §Z/§AA/§AB or §K–§M on one side
  without the other is a reviewable defect; any doctrine edit touches both files or records a
  TODO in both CHANGELOGs.
- **Read chain for service work is 4 deep** (project → ts → backend-ts → repo skill). Accepted:
  the standards skills are read-on-demand references and replace content that would otherwise sit
  inside the repo skill.
- **Migration follow-ups** (after sign-off): commit and push the skills repo; rewire consumer
  locks (fetcher swaps the backend trio → fetcher trio + backend-ts-standards; server-2 adds
  backend-ts-standards); sync the AGENTS GSD:skills tables in all four repos, which are out of
  sync today; reinstall via `scripts/update-all-skills.sh`.
- **Deferred, on the documented trigger:** a `solidstats-shared-rust-standards` layer only on a
  second Rust repo; a slim cross-stack `process-code-standards` (V2-lite) only if the parity
  contract demonstrably drifts. Also backlogged: splitting the ci-cd-pattern stack halves out of
  project-standards, and an estesis-style review-feedback learning tier for the family.
- The web repo is a pre-code planning stub, so its frontend skills bind future code only.
- **Same-night sibling decisions.** The 2026-06-13 run also settled three decisions recorded
  separately: server-2 TypeBox→zod 4 ([`0003`](0003-server-2-schema-library-typebox-to-zod.md)),
  the server-2 boundary & testing calls ([`0004`](0004-server-2-boundary-and-testing.md)), and the
  lint/coverage suppression policy ([`0005`](0005-lint-and-coverage-suppression-policy.md)). This
  ADR covers only the taxonomy and the rename.

## Sources

- `skills/decisions/research/RECOMMENDATION.md` — verdict, target taxonomy, codified naming rule, migration plan
- `skills/decisions/research/taxonomy-variants.md` — the six variants, judge-panel ranks, breaker report and the four fixes
- `skills/decisions/research/corpus-audit.md` — 14-skill / 4-repo audit: duplications, gaps, require-graph
- `skills/AGENTS.md` — the codified `shared-` meta-layer rule, intensional audience, and role-scope naming
- Implementing skills (decisions already encoded): `skills/solidstats-shared-backend-ts-standards/` (rename + §Z/§AA/§AB parity header), `skills/solidstats-shared-ts-standards/` (utilities + TS test idioms), `skills/solidstats-fetcher-ts-{conventions,code-review,tests}/` (new trio), `skills/solidstats-server-ts-conventions/` (scope `backend`→`server`), `skills/solidstats-parser-rust-conventions/references/observability-and-lifecycle.md` (§K–§M Rust mirror)

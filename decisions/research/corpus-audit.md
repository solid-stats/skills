# Corpus Audit — all 14 skills, 4 repos, estesis reference family

Produced by a 19-agent workflow (one auditor per skill, one per repo, one for the estesis
family). Raw structured data: `corpus-raw.json`; compacted: `corpus-compact.json`. This file is
the human digest. One auditor claim was checked and corrected by hand (see Utilities below).

## Require-graph today

```text
process-project-standards   (all repos; no requires)
process-ts-standards        (server-2, fetcher, web; no requires)
process-review-standards    (all; no requires)  ← near-verbatim adaptation of estesis-process-review-standards
process-testing-standards   (all; no requires)
process-backend-standards   (DRAFT, tonight) → requires ts-standards

backend-ts-conventions      → ts-standards            | server-2 (+ "fetcher baseline" note)
backend-ts-code-review      → review-standards, backend-ts-conventions
backend-ts-tests            → testing-standards, backend-ts-conventions

parser-rust-conventions     → (none)                  | replay-parser-2
parser-rust-code-review     → review-standards, parser-rust-conventions
parser-rust-tests           → testing-standards, parser-rust-conventions

frontend-react-conventions  → ts-standards            | web
frontend-react-code-review  → review-standards, frontend-react-conventions
frontend-react-tests        → testing-standards, frontend-react-conventions
```

## Stack-specificity profile (sections per class, per auditor judgment)

| Skill | universal | ts-shared | stack | repo |
|-------|-----------|-----------|-------|------|
| process-project-standards | 1 | 1 | 3 | 11 |
| process-ts-standards | — | 3 | 1 | 1 |
| process-review-standards | 7 | — | — | 1 |
| process-testing-standards | 12 | — | — | — |
| process-backend-standards (draft) | 6 | 11 | — | — |
| backend-ts-conventions | 3 | 16 | 8 | 2 |
| backend-ts-code-review | 1 | 1 | 2 | — |
| backend-ts-tests | — | 3 | 3 | 2 |
| parser-rust-conventions | — | — | 4 | 6 |
| parser-rust-code-review | — | — | — | 4 |
| parser-rust-tests | — | — | 4 | 4 |
| frontend-react-conventions | — | 1 | 12 | 6 |
| frontend-react-code-review | 1 | — | 1 | 2 |
| frontend-react-tests | 1 | 1 | 2 | 3 |

Reading: `backend-ts-conventions` is dominated by **ts-shared** content (16 sections) — the
extraction pressure that produced tonight's draft layer is real. The draft layer itself carries
6 sections the auditor judged genuinely language-agnostic (async-safety principle, SOLID, DRY,
code-quality bugs, comments, resource lifecycle) — the V2 "cross-stack doctrine" fuel.

## Confirmed duplications & misplacements

1. **Utility libraries** (es-toolkit, type-fest, day.js, nanoid): duplicated between
   `backend-ts-conventions → correctness-and-quality.md` and
   `frontend-react-conventions → references/patterns/typescript.md` (commit db37f07 added them to
   both). They are **not** in `process-ts-standards` (auditor claimed otherwise; checked by hand —
   ts-standards §A–§E has no utilities section). Tri-repo TS content → single home should be
   ts-standards.
2. **TS baseline restated** in `frontend-react-conventions → typescript.md` (no-any, no-interface,
   noUncheckedIndexedAccess re-stated despite delegation note) and partially in
   `backend-ts-conventions → correctness-and-quality.md → Imports & lint`.
3. **CI conflation**: `process-project-standards → references/ci-cd-pattern.md` mixes TS verify
   job, Rust verify job, Docker/GHCR pattern, and infrastructure SSH-deploy in one file — the
   stack-specific halves belong to stack layers.
4. **Security minimums** (`project-standards §F`: env validation, no secrets in logs) overlap the
   draft backend-standards config discipline.
5. **TS test idioms** (typed builders, `test.each`, `@ts-expect-error`, fake timers) live in
   `backend-ts-tests` but are needed by fetcher tests and largely match what web tests use.
6. **Severity table in backend-ts-code-review** is a second source of truth consolidated from
   conventions tags — known drift surface (CHANGELOG already records one unsatisfiable-instruction
   fix there).

## Gaps

1. **Rust observability**: no §Z/§AA/§AB analog in `parser-rust-conventions` — `tracing` is
   mentioned in the worker section, but there is no log-hygiene/diagnosability/resource doctrine.
2. **AGENTS skill tables out of sync in all four repos**: `process-project-standards` and
   `process-ts-standards` are in every lock + installed, but missing from the GSD:skills tables
   (parser repo: missing project-standards only). Migration must fix the tables regardless of
   variant.
3. **Fetcher's real stack** (pino, zod 4, pg, @aws-sdk/client-s3, p-limit, commander; no HTTP
   framework) — confirmed: Fastify-shaped conventions genuinely don't fit; the "shared baseline"
   note in backend-ts-conventions under-describes the mismatch.
4. SolidStats family lacks estesis's **review-feedback learning loop** tier (capture human review
   corrections → promote to skill patches). Out of scope tonight; worth a backlog line.

## Reference: estesis layering pattern (mature family)

`{project}-{domain}-{stack}-{role}` slugs; `process` = cross-cutting domain; shared standards own
the *contract* (severity scale, format, verdicts) and know nothing about stacks; per-stack
conventions are pure §-lettered rule libraries; reviewers are thin orchestrators that delegate to
both and add only a stack gate + severity table. SolidStats copied the structure; what it has not
copied: the feedback loop and the strict "reviewer = pure delegation" discipline (our severity
tables restate rules).

## Repo facts that matter for architecture work

- `replay-parser-2` is already a 5-crate workspace: `parser-cli`, `parser-contract`,
  `parser-core`, `parser-quality`, `parser-worker`; stack: tokio, lapin, aws-sdk-s3, tracing,
  thiserror, schemars, semver, clap, assert_cmd.
- `server-2` src: `app.ts server.ts config/ infra/ modules/ openapi/ operations/ test/`.
- `replays-fetcher` src: flat capability dirs (`check checkpoint contract-check discovery errors
  evidence logging run source staging storage`) + `cli.ts config.ts`.
- `web` is a pre-code planning stub (no src/ yet) — frontend skills bind future code only.

# Deep Brainstorm Brief — SolidStats Skills Repository

## Context
- Date: 2026-06-05
- Request: Build a central agent-skills repository for SolidStats, adapting the existing `estesis-skills` repo to the SolidStats stack, and absorbing the public/generic skills already vendored across the projects.
- GSD stage: explore → new-project (greenfield tooling repo; no `.planning/` existed before this brief)
- Target outcome: A decision pack that defines the v1 skill set, naming, distribution model, and authoring strategy — ready to feed `gsd:new-project` in the skills repo.
- Artifact owner: Pavlov Alexandr
- Repo: `/home/afgan0r/Projects/SolidGames/skills` — GitHub remote `git@github.com:solid-stats/skills.git`, branch `main`, no commits yet.

## Goal
Create `solid-stats/skills`: a single source of truth for SolidStats AI agent skills, mirroring the `estesis-skills` structure and distribution model (`npx skills` + per-project `skills-lock.json`), but retargeted to the SolidStats stack (TS/Fastify, Rust, React/TanStack) and absorbing the generic pattern-skills currently pulled from public GitHub sources.

## Users And Workflows
- Primary user: the developer (solo, AI-agent-driven via GSD) working across the SolidStats repos.
- Consuming repos: `server-2` (TS/Fastify), `replays-fetcher` (TS/Node), `replay-parser-2` (Rust), `web` (React/TanStack Start, greenfield).
- Workflow: agent scans installed skills before acting; review/conventions/tests skills trigger during code review, planning, and implementation. Skills installed per-repo via `npx skills add solid-stats/skills/<skill>` and tracked in each repo's `skills-lock.json`.

## Scope
### Must Have (v1 — 11 skills)
**Shared standards (2):**
- `solidstats-shared-review-standards` — adapt from `estesis-process-review-standards` (severity buckets, output format, verdict rules, scope discipline, test-file rule, noise filter). Hard-required by all code-review skills.
- `solidstats-shared-testing-standards` — author fresh (no estesis analog). Shared testing philosophy (AAA, isolation, determinism, doubles, placement). Hard-required by all per-stack test skills.

**Backend (TS/Fastify) cluster (3):**
- `solidstats-server-ts-conventions` — prescriptive; absorbs `fastify-best-practices`, `nodejs-backend-patterns`, `api-design-principles`.
- `solidstats-server-ts-code-review` — delegates to review-standards + backend-ts-conventions.
- `solidstats-server-ts-tests` — thin; delegates to testing-standards; absorbs the TS half of `javascript-testing-patterns`.

**Parser (Rust) cluster (3):**
- `solidstats-parser-rust-conventions` — prescriptive; absorbs `rust-best-practices`, `rust-async-patterns`.
- `solidstats-parser-rust-code-review` — delegates to review-standards + parser-rust-conventions.
- `solidstats-parser-rust-tests` — thin; delegates to testing-standards; absorbs `rust-testing`.

**Frontend (React/TanStack) cluster (3):**
- `solidstats-frontend-react-conventions` — prescriptive AND greenfield → doubles as the `web` architecture spec. References `tanstack-start` (kept external).
- `solidstats-frontend-react-code-review` — delegates to review-standards + frontend-react-conventions.
- `solidstats-frontend-react-tests` — thin; delegates to testing-standards.

### Nice To Have
- Replicate full estesis apparatus: `scripts/update-all-skills.sh`, per-skill `evals/`, skill-creator `-workspace` dirs.
- An `infra` cluster (Kubernetes) — out of v1.

### Non Goals
- Porting the process *tools* now: `deep-brainstorm`, `deep-research`, `review-feedback` stay on the estesis source (`ssh://git@git.estesis.tech`). Revisit later.
- Skills for the legacy repos (`replays-parser`, `server`, `sg_*`).
- Absorbing atomic/framework-canonical skills (see Distribution notes).
- Migrating existing project code to match the new conventions (separate effort; see Risks).

## Confirmed Decisions
| Decision | Choice | Rationale | Consequence |
|----------|--------|-----------|-------------|
| Prefix / identity | `solidstats-` | Product name; clear over the short `sg-`. | Every dir, install key, and skills-lock entry uses it. |
| Naming taxonomy | `solidstats-<scope>-<target>-<purpose>` | Mirrors estesis convention. scope∈{backend,frontend,parser,process}; target∈{ts,react,rust,—}; purpose∈{conventions,code-review,tests,review-standards,testing-standards}. | Consistent dir names; standards omit target (cross-cutting). |
| v1 scope | Full suite: 3 conventions + 3 code-review + review-standards + testing-standards + 3 per-stack tests = 11 | User chose to codify conventions as the foundation for review skills (closes the dependency I flagged). | Multi-phase, multi-session build; elicitation-heavy. |
| Conventions authoring | Prescriptive (user dictates; code secondary) | Maximum control over the standard. | Existing server-2/parser code may violate day-1 conventions; web conventions are pure design (no code to mine). |
| Testing structure | Shared `testing-standards` + thin per-stack | Mirrors the review-standards pattern the user likes; DRY. | One extra dependency layer; per-stack skills stay thin. |
| Generics handling | Absorb pattern-skills; keep atomic ones external | "Within reason" — absorb value-add patterns, don't drag framework-canonical references. | See Distribution table for the mapping. |
| Process tools | Not ported now | Stack-agnostic; already used from estesis; no value in duplicating yet. | brainstorm/research/review-feedback remain estesis-sourced. |
| Hosting | GitHub `solid-stats/skills` | Resolves natively via `npx skills`. | skills-lock source = `{"source":"solid-stats/skills","sourceType":"github"}`; install = `npx skills add solid-stats/skills`. |
| Trigger phrases | RU + EN mandatory on every skill | Estesis AGENTS rule; team works in RU context. | Each SKILL.md frontmatter must carry both. |

## Distribution & Tooling Notes
| Topic | Decision/Default | Consuming-repo Consequence | Hidden Cost | Breaking Point |
|-------|------------------|----------------------------|-------------|----------------|
| Source type | GitHub `solid-stats/skills` | `skills-lock.json` entries swap from public sources to `solid-stats/skills` per skill. | Repo must be pushed and reachable (public, or private + auth) before `npx skills update` works elsewhere. | Private repo without CI/agent auth → installs fail. |
| Absorb: `fastify-best-practices`, `nodejs-backend-patterns`, `api-design-principles` | → `solidstats-server-ts-conventions` (+ review checks) | Removed from `server-2`/`replays-fetcher` locks. | Lose upstream updates; must re-check periodically. | Upstream gains a major pattern we miss. |
| Absorb: `javascript-testing-patterns` | → `testing-standards` + `backend-ts-tests` + `frontend-react-tests` | Removed from `server-2`/`replays-parser` locks. | Same drift risk. | — |
| Absorb: `rust-best-practices`, `rust-async-patterns`, `rust-testing` | → `parser-rust-conventions` / `-tests` | Removed from `replay-parser-2` lock. | Same drift risk. | — |
| Keep external (atomic): `tanstack-start`, `openapi-to-typescript` | Stay referenced in `web`/`server-2` locks | No change. | None. | — |
| Keep external (tool-specific): `cargo-fuzz`, `coverage-analysis` | Assumption: stay in `replay-parser-2` lock | No change. | None. | If we want SolidStats-specific fuzz/coverage guidance, fold into `parser-rust-tests`. |
| `kubernetes-specialist` (infrastructure) | Out of v1 scope | No change. | None. | If an infra skill is added later. |

## Assumptions
| Assumption | Confidence | Evidence | How To Validate |
|------------|------------|----------|-----------------|
| Mirror estesis apparatus (README catalog, AGENTS.md, skill-creator in `.agents/skills`, per-skill CHANGELOG, `scripts/update-all-skills.sh`) | High | User mirrors estesis model closely (same prefix pattern, same lock model). | Confirm at scaffold time. |
| `cargo-fuzz` / `coverage-analysis` stay external | Medium | They are tool-specific, not pattern guidance. | Ask during the parser-rust cluster. |
| Legacy repos (`replays-parser`, `server`, `sg_*`) are out of scope | High | Not in the active SolidStats four; `server-2`/`replay-parser-2` supersede them. | Confirm if user wants legacy coverage. |
| Artifact language = English | High | `web/AGENTS.md`: "All project documentation must be written in English only"; estesis docs are English. | — |
| Repo visibility (public vs private) not yet decided | — | Remote exists, nothing pushed. | Open question below. |

## Risks
| Risk | Severity | Why It Matters | Mitigation |
|------|----------|----------------|------------|
| Prescriptive conventions diverge from existing code | High | `backend-ts-code-review` / `parser-rust-code-review` would flag real server-2/parser code as violations on day 1. | Conventions explicitly mark `enforced` vs `legacy-allowed`; or schedule a code-alignment pass per repo. |
| Greenfield frontend conventions guess the architecture | High | `web` has no code; conventions = a bet on TanStack stack shape (state, data, styling, routing). | Treat `frontend-react-conventions` v1 as a living architecture spec; version it; expect revision once `web` takes shape. |
| Scope (11 skills, elicitation-heavy) stalls | Medium | Conventions need real user input per stack. | Ship foundations + backend-ts first (highest value for active server-2 work); defer frontend cluster. |
| Absorbing generics loses upstream updates | Medium | Public skills evolve; absorbed copies freeze. | Record source + absorbed-version in each skill's CHANGELOG; periodic re-check. |
| skill-creator eval batches burn Opus tokens | Low | Fan-out of run/grade subagents is expensive. | Per estesis AGENTS: run eval batches on Haiku/Sonnet; orchestrator can stay on its model. |
| Private GitHub repo blocks installs | Medium | If repo is private, other machines/CI can't `npx skills update` without auth. | Decide visibility + auth recipe before wiring consuming repos. |

## Acceptance Criteria
- Repo has `README.md` (skill catalog), `AGENTS.md` (structure + naming + add/modify rules), naming convention, and skill-creator installed in `.agents/skills`.
- All 11 skills exist; each has `SKILL.md` (frontmatter with RU+EN triggers) + `CHANGELOG.md`.
- Code-review skills hard-require `solidstats-shared-review-standards` + their conventions skill; per-stack test skills hard-require `solidstats-shared-testing-standards`.
- No absorbed generic remains referenced in any consuming repo's `skills-lock.json`; atomic ones (`tanstack-start`, `openapi-to-typescript`, `cargo-fuzz`, `coverage-analysis`) retained.
- Each consuming repo's `skills-lock.json` resolves the relevant `solidstats-*` skills from `solid-stats/skills`.
- Repo pushed to GitHub; `npx skills add solid-stats/skills/<skill>` succeeds from a clean checkout.

## Verification Plan
- Per skill: skill-creator eval batch (cheap model) for trigger accuracy + behavior; manual check of SKILL.md against AGENTS naming/frontmatter rules.
- Integration: in `server-2`, trigger `solidstats-server-ts-code-review` on a known diff; confirm it loads review-standards + conventions. Same for Rust in `replay-parser-2`.
- Wiring: run `npx skills add solid-stats/skills/<skill>` in one repo; confirm install + lock entry resolves against the GitHub source.

## Open Questions
| Priority | Question | Why It Matters | Owner/Status |
|----------|----------|----------------|--------------|
| P1 | Sequence the frontend-react cluster early or last? | Early steers the imminent `web` build; last is safer (riskiest content, benefits from muscle built on backend/rust). | User — at roadmap time. |
| P2 | Replicate evals/workspace dirs + `update-all-skills.sh` now or later? | Authoring ergonomics vs scaffold time. | User — at scaffold. |

### Resolved since first draft
- **GitHub repo public or private?** → **Public.** `npx skills add solid-stats/skills` resolves with no auth from any machine/CI.
- **Refactor existing code vs legacy-allowed?** → **Conventions are enforced strictly (no legacy-allowed tier).** User will bring the existing server-2/parser codebase into line *after* the skills are created and reviewed. Consequence accepted: code-review skills may flag real code until that alignment pass happens.
- **`cargo-fuzz` / `coverage-analysis`?** → **Keep external (atomic tool references); absorb only the *policy*** into `solidstats-parser-rust-tests` (e.g. mandatory fuzz targets on the OCAP decode path, coverage threshold). The skill references the tools rather than re-documenting them.

## Question Ledger
| Priority | Question | Answer | Decision Impact |
|----------|----------|--------|-----------------|
| P0 | Prefix replacing `estesis-`? | `solidstats-` | Names every dir/install key/lock entry. |
| P0 | v1 scope? | Full suite: conventions + code-review per stack + review-standards + unit/integration tests | 11-skill multi-phase build; conventions as foundation. |
| P0 | Generics: absorb or reference? | Absorb pattern-skills "within reason"; keep atomic (tanstack-start, openapi-to-typescript) external | Defined the absorb/keep mapping. |
| P1 | Testing granularity? | Shared testing-standards + thin per-stack | 4 testing skills, mirrors review-standards. |
| P1 | Port process tools now? | None now | brainstorm/research/review-feedback stay estesis-sourced. |
| P1 | Conventions source? | Prescriptive only | Authoring = per-stack elicitation; divergence risk accepted. |
| P1 | Hosting? | GitHub `solid-stats/skills` | GitHub source type; `npx skills add solid-stats/skills`. |

## Recommended Next GSD Step
- **Primary:** `gsd:new-project` in `/home/afgan0r/Projects/SolidGames/skills`.
  - Seed PROJECT.md from this brief; build a ROADMAP that sequences the 11 skills by dependency:
    1. **Scaffold** — README catalog, AGENTS.md, naming convention, skill-creator install, first push to GitHub.
    2. **Foundations** — `review-standards` (adapt from estesis) + `testing-standards` (author fresh). No elicitation; unblocks everything.
    3. **Backend-TS cluster** — conventions (elicit) → code-review → tests. Most existing code to validate against; highest immediate value for active `server-2` work.
    4. **Parser-Rust cluster** — conventions (elicit) → code-review → tests.
    5. **Frontend-React cluster** — conventions (elicit; greenfield → architecture spec) → code-review → tests. Riskiest; sequence per the open question.
    6. **Wiring** — update each consuming repo's `skills-lock.json`; remove absorbed generics; keep atomic ones.
- **Rationale:** This is a greenfield, multi-session, 11-skill build with real dependencies and elicitation-heavy prescriptive conventions. It needs a roadmap that survives context resets and orders work by dependency — exactly what `gsd:new-project` produces. The brief above is the input.
- **Alternatives:**
  - **Lightweight:** skip formal project; scaffold the repo + author skills one-by-one with skill-creator, starting from the two standards. Faster, less tracked — viable if you want to start producing immediately.
  - **Per-stack spec first:** run `estesis-process-deep-brainstorm` (or `gsd:spec-phase`) again, scoped to one stack's conventions, before authoring — because prescriptive conventions are the hard, elicitation-heavy part and benefit from a dedicated pass.

# SolidStats Skills

Reusable AI agent skills for the SolidStats platform (the SolidGames replay-statistics
product). Install a skill into any SolidStats repo — the agent applies it automatically during
code review, planning, and development.

> Skills are agent-agnostic and work with any AI tool that supports the
> [skills.sh](https://www.skills.sh/) format.

These skills target the SolidStats stack: the TypeScript / Fastify backend (`server-2`), the
TypeScript ingest CLI (`replays-fetcher`), the Rust OCAP parser (`replay-parser-2`), and the
React / TanStack Start frontend (`web`).

## Installation

Browse and select from all available skills in this repo:

```bash
npx skills add solid-stats/skills
```

Or install a specific skill directly:

```bash
npx skills add solid-stats/skills/<skill-name>
```

To update skills to the latest version:

```bash
npx skills update            # asks the scope: Project / Global / Both
npx skills update -g         # global skills only
npx skills update -p         # current project's skills-lock.json only
npx skills update -g -p      # both, no prompt
```

To update **all skills everywhere** (global + every project on the machine) in one command:

```bash
bash ./scripts/update-all-skills.sh
```

This runs `npx skills update` for the global lock and every `skills-lock.json` under
`~/Projects`. Run it with `--dry-run` to preview without changes.

## Available skills

The v1 skill set. Status: `Planned` (not started) · `WIP` (in progress) · `Draft` (drafted in
the working tree, pending review) · `Done` (built and reviewed).

### Shared standards

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Project Standards | `solidstats-shared-project-standards` | Done | Universal baseline for all five SolidStats repos (server-2, replays-fetcher, replay-parser-2, web, infrastructure). GSD workflow obligations, session hygiene, git conventions, cross-app boundary map, cross-app compatibility protocol, security minimums, risk management, and documentation language. Auto-triggers on every task; all per-stack skills assume it. Includes CI/CD pipeline reference. |
| TypeScript Standards | `solidstats-shared-ts-standards` | Done | Baseline TypeScript/Node.js standard shared by server-2, replays-fetcher, and web. tsconfig strictness flags, code style (type/no-any/no-as), ESLint 10 baseline, Node 25 + pnpm 11, Prettier, Vitest 4 / V8 coverage gates, utility libraries (es-toolkit, type-fest, day.js, nanoid), TS test idioms. Hard-required by the TS conventions skills; not used standalone. |
| Backend TS Standards | `solidstats-shared-backend-ts-standards` | Draft | Shared standard for TypeScript *backend* repos — audience defined intensionally, currently server-2 and replays-fetcher. Naming/factories, typed-error base, enums, config discipline, external adapters, async safety, process lifecycle, LSP/SOLID/DRY, and the observability doctrine (§Z/§AA/§AB, parity-linked to the parser's Rust mirror). Hard-required by the server and fetcher conventions skills; not used standalone. |
| Review Standards | `solidstats-shared-review-standards` | Done | Shared foundation for every SolidStats code-review skill: severity buckets, report output format, verdict rules, scope discipline, the test-file rule, and the noise filter. Hard-required by all code-review skills; not used standalone. |
| Testing Standards | `solidstats-shared-testing-standards` | Done | Shared testing philosophy for every SolidStats stack: AAA structure, isolation, determinism, test doubles, and file placement. Hard-required by the per-stack test skills; not used standalone. |

### Server — TypeScript / Fastify (`server-2`)

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-server-ts-conventions` | Done | Prescriptive architecture and coding conventions for the `server-2` TS/Fastify backend. Absorbs Fastify, Node, and API-design best practices into one SolidStats standard. |
| Code Review | `solidstats-server-ts-code-review` | Done | Pedantic code review for the `server-2` TS/Fastify backend. Delegates the ruleset to `solidstats-server-ts-conventions` + `solidstats-shared-backend-ts-standards` and the review format to `solidstats-shared-review-standards`. |
| Tests | `solidstats-server-ts-tests` | Done | `server-2` test guidance (unit + integration) on top of `solidstats-shared-testing-standards`. |

### Fetcher — TypeScript CLI (ingest)

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-fetcher-ts-conventions` | Draft | Prescriptive conventions for the `replays-fetcher` ingest CLI: the five-band converged architecture (PROPOSED — pending sign-off), ingest-boundary invariants as fences, Zod config form, and the CLI error boundary (exit codes + run summary). |
| Code Review | `solidstats-fetcher-ts-code-review` | Draft | Pedantic code review for the fetcher. Phase 1 is the ingest-boundary gate (no parsing, write-scope, evidence, idempotency); delegates to `solidstats-fetcher-ts-conventions` and `solidstats-shared-review-standards`. |
| Tests | `solidstats-fetcher-ts-tests` | Draft | Fetcher test guidance on top of `solidstats-shared-testing-standards`: testcontainers (PostgreSQL + MinIO, no RabbitMQ) and the 100% reachable-source gate; TS test idioms inherited from `solidstats-shared-ts-standards`. |

### Parser — Rust

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-parser-rust-conventions` | Done | Prescriptive conventions for the Rust OCAP parser (`replay-parser-2`). Absorbs Rust best-practice and async patterns into one SolidStats standard. Includes the observability & lifecycle reference (§K–§M), parity-linked to the TS doctrine in `solidstats-shared-backend-ts-standards`. |
| Code Review | `solidstats-parser-rust-code-review` | Done | Pedantic code review for the Rust parser. Delegates to `solidstats-parser-rust-conventions` and `solidstats-shared-review-standards`. |
| Tests | `solidstats-parser-rust-tests` | Done | Rust test guidance (unit + integration) on top of `solidstats-shared-testing-standards`; encodes the parser's fuzz/coverage policy (references the external `cargo-fuzz` and `coverage-analysis` tool skills). |

### Frontend — React / TanStack Start

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-frontend-react-conventions` | Done | Prescriptive conventions for the `web` frontend. As `web` is greenfield, this doubles as its architecture contract (state, data, routing, styling). References the external `tanstack-start` skill. |
| Code Review | `solidstats-frontend-react-code-review` | Done | Pedantic code review for the React/TanStack frontend. Delegates to `solidstats-frontend-react-conventions` and `solidstats-shared-review-standards`. |
| Tests | `solidstats-frontend-react-tests` | Done | Frontend test guidance (unit + integration) on top of `solidstats-shared-testing-standards`. |

## Relationship to external skills

Some skills are intentionally **not** vendored here. Framework-canonical or single-tool skills
that carry no SolidStats-specific opinion stay as external references in each consuming repo's
`skills-lock.json`: `tanstack-start`, `openapi-to-typescript`, `cargo-fuzz`, `coverage-analysis`.
The custom skills above reference them rather than duplicating their content. Generic
*pattern* skills (Fastify/Node/API/testing best practices) are absorbed into the `solidstats-*`
skills instead of referenced.

## Contributing

### Adding or improving a skill

The [skill-creator](https://www.skills.sh/anthropics/skills/skill-creator) skill is installed in
this repository (`.agents/skills/skill-creator`). Use it to draft, run evals, benchmark quality,
and improve descriptions — strongly recommended over editing `SKILL.md` by hand.

See [AGENTS.md](AGENTS.md) for the full skill structure, naming convention, authoring standards,
and step-by-step instructions.

In short: use skill-creator, create a directory following the naming convention
`solidstats-<scope>-<target>-<purpose>`, add a `CHANGELOG.md`, write RU + EN trigger phrases, and
add a row to the catalog above.

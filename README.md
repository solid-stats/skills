# SolidStats Skills

Reusable AI agent skills for the SolidStats platform (the SolidGames replay-statistics
product). Install a skill into any SolidStats repo — the agent applies it automatically during
code review, planning, and development.

> Skills are agent-agnostic and work with any AI tool that supports the
> [skills.sh](https://www.skills.sh/) format.

These skills target the SolidStats stack: TypeScript / Fastify backend (`server-2`,
`replays-fetcher`), the Rust OCAP parser (`replay-parser-2`), and the React / TanStack Start
frontend (`web`).

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

The v1 skill set. Status: `Planned` (not started) · `WIP` (in progress) · `Done` (built and reviewed).

### Process — shared standards

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Project Standards | `solidstats-process-project-standards` | Done | Universal baseline for all five SolidStats repos (server-2, replays-fetcher, replay-parser-2, web, infrastructure). GSD workflow obligations, session hygiene, git conventions, cross-app boundary map, cross-app compatibility protocol, security minimums, risk management, and documentation language. Auto-triggers on every task; all per-stack skills assume it. Includes CI/CD pipeline reference. |
| TypeScript Standards | `solidstats-process-ts-standards` | Done | Baseline TypeScript/Node.js standard shared by server-2, replays-fetcher, and web. tsconfig strictness flags, code style (type/no-any/no-as), ESLint 10 baseline, Node 25 + pnpm 11, Prettier, Vitest 4 / V8 coverage gates. Hard-required by solidstats-backend-ts-conventions and solidstats-frontend-react-conventions; not used standalone. |
| Review Standards | `solidstats-process-review-standards` | Done | Shared foundation for every SolidStats code-review skill: severity buckets, report output format, verdict rules, scope discipline, the test-file rule, and the noise filter. Hard-required by all code-review skills; not used standalone. |
| Testing Standards | `solidstats-process-testing-standards` | Done | Shared testing philosophy for every SolidStats stack: AAA structure, isolation, determinism, test doubles, and file placement. Hard-required by the per-stack test skills; not used standalone. |

### Backend — TypeScript / Fastify

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-backend-ts-conventions` | Done | Prescriptive architecture and coding conventions for the TS/Fastify backend (`server-2`, `replays-fetcher`). Absorbs Fastify, Node, and API-design best practices into one SolidStats standard. |
| Code Review | `solidstats-backend-ts-code-review` | Done | Pedantic code review for the TS/Fastify backend. Delegates the ruleset to `solidstats-backend-ts-conventions` and the review format to `solidstats-process-review-standards`. |
| Tests | `solidstats-backend-ts-tests` | Done | Backend test guidance (unit + integration) on top of `solidstats-process-testing-standards`. |

### Parser — Rust

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-parser-rust-conventions` | Done | Prescriptive conventions for the Rust OCAP parser (`replay-parser-2`). Absorbs Rust best-practice and async patterns into one SolidStats standard. |
| Code Review | `solidstats-parser-rust-code-review` | Done | Pedantic code review for the Rust parser. Delegates to `solidstats-parser-rust-conventions` and `solidstats-process-review-standards`. |
| Tests | `solidstats-parser-rust-tests` | Done | Rust test guidance (unit + integration) on top of `solidstats-process-testing-standards`; encodes the parser's fuzz/coverage policy (references the external `cargo-fuzz` and `coverage-analysis` tool skills). |

### Frontend — React / TanStack Start

| Skill | Install name | Status | Description |
|-------|-------------|--------|-------------|
| Conventions | `solidstats-frontend-react-conventions` | Done | Prescriptive conventions for the `web` frontend. As `web` is greenfield, this doubles as its architecture contract (state, data, routing, styling). References the external `tanstack-start` skill. |
| Code Review | `solidstats-frontend-react-code-review` | Done | Pedantic code review for the React/TanStack frontend. Delegates to `solidstats-frontend-react-conventions` and `solidstats-process-review-standards`. |
| Tests | `solidstats-frontend-react-tests` | Done | Frontend test guidance (unit + integration) on top of `solidstats-process-testing-standards`. |

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

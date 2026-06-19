> **Repo:** `skills` — the shared AI-agent skill set for the SolidStats platform (the SolidGames
> replay-statistics product). Each top-level directory is a standalone, installable skill.
>
> **Boundary:** a **supporting** repo (per `solidstats-shared-project-standards` §J) — it owns no
> runtime boundary. It owns only the skill content and its authoring rules: it defines the
> conventions, review, testing, and planning standards the platform repos build by. It does **not**
> hold product source code, migrations, runtime configuration, secrets, or single-developer
> workflows — those live in the consuming repos.
>
> **Shared standards:** project-wide rules live in this same skill set —
> `solidstats-shared-project-standards` (taxonomy, boundary map, doc language) is the baseline every
> repo assumes. See `solid-stats/skills`.

---

# AGENTS.md — SolidStats Skills Repository

This repository stores reusable AI agent skills for **SolidStats** (the SolidGames
replay-statistics platform). Each top-level directory is a standalone skill that can be
installed into any of the SolidStats repos.

Skills are agent-agnostic and follow the [skills.sh](https://www.skills.sh/) format.

SolidStats spans four active repos that consume these skills:

- `server-2` — TypeScript / Fastify backend (PostgreSQL source of truth, APIs, jobs, moderation).
- `replays-fetcher` — TypeScript / Node replay discovery and ingestion staging.
- `replay-parser-2` — Rust OCAP parser (CLI / worker, parser contract).
- `web` — React / TanStack Start frontend.

## What lives here

The authoritative catalog of skills — names and descriptions — lives in
[README.md](README.md). This file does not duplicate it; consult README.md to see which
skills exist and what each does.

This file (AGENTS.md) covers only the rules for *working on* the repo: skill structure,
naming convention, and the add/modify procedures below.

Directories that are **not** skills:

- `*-workspace` — skill-creator workspaces used to develop and iterate on a skill. They have
  no `SKILL.md` and are exempt from the skill structure requirements below.
- `.agents/skills/skill-creator` — the bundled skill-creator tool (tracked in `skills-lock.json`),
  used to draft, evaluate, and improve skills.
- `scripts/` — local maintenance utilities, not skills.
- `.planning/` — planning artifacts (briefs, roadmaps), not skills.
- `decisions/` — architecture decision records (ADRs) for the skill set itself: why the taxonomy,
  per-stack architectures, and cross-stack rules are shaped the way they are. Raw provenance lives
  in `decisions/research/`. Start at [decisions/README.md](decisions/README.md). Per-skill edits
  still go in each skill's `CHANGELOG.md`; an ADR is for a decision that spans more than one skill.

## Skill structure

Every skill is a directory with a `SKILL.md` entry point:

```
<skill-name>/
├── SKILL.md          # Required. Frontmatter (name, description) + skill body.
├── CHANGELOG.md      # Required. History of changes to this skill.
├── workflows/        # Optional. Step-by-step workflow files referenced by SKILL.md.
├── references/       # Optional. Reference files (rubrics, patterns, taxonomies).
├── templates/        # Optional. Output templates.
└── evals/            # Optional. Evaluation cases.
```

`SKILL.md` frontmatter schema:

```yaml
---
name: skill-name          # matches the directory name exactly
description: >
  One-to-three sentence description used by the agent to decide when to trigger this skill.
  Trigger phrases are MANDATORY and must be provided in both English and Russian — the team
  works in a RU context, so RU triggers are required on every skill, no exceptions.
---
```

`CHANGELOG.md` format:

```markdown
# Changelog — <skill-name>

## <version or date> — <short summary>
- What changed and why.
```

## Naming convention

```
solidstats-<scope>-<target>-<purpose>
```

- **scope**: `server`, `fetcher`, `frontend`, `parser`, `infra`, `shared`
- **target**: the stack the skill is tuned to — `ts`, `react`, `rust`, etc.
- **purpose**: what the skill does — `conventions`, `code-review`, `tests`, `review-standards`,
  `testing-standards`, etc.

Examples: `solidstats-server-ts-code-review`, `solidstats-frontend-react-conventions`,
`solidstats-parser-rust-tests`, `solidstats-shared-review-standards`.

The `<scope>` segment is always required. For cross-cutting skills without a specific stack
target (e.g. the shared `solidstats-shared-review-standards`), omit only the target segment —
keep the scope.

### The `shared-` prefix is a meta layer

The `shared-` prefix **means** meta/shared layer: a `shared-*` skill is read by other skills
(via their hard-require lists) and is never triggered directly for a coding task. In a
`shared-*` name the target segment names the **audience**, not a stack:

- no target (e.g. `solidstats-shared-review-standards`) — all repos;
- `ts` (`solidstats-shared-ts-standards`) — all TypeScript repos;
- `backend-ts` (`solidstats-shared-backend-ts-standards`) — TypeScript *backend* repos (the `ts` excludes the Rust parser).
  Currently that is `server-2` and `replays-fetcher`, but the audience is defined intensionally —
  by the kind of repo, not by an enumerated list — so a new TypeScript service adopts the layer
  without any renames.

Direct-use skills carry a **role** scope (`server`, `fetcher`, `parser`, `frontend`) — named for
what the repo *is*, not a bare category like "backend" (ambiguous on its own: `server-2`,
`replays-fetcher`, and the parser worker are all "backend"). The shared tier *does* use `backend`,
but only as the qualified `backend-ts` audience token above, where the `ts` resolves the ambiguity
(the Rust parser is out). Direct-use skills never carry `shared-`. A second Rust repo is the
trigger to extract a `solidstats-shared-rust-standards` layer — not before.

Workspace directories follow the same name as the skill with a `-workspace` suffix.

## SolidStats authoring standards

These are repo-wide rules that shaped the skill set; honor them when adding or editing skills.

- **RU + EN triggers are mandatory** on every skill's `description`. The team works in a RU
  context, so every skill must trigger on both languages.
- **Descriptions are written broad and "pushy."** The team prefers a skill to trigger and standardize
  the code over saving tokens by under-triggering. Each conventions/code-review/tests skill's
  `description` includes a "use this proactively — even when the task doesn't name it" clause; the
  conventions skills say to consult them *before writing any code* in their stack. Over-triggering is
  acceptable. Exception: the `solidstats-shared-*-standards` skills stay meta (read by other skills,
  not triggered directly).
- **Documentation is English only** (SolidStats product standard). Skill bodies, references,
  and templates are written in English; only the trigger phrases carry RU variants.
- **Conventions skills are prescriptive.** A `*-conventions` skill defines the *desired*
  standard for its stack, not a transcript of whatever the code currently does. Existing code
  is brought into line with the convention over time — not the reverse. Mark a rule as enforced;
  do not add a "legacy-allowed" escape hatch unless the user explicitly asks for one.
- **Absorb generic pattern-skills; reference atomic ones.** Value-add pattern guidance (e.g.
  Fastify/Node/API/testing best practices) is absorbed into the custom `solidstats-*` skills so
  the consuming repos depend on one source. Framework-canonical or single-tool skills that carry
  no SolidStats-specific opinion are kept as **external** references in each repo's
  `skills-lock.json`, not duplicated here. Current external-by-design skills:
  `tanstack-start`, `openapi-to-typescript`, `cargo-fuzz`, `coverage-analysis`.
- **Layered review/testing standards.** Code-review skills hard-require
  `solidstats-shared-review-standards` plus their stack's `*-conventions`. Per-stack test skills
  hard-require `solidstats-shared-testing-standards`. Keep the per-stack skills thin; push shared
  philosophy up into the standards skill.

## Adding a new skill

> **Strongly recommended:** use [skill-creator](https://www.skills.sh/anthropics/skills/skill-creator)
> to develop and iterate on skills. It handles drafting, running evals, benchmarking quality, and
> improving the description — significantly faster than editing by hand. It is installed in this
> repository at `.agents/skills/skill-creator`.

> **Run eval batches on a cheap model.** When spawning skill-creator eval runs (with-skill,
> baseline, and grader subagents), use an inexpensive model (e.g. Haiku or Sonnet), not Opus —
> a full eval batch fans out many subagents and burns Opus tokens fast. The orchestrating session
> can stay on whatever model it's using; only the spawned run/grade agents need the cheap model.

1. Use skill-creator to draft and validate the skill.
2. Create a directory following the naming convention above.
3. Add `SKILL.md` with the required frontmatter (RU + EN triggers) and skill body.
4. Add `CHANGELOG.md` with the initial entry.
5. Reference any supporting files from `workflows/`, `references/`, or `templates/`.
6. Add a row to the skills catalog in README.md (the catalog lives only there — do not
   duplicate it in AGENTS.md).
7. Commit and push — the skill is immediately available to anyone who installs it.

## Modifying an existing skill

- Do not change a skill's `name` frontmatter field without also renaming the directory
  and updating README.md — the name is the install key.
- Do not break the skill's documented trigger phrases without updating README.md.
- Prefer additive changes. If a rule needs to be removed, note it as deprecated with a
  reason rather than silently deleting it, so the team can audit existing usages.
- **Always update `CHANGELOG.md`** when modifying a skill.

## Git workflow

Commit messages follow the **Conventional Commits** format:

```
<type>(<scope>): <short description>
```

Common types: `feat`, `fix`, `refactor`, `docs`, `chore`.
Common scopes: `skills`, `conventions`, `docs`.

Example: `feat(skills): add solidstats-shared-review-standards`

**Never commit or push without explicit user instruction.** AI assistants must not
run `git commit`, `git push`, or any destructive git operation unless the user
directly asks for it in the current message.

## Scripts

Maintenance scripts live in `scripts/`. They are **not** skills — they are local dev utilities.

| Script | Purpose |
|--------|---------|
| `scripts/update-all-skills.sh` | Updates global skills and every project's skills on the machine in one pass. Run from any location: `./scripts/update-all-skills.sh`. Supports `--dry-run`. |

## What not to do

- Do not store project source code, migrations, or configuration here.
- Do not add skills that are specific to a single developer's workflow — only team-wide skills.
- Do not commit secrets, tokens, or environment-specific values.
- Do not commit or push autonomously — always wait for explicit user instruction.

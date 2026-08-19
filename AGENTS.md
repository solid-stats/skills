<!-- BEGIN managed by solid-stats/agent-instructions -->
<!-- markdownlint-disable MD013 MD041 -->
<!-- Managed by solid-stats/agent-instructions. Do not hand-edit in a consumer repo — changes
     are overwritten by the next sync PR. Edit the source at
     https://github.com/solid-stats/agent-instructions/blob/master/shared/AGENTS.md instead. -->

## Skills First

Before acting on any user request in this repository, scan available skills by name and description. If any skill has even a small chance of helping any part of the task, use it and read only the relevant instructions before proceeding.

When in doubt, prefer enabling the skill briefly and filtering it out over skipping it.

## Session Hygiene

Every completed work session must leave the repository in a clean, committed state:

- Run `git status --short` at the end of every session. If there are uncommitted changes from
  the work just done, commit them before stopping.
- Do **not** delete or revert completed work to fake a clean status. If the intended work is
  incomplete, ask what to do rather than silently discarding it.
- The rule is: *commit the intended results of the session, not a reset to the previous state.*

## Git Conventions

All commits in every SolidStats repo follow **Conventional Commits**:

```text
<type>(<scope>): <short description>
```

Common types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
Scope: the phase number, feature area, or affected layer (e.g. `feat(17-03): …`,
`fix(ingest): …`, `docs(planning): …`).

**Commit and push are standing, default behavior in every `solid-stats` repo** — no per-message
authorization needed. Session Hygiene above already expects every completed session to end
committed; treat commit + push as part of finishing the work, not a separate ask. This does
**not** extend to anything destructive:

**Absolute rules:**

- `git reset --hard`, force push, `branch -D`, and `rebase` still require an explicit
  instruction from the user in the current message every time — authorization from a previous
  message does not carry forward, and the standing commit/push permission above does not imply
  it.
- Never skip hooks with `--no-verify` or `--no-gpg-sign` unless explicitly asked to. If a
  pre-commit hook fails, fix the underlying issue — the hook is the signal, not the obstacle.
- When a pre-commit hook fails, the commit did not happen. Create a new commit after fixing;
  do not amend the previous one (amending could silently modify work that already shipped).

**Push routing.** The default flow across every `solid-stats` repo is a **direct push to
`master`** — no feature branch, no PR, unless the repo says otherwise below:

- **`server-2`** has a protected `master` — always go through a branch + pull request there,
  never a direct push.
- Any repo that is mid-GSD-milestone follows that milestone's branch flow instead of a direct
  push (`git` config in `.planning/config.json` — `branching_strategy`, `phase_branch_template`,
  `milestone_branch_template`).
- Every other repo and every non-milestone change: commit on `master`, push directly.

## Security Minimums

These rules apply to all code, commits, and logs across every SolidStats repo:

- **Never log, commit, or output:** secrets, API tokens, database connection strings, S3
  access keys, RabbitMQ credentials, raw replay bytes, or unpublished parser artifacts.
- **Never hardcode environment-specific values.** Use environment variables validated at
  startup (e.g. `envalid` for Node, a validated config struct for Rust). Startup should fail
  fast if required env vars are missing or malformed.
- **Before committing:** check that `.env`, `.env.local`, and any file containing credentials
  is either in `.gitignore` or explicitly excluded from the commit. Never commit secrets to
  git history — they are permanent even after deletion.

## Risk Management Protocol

When a request is risky, potentially harmful, or would expand scope beyond the current plan:

1. **Explain the concrete reason** — name the specific risk, the boundary it crosses, or the
   plan it contradicts.
2. **Propose 1–3 safer alternatives** or a GSD plan that achieves the goal without the risk.
3. **Ask for explicit confirmation** before proceeding with anything that falls into these
   categories:
   - Crosses a cross-app boundary (see the boundary map in `solidstats-shared-project-standards` §D)
   - Modifies a high-risk cross-repo contract (API shape, data model, message queue shape, S3
     layout, parser contract, auth/identity shape, moderation workflow)
   - Contradicts an accepted architecture decision in `.planning/PROJECT.md`
   - Deletes, overwrites, or discards completed work
   - Conflicts with current test quality, security rules, or repo structure standards

Do not blindly execute instructions that conflict with architecture, accepted decisions, or
the quality gates in this repo. Challenge, explain, propose alternatives — then wait.

## Documentation Language

Language follows the reader. The test for any doc is: who reads it — a user, or an engineer?

- **Every repo README is bilingual.** A README is the repo's front door, read by users (the
  RU-speaking Solid Games community), not an internal engineering doc. So each repo carries a
  Russian `README.md` (primary) plus an English `README.en.md` mirror, edited together in one
  change so they never drift. This is the same pattern the `.github` org profile already uses
  (`profile/README.md` + `profile/README.en.md`) — the profile is just the org-level README.
- **Everything internal is English only** — code, comments, planning docs, skill bodies and
  references, `AGENTS.md`, and all technical `docs/`. These are read by the people and agents
  building the platform, not by users.
- **GSD workflow responses** (conversations within a GSD session) and replies to the user:
  Russian.
- **Skill trigger phrases** (`description` field in `SKILL.md`): RU + EN mandatory. Every skill
  triggers on both languages — the team works in a RU context.

## MemPalace

Every SolidStats repo has its own MemPalace **wing, named after the repo itself**
(`web`, `server-2`, `replays-fetcher`, `replay-parser-2`, `infrastructure`, `skills`) — use the
generic `mcp__mempalace__*` tools, scoped to that wing; there is no isolated per-project MCP
server here (unlike VocalClub's `vocalclub_memory`). Never file a durable fact into the wrong
repo's wing, and never invent a new wing name.

**Inside a GSD workflow, most of this is already automatic.** The `mempalace` GSD capability
injects recall into `discuss:pre` (gated by `mempalace.recall_on_discuss`) and capture into
`execute:wave:post` (gated by `mempalace.capture_artifacts`), plus a ship-time curator
(`gsd-mempalace-curator`) — see `gsd/common-config.json` for the shared defaults and each
repo's `.planning/config.json` for the rest. Don't re-implement that cycle by hand inside a GSD
phase; the sections below are for everything GSD's own injection doesn't cover — ad-hoc
diagnosis, a non-GSD session, or manual recall/capture outside a phase boundary.

- **Recall before diagnosing or building**, not just when a hook happens to inject a snippet.
  Run an explicit `mempalace_search` seeded from the task's real identifiers (symptom, service
  name, ticket) at the start of the session — a pattern-match to "we just touched this" is not
  recall, and a miss is not proof of absence (follow up with `mempalace_list_drawers` /
  `mempalace_kg_query` before concluding nothing is stored).
- **Capture only durable, verified conclusions** at closure — a decision, a root cause, a
  resolved gotcha — not raw session transcripts, planning artifacts, or GSD's own
  `CONTEXT.md`/`PLAN.md`/`SUMMARY.md` files. Dedup with `mempalace_check_duplicate` before
  filing.
- **`memory_mode` stays `augment`** (GSD's own default): the palace is an additional layer,
  never a replacement for `.planning/graphs/` or `STATE.md`. **Never enable
  `mempalace.recall_on_plan`** — the planner doesn't automatically consume that separate
  recall artifact, so it just produces an orphaned memory read; the top-level coordinator's one
  scoped recall (at `discuss:pre`, or manually for entry points with no native recall hook —
  `gsd-quick`, `gsd-fast`, `gsd-debug`) is the single recall point per task. Specialists and
  subagents don't independently recall or capture — they get a filtered context handoff from
  whichever level already recalled.

### Cross-repo tunnels — use them, don't just avoid duplicating

SolidStats is a genuinely multi-repo platform (§D/§E) — a decision at a cross-app boundary or
contract change routinely concerns two wings at once, unlike VC's setup, which leaves
`cross_project_tunnels` off. Here it should be **on and actually used**, not just a
de-duplication fallback:

- **Create a tunnel** (`mempalace_create_tunnel`) whenever a captured fact genuinely concerns
  two repos — an API/data-model/queue/S3-layout/parser-contract decision (§E's high-risk list)
  almost always does. File the fact once, in the wing of the repo that owns the decision, then
  tunnel it to the other wing(s) it affects instead of duplicating the drawer.
- **Query tunnels during recall, not just search.** A wing-scoped `mempalace_search` alone can
  miss a relevant fact filed under an adjacent repo's wing. Before or alongside recall on a
  cross-app task, run `mempalace_find_tunnels` (between the two wings in play) or
  `mempalace_follow_tunnels` (from the current wing) to surface what's already linked.
- **`mempalace.mirror_kg`** (per-repo, stays local — see below) governs whether decision facts
  also mirror into the temporal knowledge graph; tunnels connect *drawers*, `mempalace_kg_add`
  connects *typed facts* — use whichever fits what's actually being captured, and both where a
  cross-repo decision has both a narrative and a queryable shape (e.g. a validity window).
- **`mempalace.enabled` and `mempalace.cross_project_tunnels`** are common defaults in
  `agent-instructions`' `gsd/common-config.json` — the latter is a deliberate override of
  gsd-core's own default (`false`), because a single-service default doesn't fit a genuinely
  multi-repo platform. The richer per-repo flags (`capture_artifacts`, `mirror_kg`,
  `auto_capture_hooks`) are tuned per repo and stay local — a backend service and a frontend
  repo do not need identical capture behavior.

## MCP / Documentation Lookup

SolidStats development verifies library APIs against **current documentation, never training
data** — training data has a cutoff and may reflect outdated or incorrect APIs. Look the docs
up proactively; don't wait for a type error.

- **Free official sources only:** WebFetch/WebSearch against the library's official docs and
  its `llms.txt`; the repo's `README`/`docs/` via `gh`; GitHub issues/PRs for bug reports and
  migrations. **Do NOT use Context7 or any paid documentation MCP.**
- **Common lookup triggers:** adding a dependency, upgrading a package, using a method you're
  not 100% sure about, hitting an unexpected type error, writing a new integration.
- **When NOT to look it up:** SolidStats-specific code/business logic; a library already
  looked up this session with an unchanged answer; stable standard-library APIs.

Per-repo key libraries to verify against current docs live in each repo's own
`solidstats-*-conventions` skill, not here.
<!-- END managed by solid-stats/agent-instructions -->
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

```text
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

```text
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

- **RU + EN triggers are mandatory** on every **auto-triggering** skill's `description`. The team works
  in a RU context, so every skill Claude can auto-invoke must trigger on both languages. Skills marked
  `disable-model-invocation: true` (see below) are never auto-invoked, so trigger phrases are moot for
  them — keep or drop them freely; they cost nothing either way.
- **Descriptions are written broad and "pushy."** The team prefers a skill to trigger and standardize
  the code over saving tokens by under-triggering. Each conventions/code-review/tests skill's
  `description` includes a "use this proactively — even when the task doesn't name it" clause; the
  conventions skills say to consult them *before writing any code* in their stack. Over-triggering is
  acceptable.
- **Direct-invoke skills set `disable-model-invocation: true` — not a shortened description.** Per the
  Claude Code skills docs, that flag removes the skill's `description` from per-session context
  entirely (the doc's "Description not in context" row), so a skill costs **zero** session tokens until
  it is explicitly invoked — while keeping its **full** description as in-frontmatter documentation. So
  do NOT lobotomize a meta/direct-invoke skill's description to save tokens; set the flag and keep the
  description complete. The skill is still invoked by name (and still read by its hard-requirers via
  file path); Claude simply no longer auto-triggers it. Skills that carry the flag today:
  - the `solidstats-shared-*-standards` skills, which are read by other skills via their hard-require
    list, not triggered directly — **except `solidstats-shared-project-standards`, which stays
    auto-triggering (no flag)** because it is designed to auto-fire at the start of every task;
  - the direct-invoke process wrappers `solidstats-process-repo-convention-audit` and
    `solidstats-process-review-lenses` (run by name from the top-level session; the audit is
    milestone-only, the lenses are recommended by name from the code-review skills).
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

<!-- Separate callouts. -->

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

```text
<type>(<scope>): <short description>
```

Common types: `feat`, `fix`, `refactor`, `docs`, `chore`.
Common scopes: `skills`, `conventions`, `docs`.

Example: `feat(skills): add solidstats-shared-review-standards`

Commit and push policy comes from the managed block at the start of this file.
Do not restate it here; `solid-stats/agent-instructions/shared/AGENTS.md` is the source of truth.

## Scripts

Maintenance scripts live in `scripts/`. They are **not** skills — they are local dev utilities.

<!-- markdownlint-disable MD060 -->

| Script | Purpose |
|--------|---------|
| `scripts/update-all-skills.sh` | Updates global skills and every project's skills on the machine in one pass. Run from any location: `./scripts/update-all-skills.sh`. Supports `--dry-run`. |

<!-- markdownlint-enable MD060 -->

## What not to do

- Do not store project source code, migrations, or configuration here.
- Do not add skills that are specific to a single developer's workflow — only team-wide skills.
- Do not commit secrets, tokens, or environment-specific values.

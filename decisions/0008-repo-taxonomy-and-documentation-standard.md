# ADR 0008 — Repo taxonomy & documentation standard (3 tiers + per-tier doc matrix)

- Status: Accepted (2026-06-19)
- Scope: every repo in the `solid-stats` org; `solidstats-shared-project-standards` (intro, §D first line, §H, new §J); the `.github` org profile
- Supersedes: none (refines the "five-repo platform" framing carried in `solidstats-shared-project-standards` since v1.0)

## Context

A cross-repo + org-level documentation sync surfaced drift that no single repo could resolve on
its own:

- **Repo-count drift.** `solidstats-shared-project-standards` called SolidStats a "five-repo
  platform" (server-2, replays-fetcher, replay-parser-2, web, infrastructure). The `.github` org
  profile listed seven (those five + `plans` + `skills`). Nine repos are actually active — both
  narratives omit `ts-toolchain` entirely. The numbers disagreed because the docs conflated two
  different sets: the *product/platform* and the *org*.
- **Language drift.** §H said "README files: English only," but the org profile is written in
  Russian with an English mirror. The resolution makes all READMEs bilingual (a README serves
  users, not engineers), so the profile was right and §H's blanket English-only rule was the error.
- **Structural gaps.** `web` had no README; `ts-toolchain` had no `AGENTS.md`, `CLAUDE.md`, or
  `LICENSE`; `sg-replay-parser` (superseded by `replay-parser-2`) carried no deprecation notice.

The forks resolved before deciding: how deep the sync goes (one-off fix vs. a codified standard),
which repos are in scope (5 / 7 / 9), and what is canonical when docs disagree. The decision pack
(`plans/product/DOC-SYNC-DEEP-BRAINSTORM.md`) settled them: codify the standard here, cover all
nine repos, and treat the skill as canonical for structure and rules while reality is canonical
for existence facts (which repos exist, what tier they are).

## Decision

**A three-tier taxonomy replaces the flat "five-repo platform" framing.** The platform tier is
still the five services with runtime boundaries (§D unchanged); `plans` / `skills` / `ts-toolchain`
are *supporting* repos; `sg-replay-parser` is *legacy*. This reconciles "5" and "9" honestly:
both are true of different sets, and the boundary map stays scoped to the five it was always about.

**Documentation obligations are per-tier**, encoded as the §J matrix:

- Platform service — bilingual README (`README.md` RU + `README.en.md` EN), `AGENTS.md` (shared
  header + repo body), `CLAUDE.md` stub, `LICENSE`, GSD `.planning/`.
- Supporting — bilingual README, `AGENTS.md` + `CLAUDE.md` stub; `LICENSE` only if it ships reusable
  code (so `ts-toolchain` gets MIT; `plans` / `skills` stay unlicensed process repos); `.planning/`
  optional.
- Legacy — bilingual README with a deprecation banner pointing forward; otherwise frozen.

**Documentation language follows the reader (§H).** A README is the repo's user-facing front door
for the RU-speaking Solid Games community, so every repo README is bilingual — `README.md` in
Russian (primary) plus a `README.en.md` English mirror, edited together so they never drift (the
same pattern the org profile already uses). Everything internal — code, comments, planning docs,
skill bodies and references, `AGENTS.md`, and `docs/` — stays English.

**Secondary calls.** `AGENTS.md` is standardized by a shared header only — never a rewrite of the
working body. Governance (`CONTRIBUTING` / `SECURITY` / `CODE_OF_CONDUCT` / issue + PR templates)
stays centralized in `.github` via GitHub's org-default fallback, not duplicated per repo.
`ts-toolchain` appears on the public profile under Supporting, because the profile must reflect
reality.

## Consequences

- `solidstats-shared-project-standards` v1.3 carries the taxonomy, the matrix, and the refined §H.
  Per-stack convention skills are unaffected.
- Application is a separate, sequenced effort, not part of this ADR: the per-repo doc changes land
  through `gsd-quick` in the platform repos (they have `.claude/gsd-core`) and as plain edits in
  the supporting / legacy repos (which don't); the org profile is updated last. Tracked in the
  decision pack, executed after this standard re-syncs to the vendored copies.
- "Five-repo platform" wording elsewhere (e.g. `plans` `AGENTS.md`, which describes the *product*
  as the five services) stays correct under the new framing — the product is the platform tier; the
  org is the platform tier plus supporting plus legacy.

## Sources

- `plans/product/DOC-SYNC-DEEP-BRAINSTORM.md` — the decision pack: the question waves, the confirmed
  decisions (depth, scope, source-of-truth, taxonomy, language, delivery, license, profile), the
  per-tier matrix, acceptance criteria, and the recommended sequence.
- `plans/product/DOCS-AUDIT-2026-06-17.md` — the prior `plans`-internal staleness audit
  (complementary scope: brief/parity staleness inside `plans`, not cross-repo structure).

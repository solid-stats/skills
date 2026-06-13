# ADR 0005 — Lint & Coverage Suppression Policy

- Status: Accepted (2026-06-13)
- Scope: all TS and Rust SolidStats repos (server-2, replays-fetcher, replay-parser-2, web); encoded in `solidstats-shared-ts-standards §C`, `solidstats-parser-rust-conventions §B`, `solidstats-shared-testing-standards §H`, and the per-stack `-tests` skills
- Supersedes: none

## Context

A suppression — `// eslint-disable-next-line`, `#[allow]`/`#[expect]`, a `/* v8 ignore */`, a `coverage/allowlist.toml` entry — turns a quality gate off for a line, a file, or a rule. Left ungoverned it becomes the path of least resistance: the gate fires, the author silences it, the design problem the gate was pointing at survives untouched. A triage of the three Node/Rust service repos (replay-parser-2, server-2, replays-fetcher) counted 197 such suppressions — clippy plus TS and Rust coverage — and asked, per site, whether each one hides real debt or encodes a real exception.

The answer was lopsided. Across those 197 only ~7 are actual hidden gaps that need new work; ~24 are config-level decisions scattered inline that should live in config once; and ~165 are legitimate by-construction, contract, or I/O-boundary exceptions that are correct to keep. The ESLint disables are a separate inventory (server-2 106 + replays-fetcher 37 = 143) with the same shape, folded in here only as illustration: server-2's 106 are not 106 problems — one `unicorn/no-null: "off"` line deletes 67 of them, a single `*.test.ts` override block clears most of the rest, and the real finite work is splitting ~8 repository god-files. The distribution is the whole argument: the suppression count is not a debt count, and treating every disable as a problem (or every disable as fine) both miss. The fork this ADR settles: what discipline governs adding, keeping, and removing a suppression, so the gate stays meaningful instead of decaying into honor-system noise.

## Decision

One rule, applied to every gate (ESLint, clippy, TS/Rust coverage):

1. Never silence a STRUCTURAL gate. `max-lines`, `max-lines-per-function`, `max-statements`, `complexity`, and the clippy complexity family (`too_many_lines`, `too_many_arguments`, `cognitive_complexity`, `type_complexity`) are design signals — the unit is doing more than one thing. The fix is to split it. A file-level `/* eslint-disable max-lines */` or an `#[expect(clippy::too_many_lines)]` to dodge the work is a banned smell and a review finding, not a fix. The same holds for coverage: a real, reachable branch with semantics gets a test, not an ignore (most need only a new fixture input, not new infrastructure).

2. Configure genuine noise ONCE, at config level, never inline. A rule that fires repeatedly for one codebase-wide reason is a configuration decision: turn it off / tune it in the shared `eslint.config.js` baseline (or, if repo-specific, that repo's config), or move a clippy lint to the workspace `[lints.clippy]` table. Blanket file-level coverage excludes belong in tool config (`vitest.config.ts coverage.exclude`, the Rust `allowlist.toml`) and only for genuinely non-unit-testable entry/bootstrap/live-I/O code. N scattered inline suppressions of the same rule is itself the signal to promote one config line.

3. Keep only narrow, reasoned exceptions inline. The last resort is a per-line suppression — one rule, one line — carrying a one-line reason that names the deliberate exception or the by-construction invariant that makes the branch unreachable in a passing run. In Rust, prefer `#[expect(lint, reason = "…")]` over `#[allow]` so the suppression fails the build the moment it stops being necessary. A disable with no reason, or a file/block scope where a line would do, is a review finding.

For the Rust coverage allowlist specifically, the existing discipline is endorsed as the model the policy intends: each `coverage/allowlist.toml` entry carries an owner/reviewer and an expiry, a co-located `// coverage-exclusion: <reason>` marker, and falls into a legitimate category only (live-I/O boundaries, serde `Visitor` arms, `tokio::select` cancellation races, defensive schema-drift fallbacks). Two hard requirements make it a gate rather than theatre: every entry must stay within a live expiry (a passed expiry is a finding — renew with a fresh owner review, or resolve the gap), and the gate must actually run in CI (an allowlist no job checks is an unread document).

## Rationale

The ~165 legitimate exceptions are why a blanket "no suppressions" rule was rejected: deliberate sequential `no-await-in-loop` against a rate-limited source, a SHA-256-is-always-64-hex `#[expect(expect_used)]`, an 8-field wire-contract constructor that trips `too_many_arguments`, defensive throw guards that are structurally unreachable in a passing run — silencing these is correct, and a policy that forbade them would just push teams to weaker gates. The exception has to survive; what it must not do is hide.

Config-once is also why "every suppression must be inline-justified" was rejected. `unicorn/no-null` fired 67 times across server-2 (ESLint, a separate inventory from the 197) for one reason — null is a contractual value (zod `.nullable()`, nullable columns, pagination bounds). Sixty-seven inline reason comments restating one fact is worse than one `"off"` line in the shared baseline: more noise, more drift, and it obscures the ~7 sites that are real. Config-once concentrates the decision where it can be reviewed once and inherited everywhere; it also keeps the structural-limit carve-out honest, because config is explicitly forbidden from raising a `max-lines`/`max-statements` limit to fit an oversized source file.

The structural-gate carve-out (rule 1) is the load-bearing line. Coverage and complexity numbers are diagnostics, never proof of quality — a high coverage percentage is a floor, not a guarantee, and a complexity limit is a design signal. The moment a team is allowed to silence a structural gate to avoid the refactor it demands, the gate stops measuring anything. So that one class of suppression is non-negotiable: split the god-file, extract the orchestration out of the CLI command, write the six missing branch tests.

The Rust allowlist was endorsed rather than replaced because it already implements the strongest form of the policy — owner, expiry, co-located reason, CI enforcement — and is the template for "where the tooling supports it" in the shared testing standard. Endorsing it surfaced its two live failures (all entries expired; coverage not wired into CI), which is exactly the point: the discipline is well-designed but currently unenforced, and naming the requirements makes the gap a finding instead of a quiet rot.

## Consequences

- The policy is encoded and greppable in four places: the ESLint half in `solidstats-shared-ts-standards §C` (the config-once baseline + the disable policy), the Rust lint half in `solidstats-parser-rust-conventions §B` (`#[expect]`-over-`#[allow]`, complexity-is-a-split, promote-to-workspace-table), the coverage doctrine in `solidstats-shared-testing-standards §H`, and the concrete per-stack mechanism (globs, marker syntax, allowlist fields, CI step) in each `-tests` skill. The Rust lint §B and the coverage §H each cross-reference the TS §C as the canonical statement, so the policy reads the same across stacks.
- The code-review skills enforce it: a structural-limit disable, a blanket file-level disable, a reasonless suppression, or a stale allowlist entry is a finding, and the reviewer points at the split or the shared-config change rather than the suppression.
- This ADR is the policy and the why. The code-side cleanup that brings the repos into line — promoting the ~24 config decisions, writing the ~7 missing tests, splitting the god-files, renewing the expired Rust allowlist entries, and wiring the Rust coverage gate into CI — is tracked as plans backlog, not enumerated here.

## Sources

- `skills/decisions/research/coverage-clippy-triage.md` — per-site clippy + TS/Rust coverage triage; the 197 / 24 / 165 / 7 tally and the Rust allowlist state (expired, not in CI)
- `skills/decisions/research/eslint-disable-triage.md` — server-2 + fetcher disable inventory; config / keep / refactor split
- `skills/decisions/research/gate-suppression-backlog.md` — consolidated code-side cleanup backlog (config-once, missing tests, god-file splits, Rust process fixes)
- `skills/decisions/research/RECOMMENDATION.md` — V5 sign-off; the policy's home sections and the "never silence a structural gate / configure noise once / narrow reasoned exceptions" framing
- `skills/solidstats-shared-ts-standards/SKILL.md §C`, `skills/solidstats-parser-rust-conventions/SKILL.md §B`, `skills/solidstats-shared-testing-standards/SKILL.md §H`, and the per-stack `solidstats-*-tests` skills — where the policy is encoded

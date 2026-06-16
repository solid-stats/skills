# ADR 0007 — Borrowed GSD process improvements: plan provenance, review lenses, graphify-in-workflow

- Status: Accepted (2026-06-16)
- Scope: new `solidstats-shared-planning-standards`; new `solidstats-process-review-lenses` (trigger wrapper + bundled fan-out Workflow); `solidstats-shared-review-standards` (§I discovery, §J review lenses); the four reviewers (`solidstats-server-ts-code-review`, `solidstats-fetcher-ts-code-review`, `solidstats-parser-rust-code-review`, `solidstats-frontend-react-code-review`); README catalog
- Supersedes: none

## Context

A BMAD-METHOD evaluation (`plans/product/BMAD-EVALUATION-AND-GSD-IMPROVEMENTS.md`) concluded **stay on
GSD, do not migrate**, and approved borrowing two BMAD ideas as skill/config edits (decisions D2/D3).
Separately, the GSD tooling backlog (`plans/product/GSD-IMPROVEMENTS.md`) carried item **C6**: the
`graphify` knowledge graph gets built per repo but GSD never consults it — the capability ships empty
`steps`/`contributions`, so the graph sits idle as a manual artifact.

All three land through the **same lever**: the `agent_skills` injection that already folds the
`solidstats-shared-*` standards into GSD's planning and review agents. That lets us wire the
improvements in **without forking gsd-core** — the heavier alternative (editing the `graphify`
capability descriptor, ADR-857) stays available but is not required to make the graph pull weight.
Both source docs draw this parallel explicitly. This ADR records the skill-side decisions; the per-repo
`.planning/config.json` wiring (provenance-skill injection, plan-checker checklist) is a consumer-repo
follow-up tracked outside this repo. The parallel-subagent fan-out ships **here**, at the invocation
layer, as the `solidstats-process-review-lenses` skill — not as a gsd-core change.

## Decision

1. **New foundation skill `solidstats-shared-planning-standards`** (BMAD Improvement 1, D2 + the
   planning half of C6). A meta layer read by the planning agents (`gsd-planner`,
   `gsd-plan-checker`, `gsd-executor`, discuss), mirroring `solidstats-shared-review-standards` /
   `solidstats-shared-testing-standards`. It owns:
   - **§A source anchors** — `[src: file#anchor]` (also `[src: graph:<community>]`,
     `[src: SUMMARY.md#deviations]`) on every load-bearing premise, in the reviewers' `[conv: …]` /
     `[std: …]` citation idiom. An unanchored load-bearing claim is the signal to make it a premise.
   - **§B premises ledger** — `claim` + `src` + a one-line `verify` command the plan-checker runs,
     distinct from `must_haves.truths` (premises are inputs; truths are post-conditions). This is the
     fix for the "false premise propagates silently into a broken migration" failure mode (BMAD #2003).
   - **§C carried-forward learnings** — cite the prior phase's `*-SUMMARY.md#deviations` as a stated
     premise rather than background.
   - **§D consult the knowledge graph (C6)** — gated on `graphify.enabled`; at discuss/plan, query the
     graph for the phase topic and fold the community + blast radius into `<context>`/premises; refresh
     (`graphify update .`) after execution. The skill-injection route is the bridge; the gsd-core
     descriptor patch is the heavier alternative.
   - **§E wiring** — inject into `agent_skills` for the planning agents per repo; add a plan-checker
     spot-verify checklist item. Additive: a plan with no anchors still plans.

2. **Named adversarial review lenses** in `solidstats-shared-review-standards` **§J** (BMAD
   Improvement 2, D3). Three lenses as distinct adversarial mandates — **Contract Adversary**,
   **Edge / Failure Hunter**, **Acceptance Auditor** — all reporting into the *same* format (§C
   buckets, §D continuous numbering, one §E verdict). Each lens records what it attacked and ruled out
   under **Non-Findings Checked** (§D). SolidStats **rejects** BMAD's "zero findings → halt / forced
   finding" rule (it fights the §G noise filter). Lens count is depth-tied: a single pass for
   `/gsd-quick`, parallel-subagent lenses for deep reviews (the fan-out + dedup run at the invocation
   layer via the `solidstats-process-review-lenses` skill/Workflow — never in the vendored GSD review
   commands; see Consequences). Each reviewer maps the three generic lenses onto its own Phase-1 gate and
   risk order.

3. **GSD-sync discovery step** in `solidstats-shared-review-standards` **§I** (adapted from
   `estesis-frontend-react-vc-code-review/references/gsd-sync.md`) + the **review half of C6**. A
   conditional pass that runs after scope (§B), before the convention sweep:
   - **§I.1 self-discovery** of the planning context — branch slug → handoff/state → file overlap;
     ambiguity rule = exactly one confident match or list candidates and ASK, never guess.
   - **§I.2 map the change onto the codebase** — the **structural/role map** `.planning/codebase/`
     (`STRUCTURE`/`ARCHITECTURE`/`INTEGRATIONS`/`CONCERNS`/…) for layer placement and known-risk areas,
     plus the **dependency/blast-radius map** (the knowledge graph `.planning/graphs/` + intel) for what
     depends on the changed files. This is the review half of C6 — the reviewer consults the graph, not
     just the planner — and it turns §B's "code the change relies on" from a guess into a map-derived
     fact that feeds the Contract Adversary / Edge-Failure lenses.
   - **§I.3 code-vs-PLAN contract check** — `files_modified` scope drift, `must_haves`
     artifacts/key-links/truths, `requirements`, and SUMMARY/REVIEW/VERIFICATION claim reconciliation;
     truths are semantic (unconfirmable → Validation Gaps), direction of truth is neutral (a code↔PLAN
     mismatch is never an automatic BLOCK), read-only on `.planning/`, tagged `[gsd-plan]`/`[gsd-claim]`.

4. **Additive, no renumbering.** The new review-standards sections are appended as §I/§J; §A–§H are
   untouched, so the reviewers' `§C`/`§D`/`§E`/`§F` cross-references and every other skill that cites
   them keep resolving. Each touched skill records the change in its own CHANGELOG; the README catalog
   gains the planning-standards row and notes the discovery step + lenses on the review-standards row.

## Rationale

The two BMAD ideas are the parts of BMAD that survived the evaluation: self-contained, citation-bearing
stories (→ provenance) and parallel adversarial review layers (→ lenses). Both fix a *traceability /
blind-spot* gap, not a detail gap — a `PLAN.md` is already detailed; what it lacks is anchored premises a
checker can re-open, and a single reviewer that argued the code correct is poorly placed to find how it
breaks. The lenses adopt BMAD's diversity and its mandate-as-evidence (recorded in Non-Findings Checked)
but **not** its forced-finding rule, because a manufactured finding spends developer trust — the family's
§G noise filter outranks it.

C6 is wired through the same skill-injection lever rather than a gsd-core fork because that is the
reversible, no-fork path both source docs point to, and because the graph is genuinely two maps with two
consumers: the planner needs it to place work and enumerate blast radius up front (§D), and the reviewer
needs it to bound scope and drive the Contract/Edge lenses (§I.2). Folding C6 into the planning and review
standards keeps the family lean (one foundation per concern) instead of minting a standalone graph skill
for a single injection rule.

The discovery step is adapted, not invented: the estesis frontend reviewer already proved the
self-discovery heuristic and the neutral direction-of-truth contract. Promoting it into the **shared**
standard means all four SolidStats reviewers inherit it for free, and it is the prerequisite the
Acceptance Auditor lens depends on — discovery finds the plan, the lens audits the code against it.
Making `.planning/codebase/` a first-class map source (alongside the graph) reflects that GSD already
maintains an authored structural map per repo; a reviewer that ignores it re-derives placement and risk
by hand.

## Consequences

- **Provenance wiring is per-repo and pending; the lens fan-out ships here.** Provenance and the
  graph-consult step take effect only once `solidstats-shared-planning-standards` is injected into the
  planning agents' `agent_skills` in each repo's `.planning/config.json`, and the plan-checker gains the
  spot-verify checklist item — a consumer-repo follow-up. The lens fan-out (P3), by contrast, ships in
  this pass as the invocation-layer `solidstats-process-review-lenses` skill (its bundled Workflow: one
  subagent per lens at deep depth + a merge/dedup step); the vendored `gsd-code-review` / `gsd-verifier`
  are explicitly **not** its home, because they are re-vendored on update.
- **Single-pass works today.** The lenses function immediately as named passes inside the current
  single-reviewer flow (BMAD plan P2); the parallel fan-out (P3) is an optimization layered on later.
- **Durability across GSD updates is a hard constraint on P3.** Each repo's `.claude/gsd-core/`,
  `.claude/agents/`, `.claude/commands/`, and `.claude/hooks/` are gitignored and re-vendored on every
  `npx @opengsd/gsd-core@latest` update, so the fan-out is **never** implemented by editing
  `gsd-code-review` / `gsd-verifier` or any file under those paths — that work is clobbered on the next
  update. The behavior lives in the team-owned skills (injected via `agent_skills`) and **degrades to
  sequential lens passes** when no fan-out is present, so a core update can change or drop the
  orchestration without breaking review. True parallel fan-out, when wanted, is driven from the
  **invocation layer** — the session (or a team-owned Workflow) that runs the review with the Agent/Task
  tool spawns one subagent per lens and merges; the `gsd-code-reviewer` subagent has no spawn capability,
  and GSD's `config.json` `hooks` are feature toggles (`context_warnings`/`workflow_guard`), not a script
  extension point, so the fan-out cannot live there. The other durable route is an upstream
  `@opengsd/gsd-core` change. Either is version-pinned and gated so a core API change degrades to the
  sequential path rather than errors. Contract: skills define behavior, `config.json` `agent_skills`
  injects/gates it, vendored gsd-core is replaceable. The reference invocation-layer implementation ships
  as the **`solidstats-process-review-lenses`** skill, which bundles the fan-out Workflow
  (`workflows/review-lenses.workflow.js`: discovery once → parallel lenses → merge/dedup into one report)
  so it installs into consumer repos, and acts as the trigger wrapper plus the target of the §J soft-trigger
  recommendation.
- **C6 stops being idle without a fork.** Until the `graphify` capability descriptor is patched (ADR-857),
  the planning §D and review §I.2 sections are the mechanism that makes the graph consulted at plan and
  review time. A known-stale graph is surfaced as a note/Validation Gap rather than trusted silently.
- **The graphify build/refresh itself is unchanged** — this ADR consumes the graph the existing
  `gsd-graphify` skill builds into `.planning/graphs/`; it does not alter how the graph is produced.
- **Provenance and review now compose.** A plan authored under the planning standard (anchored premises,
  explicit `must_haves`) gives the review discovery step (§I.3) and the Acceptance Auditor lens exactly
  the contract to check code against — the two skills are designed to reinforce each other.

## Sources

- `plans/product/BMAD-EVALUATION-AND-GSD-IMPROVEMENTS.md` — the evaluation, the two approved
  improvements, the "where it lands" mapping, the phased plan (P1/P2/P3), and decisions D1/D2/D3.
- `plans/product/GSD-IMPROVEMENTS.md` — item C6 (graphify wired into the workflow), the capability /
  `agent_skills` injection lever, and the gsd-core-descriptor alternative.
- `Estesis/skills/estesis-frontend-react-vc-code-review/references/gsd-sync.md` — the self-discovery
  heuristic, the code-vs-PLAN check table, neutral direction-of-truth, and the read-only `.planning/` rule
  the §I discovery step adapts.
- `skills/solidstats-shared-planning-standards/SKILL.md`, `skills/solidstats-shared-review-standards/SKILL.md`
  (§I/§J), and the four reviewer skills' "Review lenses" sections — where the decisions are encoded.

# Proposal: SolidStats Review-Feedback Learning Loop

## Proposed skill name

`solidstats-process-review-feedback`

**Why.** AGENTS.md: cross-cutting skills without a stack target use
`solidstats-process-<purpose>` (omit the target segment; keep `process-`). This skill
is target-agnostic — it routes corrections to whichever reviewer emitted the review —
so no stack target. `review-feedback` mirrors the estesis slug precisely, which
preserves discoverability. The skill is a process/meta tool: run by a maintainer, read
by no other skill; it never becomes a hard-require target.

---

## What transfers from estesis as-is

- **CAPTURE / PROMOTE split** — two-mode design fits exactly: any developer captures
  per review; a maintainer promotes in batch.
- **Rule-of-three gate** — unchanged. One reviewer deletion may be noise; three
  instances across independent reviews warrant a rule change.
- **Journal format** — `corrections-log.md` + `regression-evals.jsonl` per target
  skill, in a dedicated git repo separate from the skills repo.
- **Four signal types** — false-positive (invalid vs. noise distinction), miss,
  severity-calibration, note/rationale.
- **Code-binding priority order** — inline hunk > HEAD best-effort (label corrected
  snippets as positive examples) > `needs-code-context`.
- **Two eval tiers** — regression JSONL grows from captures; core `evals/evals.json`
  graduates manually at PROMOTE.
- **Read-only toward target skills** — PROMOTE proposes diffs; the user applies.
- **Soft nudge at end of CAPTURE** — print open-count and clusters-at-threshold.

---

## What must change for SolidStats

### Forge: GitHub, not GitLab

README install instructions use `npx skills add solid-stats/skills` — GitHub slug.
The `replays-fetcher` remote (and all four SolidStats repos) are on GitHub. Replace
every reference to "GitLab MR" / `*-mr.html` with **GitHub PR**: the adapter reads a
saved PR review HTML or a `gh pr view --comments` dump. Inline-comment hunks come from
GitHub's unified diff format, not GitLab's. Update `references/adapters.md` accordingly.

### Four reviewers (including the fetcher pair)

Target skills to route corrections to:

| Reviewer skill | Conventions layer | Standards layer |
|---|---|---|
| `solidstats-server-ts-code-review` | `solidstats-server-ts-conventions` | `solidstats-shared-backend-ts-standards`, `solidstats-shared-ts-standards` |
| `solidstats-fetcher-ts-code-review` | `solidstats-fetcher-ts-conventions` | `solidstats-shared-backend-ts-standards`, `solidstats-shared-ts-standards` |
| `solidstats-parser-rust-code-review` | `solidstats-parser-rust-conventions` | `solidstats-shared-review-standards` |
| `solidstats-frontend-react-code-review` | `solidstats-frontend-react-conventions` | `solidstats-shared-ts-standards` |

### Routing decision tree

```
Correction arrives
│
├─ Does it contradict the review FORMAT / severity scale / verdict rules?
│   └─ YES → route to solidstats-shared-review-standards
│
├─ Is the rule about TypeScript idioms shared by ≥2 TS repos?
│   └─ YES → route to solidstats-shared-ts-standards
│                 (if service-side only: solidstats-shared-backend-ts-standards)
│
├─ Is the rule about async safety / config / SOLID / observability (TS services)?
│   └─ YES → route to solidstats-shared-backend-ts-standards
│
└─ Otherwise → route to the per-stack CONVENTIONS skill of the originating reviewer
               (backend-ts, fetcher-ts, parser-rust, or frontend-react)
```

Tie-break: when unsure between process layer and per-stack, prefer the process layer
— it propagates to more reviewers per PROMOTE.

---

## Journal storage location

| Option | Trade-off |
|---|---|
| **Dedicated repo** (`solidstats-review-corrections`, separate from skills repo) | Exact estesis pattern: survives `npx skills update` wipes; any developer can push corrections without a skills-repo checkout; clean separation of raw inbox from versioned journal. **Recommended.** |
| **Inside the skills repo** (`/corrections/<skill>/`) | Zero extra repo to create; but corrections land in the same tree as skill source, complicating `npx skills update` and mixing raw (gitignored) inputs with shipped skill content. |
| **Per-consumer repo** (e.g. inside `server-2`) | Corrections live close to the code reviewed; but journal is fragmented across four repos, PROMOTE must aggregate them, and a developer reviewing fetcher code needs access to the fetcher repo's journal separately. |

**Recommendation: dedicated repo**, resolving path via `$SOLIDSTATS_REVIEW_CORRECTIONS`
or `$SOLIDSTATS_REVIEW_CORRECTIONS_URL`, mirroring the estesis env-var convention exactly.

---

## Effort estimate and first iteration scope

**Estimate: M** (the estesis original is the template; adaptation is substitution, not
invention — the only meaningful work is the GitHub adapter and the routing table).

**First iteration scope:**
1. Copy estesis `workflows/capture.md`, `workflows/promote.md`, `references/adapters.md`,
   `references/journal-schema.md`, `templates/correction-entry.md` into the new skill directory.
2. Replace all GitLab adapter logic with a GitHub PR adapter (saved HTML or `gh` CLI dump).
3. Update the routing table and target-skill list for the four SolidStats reviewers.
4. Update env-var names (`SOLIDSTATS_REVIEW_CORRECTIONS`, `SOLIDSTATS_REVIEW_CORRECTIONS_URL`).
5. Write SKILL.md frontmatter with RU + EN triggers.
6. Defer: evals, PROMOTE automation, graduation to core evals — these need a real
   corrections corpus first (run CAPTURE for 3–5 reviews before authoring PROMOTE).

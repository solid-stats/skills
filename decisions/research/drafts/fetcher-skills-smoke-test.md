# Fetcher skills smoke-test — 2026-06-13

Read path for all three tasks:
solidstats-fetcher-ts-conventions → solidstats-shared-backend-ts-standards (SKILL.md +
references/correctness-and-quality.md) → solidstats-shared-ts-standards (§F/§G).
Plus for Task 2: solidstats-fetcher-ts-tests → solidstats-shared-testing-standards.
Plus for Task 3: solidstats-fetcher-ts-code-review → solidstats-shared-review-standards.

---

## Task 1 — Add a new discovery source (second replay site)

| Question | Answered? | Notes |
|---|---|---|
| Which band does the client go in? | YES | Adapter band: `*-client` suffix per §A band table + [std: §A] naming. |
| What naming? | YES | kebab-case + role suffix (`<site>-source-client.ts`); factory `createXSourceClient(deps)` + typed contract (`type XSourceClient`). |
| Which fences apply? | YES | Fence 4 (PG write scope), 5 (S3 write scope), 6 (discovery read-only), 7 (resilience cross-cutting). |
| What errors? | YES | Connection failure → domain infra error; non-2xx → `ExternalServiceError`. [std: correctness → External adapters] |
| What evidence fields are first-class? | YES | Source URL/ID, discovered ts, fetch ts, checksum, object key, size, fetch status. [conv: §B] |
| How is pacing/retry wired? | PARTIAL | §A adjustment 4 says "resilience primitives live in cross-cutting `source/`, policies configured by orchestration." No concrete API shape/interface for the resilience primitives is defined anywhere in the chain — caller must guess the function signatures for retry/backoff. |
| What gets tested how? | YES | discovery clients → unit with recorded source fixtures; integration against real source behind opt-in flag only. [fetcher-tests → per-area map] |

**Missing rule:** No spec for the `source/` resilience primitive API shape (function name, params, return type). An agent adding the second source client cannot know how to wire `retry`/`throttle` without guessing.

---

## Task 2 — Add a new field to staging records

| Question | Answered? | Notes |
|---|---|---|
| Write-scope rules | YES | Only `staging/` adapter may write to PostgreSQL; [conv: §B fence 4] is explicit. |
| Idempotency / natural-key implications | YES | Natural key = checksum + source identity; `ON CONFLICT DO NOTHING`; new field must not break the unique key. [conv: §B + §A adj.4] |
| Migration ownership — does any skill say who owns staging DDL? | NO — FLAGGED | conventions §A/§B says write scope belongs to `staging/`; fetcher-tests says "run real migrations once they exist; staging-migration ownership is still being locked with server-2." No skill says *who* creates/owns the migration file or which repo it lives in. Agent must guess or stall. |
| Cross-app compatibility (server-2 reads staging) | PARTIAL | §B invariant says server-2 "polls/promotes staging rows" and must not be bypassed, but no skill gives any schema-compatibility protocol (e.g. additive-only, require server-2 PR first, column nullability rules). Agent must guess what "compatible" means. |
| Test requirements | YES | Staging repository → integration test (real PostgreSQL testcontainer); ON CONFLICT idempotency must be verified against real DB. [fetcher-tests] |

**Missing rules:**
1. Migration ownership not resolved — silent gap explicitly acknowledged in fetcher-tests but no owner named.
2. No cross-app compatibility protocol for staging schema changes.

---

## Task 3 — Review a PR that adds checkpoint compression

| Question | Answered? | Notes |
|---|---|---|
| Review phases and gate checks | YES | Phase 1 ingest-boundary gate (a/b/c/d) → Phase 2 convention sweep. Compression lives in `checkpoint/` (S3 write scope fence 5). Gate (b) checks S3 write scope correctly. |
| [conv:] citations followable? | YES | `[conv: invariants → …]` maps to named subsections under §B. `[conv: CLI error boundary]` maps to §D. All cited sections exist and contain the referenced rule. |
| [std: correctness §X] citations followable? | YES | `[std: correctness §Z/§AA/§AB]` map to named sections in references/correctness-and-quality.md. `[std: §A/§B/§D]` map to process-backend-ts-standards SKILL.md sections. All exist. |
| PENDING-architecture carve-out — ambiguity about what IS enforceable today? | YES — AMBIGUITY | The carve-out ("do not raise layer-placement, dependency-direction, or module-layout findings") is correct in intent. However the review skill does not list which of Phase 2's nine items remain active vs. are silenced by the carve-out. Items 1–9 all still apply per the note ("skip only those"), but item 2 (Correctness → checkpoint correctness) and item 7 (Resource lifecycle) directly reference checkpoint behaviour and are enforceable today. A reviewer could mistakenly silence them as "architecture" findings. The carve-out needs a tighter scope statement. |
| Dead citations? | NONE | All `[conv: …]` and `[std: correctness …]` citations resolve within the chain. |

**Ambiguity:** The PENDING note says "skip only those [layer-placement/dependency-direction/module-layout findings]", but two of Phase 2's nine items (item 2 correctness, item 7 resource lifecycle) are directly relevant to a checkpoint-compression PR and could be mistaken for "architecture" findings by a non-expert reader.

---

## Contradictions between skills

None found. The skills are internally consistent. One tension worth noting:
- fetcher-conventions §A is marked PROPOSED/pending sign-off; fetcher-code-review Phase 1 gate (b) (write-scope fence) enforces it as blocking today — but fence 4 (PG write scope) and fence 5 (S3 write scope) are also stated as hard §B invariants, so the gate is correctly grounded in §B, not §A. Not a contradiction, but the split is subtle.

---

## Fix before sign-off (ranked by impact)

1. **[HIGH] Migration ownership gap** — fetcher-tests names the open question but no skill closes it. Add one line to either fetcher-conventions §A or fetcher-tests naming the owner repo and naming convention for the staging migration file. Without this, Task 2 stalls or produces incorrect code.

2. **[HIGH] Missing cross-app schema-compatibility protocol** — no skill defines what "compatible with server-2 reading staging" means (additive-only? require server-2 PR? nullability rules?). Add a bullet to fetcher-conventions §B or a new §E covering staging schema change discipline.

3. **[MEDIUM] Resilience primitive API shape not defined** — `source/` cross-cutting module is named and its role described, but no skill shows the function/type signatures for retry/backoff/throttle primitives. An agent adding a second source client cannot correctly wire pacing without guessing. Add a code example or type stub in fetcher-conventions §A or §C.

4. **[LOW] PENDING carve-out scope ambiguity in code-review** — the "skip only those [layer/dep/layout findings]" note in Phase 2 could lead a reviewer to silence correctness and resource-lifecycle checks on a checkpoint PR. Tighten the carve-out note to explicitly list what is NOT silenced (e.g. "checkpoint correctness under item 2 and resource lifecycle under item 7 remain fully enforceable today").

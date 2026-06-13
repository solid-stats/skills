# server-2 Deferred Decisions — Decision Brief

Four decisions deferred from the architecture-convergence session. Each takes under a minute to call.

---

### A. **No-pass-through rule + controller → repository for trivial CRUD**

**Question:** Should the conventions add a "no-pass-through" rule (collapse layers that only forward) and explicitly allow controller → repository directly for trivial CRUD, or keep the current blanket "a controller never calls a repository directly"?

**Why this matters:**
- Current `SKILL.md §A` dependency rules say "a controller never calls a repository directly" with one carve-out (controller → service for plain CRUD). The no-pass-through rule would also ban service layers that do nothing but proxy — collapsing them by convention.
- A "trivial CRUD" controller→repo shortcut means the code-review skill (`solidstats-server-ts-code-review`) must gain a new judgment gate: "is this CRUD genuinely trivial?" — not mechanical, prone to interpretation drift.
- research-server.md §1: fastify/demo uses two layers, Collina's modular_monolith has no controller/usecase/service layers — both are flatter than us, but neither codifies a "trivial CRUD exemption" rule either.

**Options:**

| Option | How it works | Pros | Cons | Hidden costs | Best when |
|--------|-------------|------|------|--------------|-----------|
| **Status quo** | Keep "controller → service always; service → repository always". Usecase optional (as today). | Zero rule ambiguity; review skill is mechanical. | A thin pass-through service is a real cost today if it exists. | None. | The codebase actually has pass-through layers worth eliminating. |
| **Add no-pass-through rule only** | Ban layers that only forward — the usecase/service must add logic to exist. Edit: `SKILL.md §A` dependency rules + layers.md usecase checklist (already partially there: "a usecase that wraps a single service call ... should be removed"). No controller→repo. | Eliminates redundant ceremony with no judgment call. | Slightly harder to enforce mechanically — reviewer must assess "does this add logic?" | Review skill needs a pass-through checklist item. | Layers exist today that are pure proxies. |
| **Add no-pass-through + controller→repo for trivial CRUD** | As above, plus allow controller → repository when the handler is a single Kysely `findById`/`insert` with no domain logic at all. Edit: `SKILL.md §A` "Dependency rules" bullet, layers.md controller checklist, code-review skill finding "controller calls repository". | Matches Fastify/demo precedent most closely. | "Trivial" is a judgment call — creates a loophole reviewers will argue about. Breaks the current invariant cleanly. | Review skill gains a subjective gate. | The team agrees on a mechanical definition of "trivial" upfront (e.g., single query, no error decisions). |

**Recommendation:** Option 2 (no-pass-through rule only). The usecase checklist in `layers.md` already says "a usecase that wraps a single service call ... should be removed" — formalising this as an explicit rule requires only a one-line addition to `SKILL.md §A` and is fully mechanical. The controller→repo shortcut (Option 3) introduces judgment ambiguity with minimal practical gain, since controllers calling services for plain CRUD is already permitted. What would make this wrong: if the codebase has controllers today calling services that are pure proxies to repositories with no logic — then Option 3 eliminates the extra file entirely and is worth the ambiguity.

---

### B. **Fastify 5.3 `getDecorator<T>()` / `setDecorator<T>()` for cross-module dependency access**

**Question:** Should cross-module dependency access switch from `declare module 'fastify'` global type augmentation to Fastify 5.3's `getDecorator<T>()`/`setDecorator<T>()` typed accessors?

**Why this matters:**
- Current `layers.md` DI section relies on `app.decorate('key', value)` + `declare module 'fastify'` interface augmentation — official docs call this "unavoidable" type bleed (research-server.md §2).
- `getDecorator<T>()` fails fast with `FST_ERR_DEC_UNDECLARED` at boot if a dependency wasn't registered — today that error surfaces later, at first use.
- Adopting requires editing: `layers.md` DI section (plugin example), `SKILL.md` DI bullet, and the `declare module 'fastify'` pattern in the code-review skill's DI checklist.

**Options:**

| Option | How it works | Pros | Cons | Hidden costs | Best when |
|--------|-------------|------|------|--------------|-----------|
| **Keep `declare module` augmentation** | Existing pattern: `app.decorate('appealUsecase', ...)` + module augmentation in each plugin file. | Zero migration; already working; official docs support it. | Type bleed is global; missing-dep errors are runtime-deferred; Fastify docs call it "unavoidable". | None. | New modules are infrequent; boot-time safety is not a pain point. |
| **Adopt `getDecorator<T>()`** | Replace `app.decoratorName` access with `app.getDecorator<AppealUsecase>('appealUsecase')` at call sites; remove `declare module` blocks. Edit: layers.md DI example, SKILL.md §A DI bullet, code-review skill. | Fail-fast `FST_ERR_DEC_UNDECLARED` at boot; scoped types; no global interface bleed. | Fastify 5.3 minimum — verify pinned version. Every cross-module access site must be updated (mechanical but broad). | Review skill must update "dependencies reached through `app.decoratorName`" checks. | Fastify version is already ≥ 5.3; a new module is being written. |
| **Hybrid: new modules only** | Apply `getDecorator` pattern to new module plugins; leave existing code untouched. | Incremental; no big-bang migration. | Two patterns coexist — review skill must allow both during transition; inconsistency is its own cost. | Transition period needs a sunset milestone or it never converges. | The codebase is large enough that full migration is high churn. |

**Recommendation:** Option 2 (full adoption), but only if Fastify ≥ 5.3 is already pinned in `server-2/package.json`. The fail-fast boot error pays for itself immediately on the next missing-decorator bug, and eliminating global `declare module` bleed is a clean type-system win. The edit surface is `layers.md` DI section + one bullet in `SKILL.md §A` + the code-review skill's DI checklist — all mechanical. What would make this wrong: if server-2 is pinned below 5.3, or if `getDecorator` is not yet stable in the version in use — verify before merging.

---

### C. **Mechanical boundary enforcement: dependency-cruiser vs eslint-plugin-boundaries**

**Question:** Which tool should enforce server-2 module/layer boundaries mechanically — dependency-cruiser or eslint-plugin-boundaries — and what two rules must it implement?

**Why this matters:**
- Current conventions rely entirely on code review to catch cross-module imports and upward layer imports — research-server.md §5 flags this as a gap: "mature TS monoliths enforce boundaries mechanically."
- The two required rules (from architecture-convergence.md §2): (1) cross-module imports only via `index.ts`; (2) layer allowlist — repository may not import service/usecase/controller; no upward imports.
- Adding either tool means a new config file and a CI step; the code-review skill's layer-violation findings become redundant for anything the tool catches.

**Options:**

| Option | How it works | Pros | Cons | Hidden costs | Best when |
|--------|-------------|------|------|--------------|-----------|
| **dependency-cruiser** | `.dependency-cruiser.cjs` with `forbidden` rules: `$1` group-capture for cross-module imports banned except via `index.ts`; `ancestor: true` for upward-import bans. Runs in CI as a separate script. | Works at the file-graph level, catches dynamic imports too; same tool already chosen for fetcher in architecture-convergence §1. | Not in the ESLint pipeline — separate CI step; slower feedback loop than lint. | New config file, CI step; no community-standard naming (per research-server.md §5 — we name rules ourselves). | Consistency with fetcher's depcruise preset matters; both services share a root CI config. |
| **eslint-plugin-boundaries** | `element-types` rule with `default: 'disallow'` + per-layer allowlist; `entry-point` rule forcing `index.ts`-only imports. Runs in the existing ESLint pass. | Inline with `eslint` — editor squiggles immediately, no separate CI step; layer rules expressed in familiar ESLint config format. | Requires classifying every file with `element` comments or path patterns; more config ceremony than depcruise for a flat module layout. | ESLint config changes; plugin dependency. | ESLint is already the primary lint gate and the team wants editor-level feedback. |
| **Both** | depcruise for cross-module barrel enforcement + eslint-plugin-boundaries for layer allowlist. | Complementary strengths. | Double config, double maintenance surface, two separate rulesets to keep in sync. | High setup cost. | Rarely justified unless the two tools catch disjoint violations. |

**Recommendation:** eslint-plugin-boundaries (Option 2). It plugs into the existing ESLint 10 setup (per `solidstats-shared-ts-standards`) and gives editor-level squiggles — faster developer feedback than a separate depcruise CI script. The fetcher chose depcruiser for different reasons (no ESLint pipeline for Rust-adjacent scripts); server-2 already has a full ESLint setup. The edit surface: `SKILL.md §A` dependency rules section + `solidstats-server-ts-code-review` (boundary findings become "automated — see eslint-plugin-boundaries"). What would make this wrong: if the existing ESLint config is too constrained to add path-pattern classifiers without major refactor — in that case depcruiser is the lower-friction path.

---

### D. **Explicit test-mocking strategy for plugin-decorated dependencies**

**Question:** Should tests override Fastify-decorated dependencies via `fastify-override` (test-time plugin override), or via factory-level injection (pass a mock directly to `createX(deps)` in unit tests)?

**Why this matters:**
- Current practice is ad-hoc (architecture-convergence.md §2, research-server.md §2: "decide a test-mocking strategy explicitly ... instead of ad-hoc").
- The conventions reference `solidstats-server-ts-tests` — that skill's assumptions about how dependencies are substituted are undefined until this is settled.
- The choice determines what kind of tests are idiomatic: integration tests against a full Fastify instance (fastify-override path) vs pure unit tests against factories (injection path).

**Options:**

| Option | How it works | Pros | Cons | Hidden costs | Best when |
|--------|-------------|------|------|--------------|-----------|
| **factory-level injection** | Unit tests call `createAppealService({ appealRepository: mockRepo, errors: mockErrors })` directly — no Fastify instance needed. | Fast, zero Fastify overhead; works today with no new deps; tests one factory in isolation. | Does not test the plugin wiring (decorator registration, `dependencies` order) — integration bugs invisible at unit level. | None beyond writing typed mock factories. | The majority of test coverage is unit-level; integration tests are a separate concern covered elsewhere. |
| **fastify-override** | Integration tests build a full app with `buildApp()` then call `app.setDecorator('appealUsecase', mockUsecase)` (or the `fastify-override` plugin) before route tests. | Tests the full HTTP stack including schema validation, error handler, route registration; catches plugin-wiring bugs. | Heavier test setup; `fastify-override` is a third-party dependency; slower than unit tests. | New dependency; layers.md DI checklist and `solidstats-server-ts-tests` skill need explicit `fastify-override` guidance. | Routes/integration tests are the primary quality gate; unit tests are secondary. |
| **Both, by layer** | Unit tests use factory injection for services/repositories; route tests use `fastify-override` (or Decision B's `setDecorator`) for controller-layer integration tests. Explicit convention: "unit tests inject, route tests override." | Best coverage signal; each test type is idiomatic at its level. | Two patterns to document and enforce; `solidstats-server-ts-tests` must specify which pattern applies at which layer. | Medium — two sections in the tests skill, not two separate tools. | The team writes both unit and integration tests today (the likely case). |

**Recommendation:** Option 3 (both, by layer). The split is natural given the existing layer structure: factory injection for services/repositories is zero-cost and already possible today; `setDecorator` (available once Decision B is adopted) for route-level integration tests removes the need for the `fastify-override` third-party dep. Document in `solidstats-server-ts-tests`: "unit tests call `createX(deps)` with mock deps directly; route integration tests use `app.setDecorator<T>()` after `buildApp()`." Edit surface: `solidstats-server-ts-tests` SKILL.md (new mocking section) + `layers.md` DI checklist footnote. What would make this wrong: if Decision B (getDecorator/setDecorator) is rejected — then `fastify-override` becomes the only integration-level override mechanism and must be adopted explicitly.

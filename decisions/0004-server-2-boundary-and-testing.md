# ADR 0004 — server-2 boundary & testing decisions

- Status: Accepted (2026-06-13)
- Scope: `solidstats-server-ts-conventions`, `solidstats-server-ts-code-review`, `solidstats-server-ts-tests`; server-2 repo (code-side application deferred to backlog)
- Supersedes: none — first formal record of the four decisions deferred from the architecture-convergence session

## Context

server-2 carries a 4-layer feature-module stack (controller → usecase → service → repository),
functional-factory DI via Fastify plugin decoration, and a queue-consumer discipline. The pass-2
practice survey (`skills/decisions/research/research-server.md` §1, §2, §5, §6) confirmed the shape is canon but flagged four
open forks the conventions left unsettled, each of which the reviewer and tests skills could not
specify until decided:

1. Whether to relax the "a controller never calls a repository directly" invariant — adding a
   no-pass-through rule and/or a controller→repository shortcut for trivial CRUD
   (`skills/decisions/research/research-server.md` §1 proposed both; `skills/decisions/research/server2-deferred-decisions.md` A laid out three options).
2. Whether cross-module dependency access stays on `declare module 'fastify'` global augmentation —
   which official docs call "unavoidable" type bleed and which defers missing-dependency errors to
   first use — or moves to Fastify's typed `getDecorator`/`setDecorator` accessors
   (`skills/decisions/research/research-server.md` §2; `skills/decisions/research/server2-deferred-decisions.md` B).
3. Which tool enforces module/layer boundaries mechanically, given that conventions alone are a gap
   versus mature TS monoliths (`skills/decisions/research/research-server.md` §5): dependency-cruiser group-capture rules or
   eslint-plugin-boundaries `element-types` + `entry-point` (`skills/decisions/research/server2-deferred-decisions.md` C).
4. How tests substitute plugin-decorated dependencies — factory-level injection, a `fastify-override`
   plugin, or both split by layer — since the practice was ad-hoc and `solidstats-server-ts-tests`
   had no defined assumption (`skills/decisions/research/research-server.md` §2; `skills/decisions/research/server2-deferred-decisions.md` D).

## Decision

**A — no-pass-through rule only.** A usecase or service that only forwards a call — no guard, no
transaction boundary, no orchestration across siblings, no row→domain validation — must not exist;
collapse it and let the caller reach the layer below. Collapsing never introduces a layer skip: a
pure-proxy service folds into its caller calling the service it forwarded to, still
controller→service for plain CRUD. The "trivial CRUD" controller→repository shortcut from
`skills/decisions/research/research-server.md` §1 was rejected. controller→service for plain CRUD remains the only legal layer
skip; there is no controller→repository path. Usecase stays optional, transaction boundary stays in
the usecase. Encoded in `solidstats-server-ts-conventions` §A "Dependency rules".

**B — adopt `getDecorator<T>()` / `setDecorator<T>()`.** Register dependencies with
`app.decorate(name, value)`, but reach them through `app.getDecorator<Contract>(name)` typed to the
contract at the access site; drop every `declare module 'fastify'` augmentation. Fastify is pinned
`^5.8.5` (≥ 5.3 required for the accessors). Encoded in `solidstats-server-ts-conventions` §A and
`references/layers.md`.

**C — dependency-cruiser is the boundary tool, one tool across both TS services.** A
`.dependency-cruiser.cjs` preset enforces two rules: (1) cross-module imports only through the target
module's `index.ts` public surface; (2) a downward-only layer allowlist —
`controller → usecase → service → repository`, no upward imports, and `src/infra/` importing nothing
upward. eslint-plugin-boundaries was rejected. The fetcher convention already mandates dependency-cruiser, so a
single boundary tool now spans both TS services. Preset draft:
`plans/server-2/briefs/server-2-dependency-cruiser.cjs`. Encoded in `solidstats-server-ts-conventions` §A "Boundary
enforcement".

**D — test mocking, both by layer.** Unit tests (service/repository/usecase) call the factory
directly with mock deps satisfying the contract type — no Fastify instance, no mock framework. Route
integration tests build the real app (`buildApp()` + `app.inject`) and swap one decorated dependency
after build via `app.setDecorator<Contract>(name, double)`. Stated crisply: unit tests inject into
the factory, route tests override via `setDecorator`. No `fastify-override` dependency. Encoded in
`solidstats-server-ts-tests` "Substituting dependencies" and the per-layer testing map.

## Rationale

A — the no-pass-through rule only formalizes a rule the usecase checklist already carried ("a usecase
wrapping a single service call should be removed"), generalized to any pure-proxy layer; it stays
mechanical for the import graph and leaves a thin semantic check for review. The controller→repository
shortcut was rejected because "trivial CRUD" is a judgment call — a loophole reviewers would argue
over — for near-zero gain, since controller→service for plain CRUD is already permitted.

B — `getDecorator` fails fast with `FST_ERR_DEC_UNDECLARED` at boot when a dependency was never
registered, instead of surfacing as `undefined` at request time, and its type parameter keeps the
type local to the access site rather than bleeding a global `FastifyInstance` augmentation across the
app. The `declare module` path was kept-as-fallback only on the version risk, which the `^5.8.5` pin
clears.

C — depcruise works at the file-graph level and catches dynamic imports the layer rules care about;
choosing it for server-2 too means the fetcher and server-2 share one boundary tool and one mental
model rather than two rulesets in two formats. eslint-plugin-boundaries would have given editor-level
squiggles inside the existing ESLint pass, but consolidating on a single tool across both services
won (depcruise everywhere). No community-standard rule naming exists for either tool, so the rule
names are ours. The preset is aspirational against today's code — server-2 has no `index.ts` barrels
yet and real layer inversions, so the first run reports many violations; that is the convention
pulling code into line, not a config to relax.

D — the split is natural given the layer structure: factory injection for services/repositories is
zero-cost and already possible through the functional-factory DI; `setDecorator` (available once B
landed) covers route-level integration override without pulling in the third-party `fastify-override`
dependency that the `declare module` world needed. Each test kind is then idiomatic at its level —
mocked-DB unit logic vs full-HTTP-stack route wiring — without a second mechanism.

## Consequences

- The reviewer's manual layer/boundary checks demote to a backstop for what depcruise cannot see —
  semantic placement, e.g. "is this service a real layer or a pass-through?" — not the primary gate.
- Every cross-module access site moves from `app.decoratorName` / `declare module` to
  `app.getDecorator<Contract>(name)`; `setDecorator` becomes the sanctioned test override.
- `solidstats-server-ts-tests` now defines exactly two substitution mechanisms, one per test kind,
  closing the previously-undefined assumption about how decorated deps are substituted.
- Code-side application in the server-2 repo — wiring the depcruise config + CI step, migrating
  access to `getDecorator`, collapsing any pass-through layers — is a backlog item, separate from the
  skill encoding (`skills/decisions/research/gate-suppression-backlog.md`).
- Queue rule wording is settled in the same pass: the queue-reliability rule says **per-consumer
  prefetch** explicitly, since RabbitMQ 4.0 deprecates global/per-channel prefetch (hard channel
  error on quorum queues). The 4-layer module pattern itself is kept unchanged.

## Sources

- `skills/decisions/research/server2-deferred-decisions.md` — the four-decision brief with
  per-decision options and recommendations.
- `skills/decisions/research/architecture-convergence.md` §2 — server-2 verdicts and the four
  decisions as confirmed 2026-06-13.
- `skills/decisions/research/research-server.md` — pass-1 prefetch byproduct (§"Pass 1") and
  pass-2 practice deltas §1 (layering), §2 (DI/test-mocking), §5 (boundary enforcement),
  §6 (RabbitMQ).
- `skills/solidstats-server-ts-conventions/SKILL.md` §A + `references/layers.md` — encoded
  no-pass-through rule, `getDecorator`/`setDecorator` (Fastify 5.3+), depcruise boundary preset.
- `skills/solidstats-server-ts-tests/SKILL.md` — encoded per-layer testing map and the
  inject-vs-`setDecorator` substitution rule.

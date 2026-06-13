# Research — server-2 (Fastify modular backend practice)

## Pass 1 — strict verified harness (estesis-process-deep-research): INCONCLUSIVE

Run `wf_e0892a56-40e` (49 agents, ~1.1M subagent tokens): **all 14 extracted claims were
refuted by the verification gates** — mostly entailment failures ("quote does not entail claim")
and provenance failures ("quote not found on page", typical when GitHub HTML defeats the
fetcher). The 6-part question was too broad for the claim-extraction stage; treat the pass as a
harness-calibration result, not as evidence that our stack is wrong.

**One usable byproduct** (refuted only for staleness-framing, source primary and entailed):

- RabbitMQ 3.3 changed the *default* prefetch semantics to per-consumer (it did not introduce
  per-consumer mode), and **RabbitMQ 4.0 deprecates global (per-channel) prefetch entirely** →
  our queue-reliability rule should say "per-consumer prefetch" explicitly, not just
  "prefetch/QoS cap". (Source: amqplib channel API docs, per the adjudicator's note.)

## Pass 2 — pragmatic practice survey (per-topic searchers + spot-checks)

Run `wf_ae2d0d1a-239`. 
# server-2 practice deltas

Validated against 2024–2026 practice (Fastify org repos/docs, Collina's modular_monolith, RabbitMQ official docs, Kysely docs, real rulesets). Only spot-check-surviving or well-sourced claims used.

---

## 1. Layering (controller → usecase → service → repository)

**Practice:** Fastify reference codebases are radically flatter than us. fastify/demo: two layers — fp-plugins (repositories + shared services) and route handlers calling repositories directly; transactions opened inline in handlers (`fastify.knex.transaction(...)` with trx passed to repo methods). Collina's modular_monolith: feature modules, each with its own routes dir + fp-decorated domain object; no controller/usecase/service layers anywhere in official material. Collina: group routes by domain, multiple HTTP methods per file, "2–3 full screen scrolls" per file.

**Verdict: keep-with-note.** Feature modules are exactly canon. Our 4-layer stack is heavier than any reference implementation — not contradicted, but unsupported by ecosystem precedent.

**Adjustment:** Enforce a no-pass-through rule: a layer that only forwards calls must be collapsed. Allow controller → repository directly for trivial CRUD. Keep usecase optional (as now); keep transaction boundary in usecase — ecosystem precedent (trx inline at the entry point, passed down as an argument) is compatible with this, just shallower.

## 2. DI (functional factories + fp decoration, no container)

**Practice:** Plugin decoration IS the Fastify DI mechanism — Collina calls it a "dependency injection mechanism" explicitly (his actual word for it is "crude", not "simple"); maintainers (mcollina, RafaelGSS) endorse per-domain decorated repositories over containers. No maintainer recommends tsyringe/inversify (medium confidence on issue #6019). Known costs, all documented: (1) `declare module 'fastify'` type bleed — official docs call it "unavoidable"; (2) decorators in child scopes can't be overridden for test mocking (hence fastify-override).

**Verdict: keep.** No classes, no container is the idiomatic position.

**Adjustment:** Adopt Fastify 5.3 `getDecorator<T>()`/`setDecorator<T>()` for cross-module dependency access — fail-fast `FST_ERR_DEC_UNDECLARED` at boot, scoped types instead of global augmentation. Decide a test-mocking strategy explicitly (fastify-override or factory-level injection) instead of ad-hoc.

## 3. TypeBox → @fastify/swagger → OpenAPI → TS client

**Practice:** Code-first pipeline (TypeBox route schemas → swagger-emitted spec → openapi-typescript client) is the dominant real-world path (Val Town migration documented it). @fastify/type-provider-typebox is first-party, version-locked to Fastify 5. Caveats from spot-checks: TypeBox is NOT documented as "officially recommended" (just first-party); @fastify/swagger OpenAPI 3.1 output is NOT confirmed — only 3.0.0 is documented. Known gap: `Type.Ref()` breaks handler type inference (open issue #263).

**Verdict: keep.**

**Adjustment:** Pin emitted spec to OpenAPI 3.0.x — do not assume 3.1 works. Convention rule: inline schemas (or typed wrappers) where handler inference matters; `addSchema`/`Type.Ref` only for OpenAPI `$ref` deduplication where you accept losing inference. Low confidence: the "TypeBox 22x faster than Zod" figure is a secondary-source benchmark — don't cite it as fact, but the directional claim (Ajv JIT vs Zod) is safe.

## 4. Kysely over pg

**Practice:** Production-mainstream: Deno, Maersk, Cal.com; endorsed by Hono and tRPC authors (the claimed Fastify endorsement failed spot-check — drop it). Stricter query-level type safety than Drizzle (substantively confirmed via thetutlage discussion). Drizzle has larger/faster-growing adoption (medium confidence); Prisma 7 fixed its perf story — neither changes the calculus for an existing Kysely codebase.

**Verdict: keep.**

**Adjustment:** Two concrete additions if not already done: (1) kysely-codegen with `--verify` in CI to catch schema drift; (2) `Selectable<T>`/`Insertable<T>`/`Updateable<T>` as the only row types exposed on repository signatures. Low confidence: download-trend numbers and the prisma-kysely hybrid story — informational only.

## 5. Module-boundary enforcement

**Practice:** Mature TS monoliths enforce boundaries structurally, not by convention: dependency-cruiser rules with `$1` group-capture (cross-module imports banned except via a declared public surface — `index.ts` barrel or `*.contract.ts`), `ancestor: true` for upward-import bans, or eslint-plugin-boundaries `element-types` with `default: 'disallow'` + per-layer allowlist (controller→service→repo, downward only) and `entry-point` forcing index.ts-only imports.

**Verdict: adjust (gap).** We rely on convention; practice is mechanical enforcement.

**Adjustment:** Add dependency-cruiser (or eslint-plugin-boundaries) with two rules: (1) cross-module imports only via the module's `index.ts` public surface; (2) layer allowlist matching our stack — repository may not import service/usecase/controller; no upward imports. Note: no community-standard rule naming exists — name them ourselves.

## 6. RabbitMQ via amqplib

**Practice (all high confidence, official docs):** Manual ack only — autoAck is officially "unsafe" and removes backpressure. Per-consumer prefetch in the 100–300 range (prefetch=1 is safe but slow; 0 is dangerous). Never global prefetch — deprecated in 4.0, hard channel error on quorum queues. Quorum queues default delivery limit = 20 since 4.0: without a DLX, messages are silently dropped after 20 attempts — DLX is effectively mandatory. RabbitMQ 4.3+ semantics: `channel.nack(msg, false, true)` requeue does NOT increment delivery-count; `channel.reject(msg, false)` DOES — use reject for failures that should count toward the limit. Design consumers idempotent; `redelivered` flag is a hint, not proof of prior processing.

**Verdict: keep-with-adjust.**

**Adjustment:** Audit consumers against this checklist: manual ack everywhere; explicit `channel.prefetch(n)` (per-consumer, 100–300 unless workload says otherwise); DLX on every quorum queue; codify the nack-requeue (transient) vs reject-no-requeue (counted failure) distinction in the consumer convention; idempotency as a stated handler requirement.

---

## Do not change

- Feature modules (one directory per domain) — exactly the Collina/official pattern.
- Functional factories + fp decoration DI, no classes, no container — maintainer-endorsed idiom.
- TypeBox schemas as the single source of truth, code-first OpenAPI → typed client — dominant practice.
- Kysely in repositories — mainstream-validated, stronger query typing than Drizzle.
- Transaction-as-argument passed down to repositories — matches fastify/demo's trx-passing pattern.
- Usecase as optional layer — flatness when possible is the ecosystem direction.
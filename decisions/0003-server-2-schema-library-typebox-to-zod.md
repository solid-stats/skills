# ADR 0003 — server-2 schema library: migrate TypeBox → zod 4

- Status: Accepted (2026-06-13)
- Scope: `server-2` (Fastify HTTP backend) code; skills `solidstats-server-ts-conventions`, `solidstats-shared-backend-ts-standards`, `solidstats-server-ts-code-review`
- Supersedes: the earlier "OpenAPI inline-vs-`Type.Ref` reversal" tradeoff (which only existed under TypeBox)

## Context

server-2 declared its Fastify request/response schemas with TypeBox (`@sinclair/typebox` +
`@fastify/type-provider-typebox`). TypeBox forces a fork the moment you want a deduplicated
OpenAPI output: emitting a single `#/components/schemas/X` instead of re-inlining the same shape
on every route means referencing it with `Type.Ref`, and `Type.Ref` breaks Fastify handler type
inference (issue #263) — `req.body` / `req.params` / `req.query` and the response stop being
typed from the schema. So under TypeBox you chose one of: inlined schemas (full inference, bloated
spec with the shape repeated per route) or `$ref` dedup via `Type.Ref` (clean spec, dead handler
types). That fork is the "inline-vs-`Type.Ref`" tradeoff this ADR supersedes.

Two facts collapse the fork rather than forcing a side. First, zod is already the org schema-first
standard: the fetcher (`replays-fetcher`) and `web` are on zod, and the shared input discipline is
written stack-neutral around it (`solidstats-shared-backend-ts-standards` §D). server-2 was the
lone TypeBox holdout. Second, `fastify-type-provider-zod` plus `z.globalRegistry` decouple the two
concerns TypeBox conflated: the route always receives the real schema variable (inference intact),
while `jsonSchemaTransformObject` emits a deduplicated `$ref` for any schema registered with an
`id`. Registering for `$ref` never costs inference.

The convention layer was already rewritten to zod ahead of the code: `solidstats-server-ts-conventions`
declares "zod 4 + fastify-type-provider-zod" as the server-2 stack (SKILL Scope section) and its
`references/schemas-and-data.md` carries the full zod discipline. The shared baseline records the
retirement in `solidstats-shared-backend-ts-standards` §D. What remained was the server-2 repo
code itself, tracked as backlog `skills/decisions/research/gate-suppression-backlog.md` §E.

## Decision

Migrate server-2's schema library from TypeBox to zod 4. Concretely (per `skills/decisions/research/gate-suppression-backlog.md` §E):

- **Deps:** drop `@sinclair/typebox` and `@fastify/type-provider-typebox`; add `zod@^4` and
  `fastify-type-provider-zod`.
- **Setup, 2 files** — `src/app.ts` and `src/openapi/register-openapi.ts`: swap to
  `setValidatorCompiler(validatorCompiler)` / `setSerializerCompiler(serializerCompiler)`,
  `withTypeProvider<ZodTypeProvider>()`, and the swagger transforms `transform: jsonSchemaTransform`
  + `transformObject: jsonSchemaTransformObject`.
- **Schemas, ~12 files:** `Type.Object` → `z.object`, `Static<typeof X>` → `z.infer<typeof X>`,
  bounds as `.max()` / `.int().min().max()`, `.strict()` on request objects; register shared
  response schemas via `z.globalRegistry.add(X, { id })` only where `$ref` dedup is wanted
  (inference stays either way).

The schema rules the migrated code must satisfy are the ones already encoded in
`solidstats-server-ts-conventions/references/schemas-and-data.md` → zod schemas: derive types with
`z.infer`, bound every string and array and numeric range, `.strict()` on request objects, declare
a response schema on every route, pass the schema variable into the route, register with
`z.globalRegistry` for `$ref` dedup. The base error/naming/config rules come from
`solidstats-shared-backend-ts-standards` §§A–D.

## Rationale

`Type.Ref` broke Fastify handler inference (#263); that is the load-bearing defect, not a style
preference. `fastify-type-provider-zod` + `z.globalRegistry` deliver `$ref` dedup *and* inference
together, so the TypeBox fork disappears: you no longer trade a clean spec against typed handlers.

zod is already the org standard — fetcher and web run it, and the shared discipline
(`solidstats-shared-backend-ts-standards` §D) is written around zod 4 as "the single schema-first
tool". Keeping server-2 on TypeBox kept one repo off the org baseline for no benefit.

**Rejected — stay on TypeBox, inline everything.** Preserves inference but ships a spec with each
shape repeated per route and forecloses dedup; also leaves server-2 as the org's lone non-zod TS
backend. **Rejected — stay on TypeBox, use `Type.Ref` for dedup.** This is the supersedeed reversal:
it buys the clean spec at the cost of dead handler types (#263). Neither alternative exists once
the provider gives both properties at once.

The migration is smaller than it looks: server-2 is **all-inline today — zero `Type.Ref` /
`addSchema` / `$id` usage** (`skills/decisions/research/gate-suppression-backlog.md` §E), so there is no `$ref` graph to
untangle and the "inline-vs-`$ref`" question never applied to the existing code. 12 schema files +
2 setup files.

## Consequences

- The conventions/reviewer/standards skills are already on zod; only the server-2 repo code lags.
  Until it lands, code and convention disagree — the convention wins by policy (the skills are
  prescriptive), and the gap is the open backlog item, not a contradiction to reconcile in the
  skills.
- The lint-suppression cleanup gets cheaper, not just neutral. `skills/decisions/research/gate-suppression-backlog.md` §A
  retires the `new-cap` `capIsNewExceptions += Type.Integer/Type.Null/…` config (10 disables): zod
  uses lowercase `z.object` / `z.string()`, so the TypeBox `Type.X` `new-cap` noise vanishes with
  the migration — no config entry needed.
- **Unchanged:** the OpenAPI export/verify pipeline (`openapi:export` / `openapi:verify` +
  `openapi-typescript` → web client) and the **OpenAPI 3.0.x pin** (`@fastify/swagger` documents
  3.0.0 output; 3.1 unconfirmed). The migration swaps how schemas are *authored*, not the
  spec-export contract `web` consumes.
- Error handling shifts default status only: zod's `validatorCompiler` rejects with **400**, and
  server-2's central `setErrorHandler` remaps payload-validation failures to its chosen **422**
  (`schemas-and-data.md` → Error system / zod schemas). Domain validation stays in the service as
  typed `AppError`s — not pushed into `z.refine()`.
- Follow-up: execute §E in the server-2 repo (deps swap, 2 setup files, ~12 schema files), then
  drop the now-moot `new-cap` config per §A.

## Sources

- `skills/decisions/research/RECOMMENDATION.md` — sign-off checklist item 3 (decision, #263,
  provider rationale, org-standard argument, supersession of the `Type.Ref` reversal).
- `skills/decisions/research/gate-suppression-backlog.md` — §E (code-side migration steps,
  deps, setup/schema file counts, zero-`Type.Ref`-today, unchanged OpenAPI pipeline + 3.0.x pin);
  §A (the moot `new-cap` config after migration).
- `skills/solidstats-server-ts-conventions/SKILL.md` + `references/schemas-and-data.md` — the
  encoded zod 4 discipline: provider, `z.globalRegistry` `$ref` dedup, bounds/`.strict()`,
  inference decoupled from `$ref`, the 422 override, the 3.0.x pin.
- `skills/solidstats-shared-backend-ts-standards/SKILL.md` — §D (zod 4 as the single org
  schema-first tool; TypeBox retired from server-2; schema-first `z.infer` types) and §B (typed
  error base the server-2 transport mapping extends).

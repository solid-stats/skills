# Changelog — solidstats-backend-ts-conventions

## 2026-06-06 — Initial
- Rebased on `estesis-backend-vc-code-review` (the team's proven backend doctrine), translated
  Python/FastAPI → TypeScript/Fastify at **full fidelity** (§A–§AB), anchored to server-2's actual
  stack: Fastify 5, TypeBox, Kysely/pg, amqplib, S3, pino, prom-client, envalid.
- **Architecture:** 4-layer model — controllers → usecases → services → repositories — with the
  usecase layer optional (only for multi-service orchestration). Downward-only dependencies;
  cross-module sharing only via a module's exported service contract.
- **Style decisions (made by Claude per the user's delegation of backend internals):**
  - DI/contracts: **functional factories** returning typed contract objects (`type X` +
    `createX(deps): X`), no classes, no `I`-prefix — lowest ceremony, easiest to test, cleanest with
    Fastify decoration.
  - Module layout: **flat role-files** (`appeal.service.ts`, `appeal.repository.ts`, …).
- **Scope:** server-2 (Fastify) is the primary subject; a shared baseline (layering, naming, errors,
  async, logging, config, TS strictness) also binds the `replays-fetcher` CLI. Fastify/TypeBox/HTTP
  sections are tagged `[HTTP]` and do not bind the CLI.
- **Structure:** `SKILL.md` spine (architecture, module layout, naming) + `references/`:
  - `layers.md` — controllers, usecases, services, repositories, Fastify-plugin DI, with an
    exhaustive per-layer checklist (full estesis granularity).
  - `schemas-and-data.md` — typed error system, TypeBox schema discipline, Kysely data access,
    enums/filters/pagination, transactions, envalid config.
  - `correctness-and-quality.md` — full §T–§AB (LSP, async safety, security depth, SOLID, DRY,
    schema quality, observability, log diagnosability, resource lifecycle) + code-quality, comments,
    imports/lint. Each rule notes the severity the code-review skill maps it to.
- Absorbs `fastify-best-practices`, `nodejs-backend-patterns`, `api-design-principles` — those
  generic skills are not installed separately; their guidance lives here, tuned to SolidStats.
- The design/correctness rules are stated as conventions; the separate
  `solidstats-backend-ts-code-review` skill (not yet built) operationalizes them into hunts with
  evidence gates, the OpenAPI conformance gate, and the severity table.

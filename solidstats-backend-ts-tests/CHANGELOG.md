# Changelog — solidstats-backend-ts-tests

## 2026-06-06 — Initial
- The thin per-stack backend test skill on top of `solidstats-process-testing-standards` (which owns
  the philosophy). Adds only the TS/Fastify how-to; does not restate RITE/AAA/determinism.
- **Runner:** Vitest 4 + `@vitest/coverage-v8`, with unit and integration as separate projects.
- **Per-layer testing map:** repository → integration (real Postgres); service → unit (fake repo) +
  integration where the query matters; usecase → unit (fake services) + integration for transactions;
  route → integration via Fastify `app.inject`.
- **Doubles in practice:** the functional-factory DI means unit isolation needs no mocking
  framework — pass fake deps directly; mock only true boundaries.
- **Integration harness:** testcontainers (or Docker Compose test services) for PostgreSQL,
  RabbitMQ, S3 — never mocked (a mock at a contract boundary hides contract failures); isolated
  ephemeral resource per test, real migrations, reset between tests.
- **TS idioms harvested** (backend-flavored) from the estesis unit-tests skill: typed builders,
  `test.each` / case-tables, `@ts-expect-error` for invalid input, `vi` fake timers; React specifics
  (`renderHook`/`act`) intentionally excluded.
- **File placement:** co-located `*.test.ts`; decomposed `<unit>/tests/` when a suite grows;
  integration marked `*.integration.test.ts` / under `src/test/integration/`.
- **Coverage gate:** 100% reachable-source (per server-2 AGENTS), rare justified exceptions via
  explicit `/* v8 ignore */ + reason`; coverage is a floor, not proof.

# Skills Taxonomy — Night Run (2026-06-13 → 14)

**Status:** DONE — taxonomy decided (V5 + breaker fixes), three research passes + a wave-2
survey landed, drafts implemented and verified in the skills repo working tree (uncommitted),
all extra night work (wave-2 fetcher research, depcruise preset draft, server-2 decision brief,
fetcher smoke-test, review-feedback proposal) complete and listed in the deliverables table
below. Awaiting morning sign-off. **Start here → `RECOMMENDATION.md`** (verdict + sign-off
checklist), then `taxonomy-variants.md` (the debate) and `architecture-convergence.md`
(fetcher/server/parser).

## Зачем (RU TLDR)

Вопрос, который вскрыл проблему: «парсер тогда тоже должен зависеть от
process-backend-standards, так как это бэкенд?» Существующая модель уровней не сходится:
`process-*`-скиллы были кросс-стековыми (review/testing/project биндят и Rust), а новый
`solidstats-shared-backend-ts-standards` наполнен TS-спецификой (фабрики, const-union енумы,
es-toolkit/dayjs, ESLint) — Rust-парсер его потреблять не может, имя врёт.

Ночной прогон: глубоко продумать уровни скиллов (несколько вариантов таксономии, само-дебаты,
judge-панель), прогнать deep-research по архитектурам всех трёх сервисов (фетчер, server-2,
парсер — скиллы ещё толком не применялись, пересмотр дёшев), выбрать рекомендацию и реализовать
её как черновики скиллов. Без коммитов, без rewire потребляющих репо.

## Deliverables (морнинг-чеклист)

| File | What |
|------|------|
| `corpus-audit.md` | Inventory of all 14 skills: scope claims, require-graph, per-section stack-specificity, contradictions. |
| `research-fetcher.md` | Deep-research report: ingest/ETL pipeline architecture (Variant B input). |
| `research-server.md` | Deep-research report: Fastify modular backend practice vs current conventions. |
| `research-parser.md` | Deep-research report: deterministic Rust parser/worker practice vs current conventions. |
| `taxonomy-variants.md` | 3–5 skill-layer taxonomy models, adversarial critique, judge-panel scores, comparison matrix. |
| `architecture-convergence.md` | Fetcher Variant A+B convergence; server-2 and parser convention deltas. |
| `RECOMMENDATION.md` | The chosen taxonomy + architectures, migration plan, what was drafted where, **morning sign-off checklist**. |
| `research-fetcher-wave2.md` | Wave-2: checkpoint-state practice in connector SDKs (design confirmed) + verified boundary-rule snippets. |
| `server2-deferred-decisions.md` | One-minute decision brief: no-pass-through rule, getDecorator, boundary-lint tool, test-mocking strategy. |
| `drafts/fetcher-dependency-cruiser.cjs` (+notes) | Runnable depcruise preset for the 8 fences; predicts 3 current-tree violations. |
| `drafts/fetcher-skills-smoke-test.md` | Usability test of the fetcher trio; its 4 fixes are already applied to the drafts. |
| `drafts/review-feedback-loop-proposal.md` | Estesis-style review-feedback learning tier for the family (backlog, size M). |
| `judge-panel-raw.json`, `corpus-raw.json`, `corpus-compact.json` | Raw structured data behind the debate and the audit. |

Draft skill files land in the skills repo working tree (uncommitted), per RECOMMENDATION.md.

## Ground rules for this run

- No `git commit` / `git push` anywhere.
- No changes to consuming repos (`replays-fetcher`, `server-2`, `replay-parser-2`, `web`).
- Skill drafts only in `~/Projects/SolidGames/skills` working tree, clearly listed in
  RECOMMENDATION.md.
- The half-done "split pass" from the evening (new `solidstats-shared-backend-ts-standards`
  SKILL.md + references, decision pack appended to
  `plans/replays-fetcher/briefs/fetcher-architecture-conventions.md`) is **parked** — treated as
  draft input to the variants, not as a settled decision. The evening decision pack's
  taxonomy choices are superseded by whatever RECOMMENDATION.md says.

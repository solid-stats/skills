# fetcher wave-2: checkpoint state & boundary rulesets

## 1. Checkpoint/resume — verdict: our design matches industry practice. Sign off, no redesign.

What Airbyte / Singer / Meltano / Fivetran / Temporal actually do:

- **State = opaque per-pipeline JSON cursor in an external durable store**, never per-item flags. Singer `STATE.value.bookmarks` keyed by stream ([SPEC](https://github.com/singer-io/getting-started/blob/master/docs/SPEC.md), spot-check **confirmed**); Meltano state backends accept `s3://` and `postgresql://` URIs ([docs](https://docs.meltano.com/concepts/state_backends/)); Temporal stores the checkpoint server-side as `heartbeatDetails` and feeds it back on retry ([docs](https://typescript.temporal.io/api/namespaces/activity)).
- **Batch/page granularity, not per-record.** Airbyte: ≤30 min between checkpoints, sources typically checkpoint per API page ([blog](https://airbyte.com/blog/checkpointing)).
- **Commit protocol = write durably, then advance cursor.** Airbyte certified destinations: "must emit those state messages to STDOUT only after all preceding records have been durably committed" ([docs](https://docs.airbyte.com/platform/connector-development/partner-certified-destinations)). Singer: STATE goes out only after all preceding records are processed ([SPEC](https://github.com/singer-io/getting-started/blob/master/docs/SPEC.md)).
- **At-least-once + idempotent sink is the universal guarantee.** Airbyte incremental is explicitly at-least-once; dedup is the destination's job via PK+cursor ([sync modes](https://docs.airbyte.com/platform/using-airbyte/core-concepts/sync-modes/incremental-append-deduped)). Nobody attempts exactly-once in the checkpoint protocol itself.

Mapping to ours:

| SDK pattern | replays-fetcher | Match |
|---|---|---|
| opaque JSON cursor, external store | checkpoint object in S3 | yes — literally Meltano's S3 backend / Temporal heartbeat store |
| batch granularity | checkpoint per discovery page / staging batch | yes |
| write-then-advance | PG batch commit (ON CONFLICT DO NOTHING) → then write S3 checkpoint | yes — the ordering IS the protocol |
| at-least-once + idempotent sink | staging unique natural key (checksum + source identity) | yes — same as Airbyte append-deduped |

Three adjustments (small, do them):
1. **One pipeline = one versioned opaque object** (`{v: 1, cursor: {...}}`), single S3 key. Don't shard state across keys; every SDK treats state as a single blob the next run receives whole.
2. **Hard ordering invariant in `run/`:** the checkpoint write is sequenced strictly after the staging batch commit returns. Crash between the two ⇒ next run re-scans the window and ON CONFLICT absorbs duplicates. That is by-design at-least-once; do not add transactional coupling between PG and S3.
3. **Checkpoint per batch, with a time ceiling** (Airbyte's 30-min target is a sane upper bound for pathological batches). Skip per-file checkpointing — no SDK does it.

## 2. Boundary rules — best snippets, adapted to our eight fences

Convention to copy first: **named layer-path arrays at the top of the config, referenced in rules** — appears independently in [marcoturi/fastify-boilerplate](https://github.com/marcoturi/fastify-boilerplate/blob/d1068cd2bc461924e62775c7c0e3fa71df56d548/.dependency-cruiser.cjs) and [wx-chevalier/ddd-examples](https://github.com/wx-chevalier/ddd-examples/blob/457d904a8bd75e2ca9f6952551fc6daf051ec730/node/domain-driven-hexagon/.dependency-cruiser.js) (origin: Sairyss/domain-driven-hexagon). Spot-checked, confirmed.

Verbatim snippets worth stealing:

**S1 — upward-import ban with interface escape hatch** ([fastify-boilerplate](https://github.com/marcoturi/fastify-boilerplate/blob/d1068cd2bc461924e62775c7c0e3fa71df56d548/.dependency-cruiser.cjs), confirmed):
```js
{ name: 'no-domain-to-infra-deps', severity: 'error',
  from: { path: domainLayerPaths },
  to:   { path: infrastructureLayerPaths, pathNot: ['port\\.ts$'] } }
```
Template for every "lower layer can't see upper layer" fence; `pathNot: ['port\\.ts$']` is the pattern for letting port/interface files through.

**S2 — entry restricted to one layer** ([dependency-cruiser's own config](https://github.com/sverweij/dependency-cruiser/blob/main/.dependency-cruiser.mjs), confirmed):
```js
{ name: 'bin-to-cli-only', severity: 'error',
  from: { path: '(^bin/)' },
  to: { pathNot: ['^src/cli', '^src/meta[.]cjs$'],
        dependencyTypesNot: ['npm', 'core', 'type-only'] } }
```
Template for "command → run only"; `dependencyTypesNot` keeps npm/core/type-only imports legal.

**S3 — capability/SDK access allowlist** (same file, confirmed):
```js
{ name: 'restrict-fs-access', severity: 'error',
  from: { pathNot: [ /* named allowlist */ ] },
  to:   { path: '^fs$' } }
```
Template for "external SDKs only inside adapters".

**S4 — deny-by-default polarity** ([shortlink-org/shortlink](https://github.com/shortlink-org/shortlink/blob/01ecf6bbfc34fe74948ae90f3882fbdfe6f30df5/boundaries/proxy/eslint.config.js)):
```js
'boundaries/element-types': ['error', { default: 'disallow', rules: [
  { from: ['domain'], allow: ['types', 'interfaces', 'shared-infrastructure'] }, ...
]}]
```
With eight fences, deny-by-default + enumerated legal edges is the right polarity if we go eslint-plugin-boundaries instead of (or alongside) depcruise.

**S5 — deep-import ban lives in ESLint, not depcruise** ([compartmentdev/compartment](https://github.com/compartmentdev/compartment/blob/591aaebe940534b4c47ed1e298f17165acc3e433/packages/eslint-config/shared.mjs)):
```js
{ regex: '^(?:\\.\\./){2,}[^/]+/src/',
  message: 'Do not import another package through a relative ../<package>/src/ path...' }
```

Draft forbidden-rules sketch, one rule pattern per fence:

```js
const commandPaths      = ['^src/command'];
const runPaths          = ['^src/run'];
const capabilityPaths   = ['^src/(discovery|storage|staging|checkpoint|evidence)'];
const adapterPaths      = ['^src/adapters'];
const crossCuttingPaths = ['^src/(source|resilience)'];

forbidden: [
  // F1: command imports run (+ cross-cutting) only            [S2]
  { name: 'command-to-run-only', severity: 'error',
    from: { path: commandPaths },
    to: { path: '^src', pathNot: [...runPaths, ...crossCuttingPaths],
          dependencyTypesNot: ['npm', 'core', 'type-only'] } },

  // F2: run must not reach past capabilities into adapters    [S1]
  { name: 'no-run-to-adapters', severity: 'error',
    from: { path: runPaths }, to: { path: adapterPaths } },

  // F3: capabilities never import upward (run/command)        [S1]
  { name: 'no-capability-upward', severity: 'error',
    from: { path: capabilityPaths }, to: { path: [...runPaths, ...commandPaths] } },

  // F4: capability siblings isolated — generate 5 rules, one per capability [S1]
  { name: 'no-discovery-cross-talk', severity: 'error',
    from: { path: '^src/discovery' },
    to: { path: '^src/(storage|staging|checkpoint|evidence)', pathNot: ['\\.types\\.ts$'] } },
  // ... ×4 for storage/staging/checkpoint/evidence

  // F5: adapters never import upward                          [S1]
  { name: 'no-adapter-upward', severity: 'error',
    from: { path: adapterPaths },
    to: { path: [...commandPaths, ...runPaths, ...capabilityPaths] } },

  // F6: cross-cutting (source/, resilience) is leaf-only      [S1]
  { name: 'cross-cutting-is-leaf', severity: 'error',
    from: { path: crossCuttingPaths },
    to: { path: [...commandPaths, ...runPaths, ...capabilityPaths, ...adapterPaths] } },

  // F7: external SDKs (pg, @aws-sdk, undici, fs) only via adapters [S3 inverted]
  { name: 'sdk-only-in-adapters', severity: 'error',
    from: { pathNot: adapterPaths },
    to: { path: '^(pg|@aws-sdk|undici|node:fs|fs)$' } },

  // F8 baseline: no cycles
  { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
]
```

The eighth structural fence — **modules importable only via their `index.ts`** — cannot be expressed in depcruise forbidden rules (`via` applies only to cycles, per [rules-reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)); implement it as ESLint `no-restricted-imports` regex per S5, e.g. `'^src/(discovery|storage|staging|checkpoint|evidence|adapters)/(?!index)'` from outside the module.

CI wiring (both fastify-boilerplate and Sairyss): separate script, not embedded in lint —
`"deps:validate": "depcruise src --config .dependency-cruiser.cjs --output-type err-long"`.

## 3. What stays uncertain

- **Fivetran cadence numbers ("every 10 min / 1,000 records") failed spot-check** — not present in the cited Airbyte source. Direction (batch granularity) is confirmed via Airbyte; do not cite the Fivetran figures without re-verifying against fivetran.com/docs/connector-sdk.
- **Meltano quotes were paraphrases**, not verbatim from the cited page; the substantive claim (external state backends incl. S3/Postgres) is confirmed by the page itself.
- Airbyte low-code CDK `cursor_field` YAML never fetched (proxy); implementation detail, does not affect the model.
- **Index-only fence requires a tool split** (depcruise can't do it; only OSS evidence is ESLint `no-restricted-imports`). Decision needed: accept depcruise-for-layers + ESLint-for-deep-imports, or drop the fence.
- depcruise vs eslint-plugin-boundaries overlap: evidence supports both; pick one source of truth per fence. Default proposal: depcruise for F1–F8, ESLint only for index-only.
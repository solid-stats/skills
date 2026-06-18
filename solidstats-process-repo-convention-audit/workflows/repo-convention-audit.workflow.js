export const meta = {
  name: 'solidstats-repo-convention-audit',
  description:
    'Whole-repo convention-compliance audit that drives a refactor milestone to full compliance with the solidstats skills — INCLUDING architecture AND tests: extract a rule catalog + layer/band map from the live solidstats-<stack>-conventions / -code-review / -shared standards skills, route files into production vs test, map each production batch against the catalog (Haiku), inventory lint-mechanical rules, sweep the import graph per-rule for cross-file architecture violations (Sonnet), audit test files against the test catalog + the universal conventions, surface untested-branch edge-case leads, re-Read and verify each candidate (Haiku), critic the coverage gaps (Haiku), adjudicate the contested/critical/architecture subset (budgeted Opus), and assemble a JSON deviation report for a downstream fix agent. The conventions are PRESCRIPTIVE — every gap between current code and the agreed standard is a finding. Static read only — no typecheck/tests/run of the target code.',
  phases: [
    { title: 'Scope', detail: 'extract the rule catalog + layer map from the live skills (Sonnet)' },
    { title: 'Enumerate', detail: 'route files into production / test / fixture, batched (Haiku)' },
    { title: 'Find', detail: 'batch × rule-group: focused passes so every rule is applied (Haiku)' },
    { title: 'Mechanical', detail: 'lint-enforced rules: pattern inventory, no verify/adjudicate (Haiku)' },
    { title: 'Structural', detail: 'import graph, swept one rule at a time → architecture/fence/cycle (Sonnet)' },
    { title: 'Verify', detail: 're-Read each candidate span, confirm true violation (Haiku)' },
    { title: 'Recall', detail: 'which rules / dirs / fences were never checked (Haiku)' },
    { title: 'Adjudicate', detail: 'architecture + 🔴 always; contested tail budgeted (Opus)' },
    { title: 'Test', detail: 'test files × test catalog + universal conventions; edge-case leads (§F)' },
  ],
}

// =============================================================================
// solidstats-repo-convention-audit — whole-repo convention audit (refactor driver)
// -----------------------------------------------------------------------------
// WHAT THIS IS (and is NOT):
//   An OPEN-ENDED, whole-repo convention-compliance audit whose PURPOSE is to drive
//   a refactor MILESTONE: surface EVERY way the existing code diverges from the
//   prescribed solidstats standard — architecture/layering INCLUDED — so a downstream
//   fix agent can bring the codebase fully into line ("make it all shine"). It reads
//   EVERY source file in scope and judges it against the FULL ruleset, emitting every
//   deviation as JSON. It is NOT a diff review (solidstats-<stack>-code-review) and
//   NOT a single-claim check (solidstats-process-deep-code-research). No file cap, no
//   grep narrowing, no diff scope — by design.
//
//   PRESCRIPTIVE source, by repo policy (AGENTS.md): a *-conventions skill defines the
//   DESIRED standard, and existing code is brought into line over time — NOT the
//   reverse. So a gap between current code and an APPROVED convention is exactly a
//   finding, even when the diff-reviewer suspends that check for day-to-day PRs (a
//   PR-noise concern this audit OVERRIDES, like §B/§G/§D). The ONLY rules excluded
//   from findings are ones still genuinely UNDECIDED — no agreed target shape yet.
//
// ARCHITECTURE IS A FIRST-CLASS TARGET (two lanes):
//   • Per-file lane (Find) — placement + import-direction violations are visible in a
//     single file's own imports once the reader has the layer/band MAP; the Scope
//     stage extracts that map and Find judges each file against it.
//   • Structural lane (Structural) — the graph-level invariants a single file cannot
//     see: dependency cycles, transitive band-skips, forbidden cross-band client
//     imports (fences), orphaned/unregistered modules. An import-edge map is built by
//     grep and a fence-checker reasons over it.
//   Both lanes' candidates flow through the same Verify → Adjudicate funnel.
//
// WHY THE SHAPE:
//   Deviations are open-ended, so they can't be grep-narrowed to one anchor claim.
//   The harness is enumerate → map(+structural) → verify → recall → adjudicate. The
//   rule source is SINGLE-SOURCED: the catalog is re-derived from the live skills
//   every run (never a forked copy that can drift). Format/severity/citation discipline come
//   from solidstats-shared-review-standards, but three of its diff-review
//   disciplines are deliberately OVERRIDDEN for an exhaustive audit:
//     • §B scope-discipline OFF — the whole repo IS the target, not a diff.
//     • §G noise filter OFF — report every occurrence; the consumer is an agent.
//     • §D markdown format OFF — emit JSON, not a human report.
//   Severity (§C 🔴🟠🟡🔵) and [conv:]/[std:] citation + evidence-before-opinion
//   are KEPT (severity is a sortable field; the citation ties each finding to a rule).
//
// RATE-LIMIT POLICY (Claude Max 20x subscription, NOT an API tier):
//   Two distinct limits, two distinct levers —
//     • 429 burst throttle  → an in-script Opus SEMAPHORE (default 5). The Workflow
//       global cap min(16, cores−2) does NOT split by model, so Opus needs its own.
//     • weekly Opus budget  → a per-run Opus-CALL BUDGET (default 24, top-N most
//       contested). Reported as meta.opusAdjudications.used / skippedByBudget.
//   All wide fan-out (Enumerate/Find/Verify/Recall) is HAIKU. Scope + Structural are
//   SONNET (catalog/layer-map extraction and import-graph reasoning need the judgment).
//   Opus runs ONLY on the contested / 🔴🟠 subset. Every Opus call shares one
//   verbatim prefix (catalog + span template) so the Anthropic prompt cache
//   amortizes the catalog across adjudications.
//
// HOW TO RUN — normally via the wrapper skill `solidstats-process-repo-convention-audit`.
//   Direct form, run FROM (or pointed AT) the repo being audited:
//     Workflow({ scriptPath: '<…>/workflows/repo-convention-audit.workflow.js',
//                args: { repo: '/abs/path/to/replays-fetcher', stack: 'fetcher' } })
//   args: repo (abs path; default = session cwd), stack (fetcher|server|parser;
//   auto-detected when omitted), commit (recorded in meta; auto-read when omitted),
//   includeTests (default false — tests are a separate lighter lane in v1),
//   opusBudget (default 24), opusConcurrency (default 5).
// =============================================================================

// --- args (may arrive parsed OR as a JSON string — normalize, else fields read null)
const A = (() => {
  if (!args) return {}
  if (typeof args === 'string') {
    try {
      return JSON.parse(args)
    } catch {
      return {}
    }
  }
  return args
})()

const repo = A.repo || null
const forcedStack = A.stack || null
const forcedCommit = A.commit || null
const includeTests = A.includeTests === true
const OPUS_BUDGET = Number.isInteger(A.opusBudget) ? A.opusBudget : 40
const OPUS_CONCURRENCY = Number.isInteger(A.opusConcurrency) ? A.opusConcurrency : 5

// Every agent must operate on the target repo, which may not be the shell cwd. The
// audit agents use `git -C <repo>` + absolute paths and read the installed skills
// from <repo>/.claude/skills/ — they do NOT cd (cwd doesn't persist across commands).
const inRepo = repo
  ? `IMPORTANT — audit the repository at \`${repo}\`, which is NOT your shell's cwd. Run EVERY git/shell command with an explicit path (e.g. \`git -C ${repo} …\`, \`ls ${repo}/src\`), reference every file by its ABSOLUTE path under \`${repo}\`, and read the installed skills from \`${repo}/.claude/skills/\`. Do NOT rely on \`cd\` — the working directory does not persist across separate shell commands. Confirm the root with \`git -C ${repo} rev-parse --show-toplevel\` first.`
  : 'Audit the repository at the session cwd; plain git/shell commands resolve there.'

// Stack → the rule-source skills the catalog is extracted from. The shared review
// standard is always included (severity buckets + [conv:]/[std:] citation discipline).
const STACK_SKILLS = {
  fetcher: {
    conventions: 'solidstats-fetcher-ts-conventions',
    review: 'solidstats-fetcher-ts-code-review',
    standards: ['solidstats-shared-backend-ts-standards', 'solidstats-shared-ts-standards'],
    tests: 'solidstats-fetcher-ts-tests',
    exts: ['.ts', '.tsx', '.mts', '.cts'],
  },
  server: {
    conventions: 'solidstats-server-ts-conventions',
    review: 'solidstats-server-ts-code-review',
    standards: ['solidstats-shared-backend-ts-standards', 'solidstats-shared-ts-standards'],
    tests: 'solidstats-server-ts-tests',
    exts: ['.ts', '.tsx', '.mts', '.cts'],
  },
  parser: {
    conventions: 'solidstats-parser-rust-conventions',
    review: 'solidstats-parser-rust-code-review',
    standards: [],
    tests: 'solidstats-parser-rust-tests',
    exts: ['.rs'],
  },
}

const SEVERITIES = ['🔴', '🟠', '🟡', '🔵']
const SEVERITY_WEIGHT = { '🔴': 4, '🟠': 3, '🟡': 2, '🔵': 1 }

// Static-analysis caveats — emitted in meta.blindSpots on every report so the
// consumer never mistakes "static read found nothing" for "runtime-proven safe".
const BLIND_SPOTS = [
  'No typecheck, tests, or execution of the TARGET CODE — runtime behavior and real config/env values are invisible. (The audit may refresh its own graphify analysis graph via `graphify update`, which graphify documents as no-API-cost static extraction, not a product build/test.)',
  'Grep/Read-evading constructs (dynamic dispatch, reflection, codegen, string-built SQL/identifiers, macro expansion) can hide both violations and the code that would refute one.',
  'The structural lane uses the graphify knowledge graph, refreshing it to HEAD with `graphify update` when the built-commit lags; it degrades to a grep-built import map only if graphify is unavailable (recorded in the edge data). Dynamic/conditional imports can still escape any static graph — treat cycle/orphan findings as leads to confirm with depcruise/clippy, not proof.',
]

// --- in-script Opus semaphore: caps CONCURRENT Opus calls (the 429 lever). The
// Workflow global cap does not split by model, so adjudication needs its own gate.
function makeSemaphore(max) {
  let active = 0
  const queue = []
  const pump = () => {
    if (active >= max || queue.length === 0) return
    active++
    const run = queue.shift()
    run()
  }
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push(() =>
        Promise.resolve()
          .then(fn)
          .then(resolve, reject)
          .finally(() => {
            active--
            pump()
          })
      )
      pump()
    })
}

// Retry an agent thunk that returns a falsy/empty result (a transient API drop or a
// "completed without StructuredOutput" failure both surface as null). Used for single-point
// stages (structural per-rule finders) where one drop silently loses a whole rule.
async function withRetry(fn, tries = 3, ok = (r) => r != null) {
  let r = null
  for (let i = 0; i < tries && !ok(r); i++) r = await fn()
  return r
}

// --- schemas -----------------------------------------------------------------

const CATALOG = {
  type: 'object',
  required: ['stack', 'rules', 'layerMap'],
  properties: {
    stack: { type: 'string', enum: ['fetcher', 'server', 'parser'] },
    rules: {
      type: 'array',
      description: 'every auditable rule derived from the live skills, one per detectable convention (architecture rules INCLUDED)',
      items: {
        type: 'object',
        required: ['ruleId', 'title', 'howToDetect', 'severity', 'citation', 'suspended', 'crossFile', 'architecture', 'mechanical', 'appliesToTests'],
        properties: {
          ruleId: { type: 'string', description: 'stable kebab id, e.g. "zod-derive-type" or "band-no-upward-import"' },
          title: { type: 'string', description: 'one-line rule statement' },
          appliesToTests: {
            type: 'boolean',
            description: 'true if this is a UNIVERSAL code-style/quality/typing rule that applies to ALL code including test files (type-over-interface, no-any, no-unexplained-as-cast, import-order, naming, comments-english, srp-function-length). FALSE for production-architecture/domain rules (band/layer/placement, ingest invariants, Zod-config-form, exit-codes, DB-write-scope, parameterized-SQL) — those do not bind test files. The test lane audits test files against the appliesToTests=true subset PLUS the separate test catalog.',
          },
          howToDetect: {
            type: 'string',
            description: 'what a reader looks for to flag a violation — concrete; for crossFile rules describe the import-graph signal; for mechanical rules give the exact grep-able pattern',
          },
          severity: { type: 'string', enum: SEVERITIES, description: 'typical §C bucket if violated' },
          citation: { type: 'string', description: 'the [conv: §X] / [std: §X] reference for this rule' },
          mechanical: {
            type: 'boolean',
            description: 'true if the rule is fully enforced by ESLint/Prettier/tsc/Clippy and a violation is a pure pattern match (e.g. type-over-interface, no-any, import-order, no-console, esm-js-extensions). These are INVENTORIED by a cheap pattern sweep — never sent through per-occurrence LLM verify/adjudicate (re-deriving a linter is waste — shared §G). A rule that needs semantic judgment (typed-errors-only, no-floating-promises) is NOT mechanical.',
          },
          suspended: {
            type: 'boolean',
            description: 'true ONLY for genuinely UNDECIDED rules — still PROPOSED/under debate with NO agreed target shape. An APPROVED/signed-off convention the code does not yet meet is NOT suspended (that gap is the milestone fuel). Diff-reviewer PR-gate suspensions do NOT make a rule suspended here.',
          },
          crossFile: {
            type: 'boolean',
            description: 'true if the rule needs the import graph across files (cycles, transitive band-skip, orphan/unregistered, a global fence) — routed to the Structural lane. A per-file-visible layer rule (a file importing upward, wrong-band placement) is crossFile=FALSE — Find checks it with the layerMap.',
          },
          architecture: {
            type: 'boolean',
            description: 'true if this is a layering/band/placement/dependency-direction/fence rule (the primary refactor targets)',
          },
        },
      },
    },
    layerMap: {
      type: 'array',
      description: 'the stack architecture as data so downstream stages can judge placement + import direction: one entry per band/layer/crate (empty [] only if the stack genuinely has no layering)',
      items: {
        type: 'object',
        required: ['unit', 'role', 'dirs', 'mayDependOn'],
        properties: {
          unit: { type: 'string', description: 'band/layer/crate name, e.g. "Capability", "parser-core"' },
          role: { type: 'string', description: 'what it holds / its responsibility' },
          dirs: { type: 'array', items: { type: 'string' }, description: 'path globs that belong to this unit' },
          mayDependOn: { type: 'array', items: { type: 'string' }, description: 'units this one is allowed to import; everything else is a fence violation' },
          fences: { type: 'array', items: { type: 'string' }, description: 'explicit forbidden-import rules (e.g. "only staging/ may import the pg client", "no module imports an OCAP parser")' },
        },
      },
    },
    compositionRoot: {
      type: 'array',
      items: { type: 'string' },
      description: 'path glob(s) of the DEPENDENCY-INJECTION composition root — the file(s) that assemble/inject dependencies (e.g. the commands/ handler with resolveDependencies, an app bootstrap). Imports here are WIRE-TIME (construct/inject + reference types) and are EXEMPT from band-direction/band-skip rules — the composition root legitimately references every band it wires. Empty [] if none. Only END-USE orchestration in such a file (running another band\'s logic, not merely constructing it) is a real band violation.',
    },
  },
}

const ENUM = {
  type: 'object',
  required: ['commit', 'batches', 'testBatches', 'fixtureFiles', 'dirsSkipped'],
  properties: {
    commit: { type: 'string', description: 'HEAD short SHA, or "" if not a git repo' },
    batches: {
      type: 'array',
      description: 'PRODUCTION source files grouped by module/directory (keep each batch ≤ ~12 files)',
      items: {
        type: 'object',
        required: ['dir', 'files'],
        properties: {
          dir: { type: 'string' },
          files: { type: 'array', items: { type: 'string', description: 'path relative to repo root' } },
        },
      },
    },
    testBatches: {
      type: 'array',
      description: 'TEST files grouped by module (a co-located unit + its decomposed suite together); ≤ ~10 files/batch',
      items: {
        type: 'object',
        required: ['dir', 'files', 'kind'],
        properties: {
          dir: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
          kind: { type: 'string', enum: ['unit', 'integration', 'contract'], description: 'unit | integration | contract' },
        },
      },
    },
    fixtureFiles: {
      type: 'array',
      items: { type: 'string' },
      description: 'fixture/helper files (*.fixtures.ts, /tests/ helpers, golden loaders) — noted, not judged by either lane except the no-production-logic check',
    },
    dirsSkipped: {
      type: 'array',
      items: { type: 'string' },
      description: 'excluded dirs/globs (node_modules, dist, target, migrations, generated, examples)',
    },
  },
}

const FIND = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['ruleId', 'file', 'lineStart', 'lineEnd', 'quote', 'why'],
        properties: {
          ruleId: { type: 'string' },
          file: { type: 'string', description: 'repo-relative path' },
          lineStart: { type: 'integer' },
          lineEnd: { type: 'integer' },
          quote: { type: 'string', description: 'verbatim source slice at those lines — the evidence' },
          why: { type: 'string', description: 'one line: how this violates the cited rule' },
        },
      },
    },
  },
}

const IMPORT_MAP = {
  type: 'object',
  required: ['edges'],
  properties: {
    edges: {
      type: 'array',
      description: 'one entry per source file: its internal (same-repo) imports, for cross-file architecture reasoning',
      items: {
        type: 'object',
        required: ['file', 'imports'],
        properties: {
          file: { type: 'string', description: 'repo-relative path' },
          unit: { type: 'string', description: 'the layerMap unit this file belongs to, or "" if unmapped' },
          imports: {
            type: 'array',
            description: 'internal modules this file imports (repo-relative target path or module specifier), with the line',
            items: {
              type: 'object',
              required: ['target', 'line'],
              properties: {
                target: { type: 'string' },
                line: { type: 'integer' },
                targetUnit: { type: 'string', description: 'the layerMap unit the target belongs to, or "" if external/unmapped' },
              },
            },
          },
        },
      },
    },
  },
}

const VERIFY = {
  type: 'object',
  required: ['verified', 'severity', 'message', 'fix', 'confidence', 'contested'],
  properties: {
    verified: {
      type: 'boolean',
      description: 'true only if the quote still exists at those lines, is live code (not a comment/dead branch), and truly breaks the cited rule',
    },
    severity: { type: 'string', enum: SEVERITIES },
    message: { type: 'string', description: 'the deviation, stated for the downstream agent' },
    fix: { type: 'string', description: 'the concrete correction per the convention' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    contested: {
      type: 'boolean',
      description: 'true if the verdict is genuinely arguable (rule interpretation unclear, severity borderline) — flags it for Opus',
    },
  },
}

const RECALL = {
  type: 'object',
  required: ['rulesNotChecked', 'dirsNotChecked', 'gaps'],
  properties: {
    rulesNotChecked: {
      type: 'array',
      items: { type: 'string' },
      description: 'active ruleIds that no batch could meaningfully check (often the cross-file ones)',
    },
    dirsNotChecked: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' }, description: 'free-text coverage caveats' },
  },
}

const ADJUDICATE = {
  type: 'object',
  required: ['verified', 'severity', 'message', 'fix', 'rationale'],
  properties: {
    verified: { type: 'boolean' },
    severity: { type: 'string', enum: SEVERITIES },
    message: { type: 'string' },
    fix: { type: 'string' },
    rationale: { type: 'string', description: 'why this verdict/severity, citing the rule' },
  },
}

// =============================================================================
// Phase 1 — Scope: extract the rule catalog from the LIVE skills (Sonnet)
// =============================================================================

phase('Scope')

const stackHint = forcedStack
  ? `The caller set stack="${forcedStack}".`
  : 'Infer the stack from the repo (package.json + tsconfig → fetcher/server; Cargo.toml → parser) and the skills present under .claude/skills/.'

const skillsList = forcedStack && STACK_SKILLS[forcedStack]
  ? `For this stack read: \`${STACK_SKILLS[forcedStack].conventions}\`, \`${STACK_SKILLS[forcedStack].review}\`${
      STACK_SKILLS[forcedStack].standards.length
        ? ', ' + STACK_SKILLS[forcedStack].standards.map((s) => `\`${s}\``).join(', ')
        : ''
    }, and \`solidstats-shared-review-standards\`.`
  : 'fetcher/server → the matching `solidstats-<stack>-ts-conventions` + `-ts-code-review` + `solidstats-shared-backend-ts-standards` + `solidstats-shared-ts-standards`; parser → `solidstats-parser-rust-conventions` + `-code-review`. Always include `solidstats-shared-review-standards`.'

const catalogPrompt = `You extract the AUDITABLE RULE CATALOG + LAYER MAP for a whole-repo convention audit. ${inRepo}

The audit's PURPOSE is to drive a refactor MILESTONE: surface every way the current code diverges from the prescribed solidstats standard — ARCHITECTURE INCLUDED — so a fix agent can bring the whole repo into compliance. The conventions are PRESCRIPTIVE (they define the desired standard; existing code is pulled into line over time, not the reverse). So your catalog must cover architecture/layering rules as fully as it covers naming and error-handling — those layer gaps are the main point of this run.

${stackHint}
Read the live rule-source skills (installed under \`<repo>/.claude/skills/\` — read them THIS run, never from memory or a cached copy; the catalog must track the current skills). ${skillsList}

Produce one catalog entry per concrete, detectable convention rule across those skills. For each rule:
- \`ruleId\`: a stable kebab-case id you will reuse for every occurrence (e.g. \`zod-derive-type\`, \`no-process-exit\`, \`band-no-upward-import\`, \`wrong-band-placement\`).
- \`title\`: the one-line rule.
- \`howToDetect\`: exactly what a reader looks for to flag a violation — concrete and operational. For an architecture rule, describe the IMPORT signal (e.g. "a file under an Adapter dir imports from a run/ Orchestration module — upward import across a band").
- \`severity\`: the typical §C bucket (🔴/🟠/🟡/🔵) from the reviewer's Severity reference table.
- \`citation\`: the \`[conv: §X]\` / \`[std: §X]\` reference.
- \`appliesToTests\`: TRUE if this is a UNIVERSAL code-style/quality/typing rule that binds ALL code, test files included — \`type\`-over-\`interface\`, no-\`any\`, no-unexplained-\`as\`, import-order, identifier naming, comments-in-English, function-length/SRP. FALSE for production-architecture/domain rules (band/layer/placement, ingest invariants, Zod-config-form, exit-code mapping, DB-write-scope, parameterized-SQL, idempotent-staging) — those do not apply to test files. (The audit runs a separate TEST lane that judges test files against the appliesToTests=true subset PLUS a dedicated test catalog.)
- \`architecture\`: TRUE for any layering / band-placement / dependency-direction / fence rule.
- \`mechanical\`: TRUE only if a LITERAL grep with NO further judgment is 100% correct — \`type\`-over-\`interface\`, no-\`any\`, no-non-null-\`!\`, import-order, no-\`console\`, ESM \`.js\` extensions, kebab filenames (give the exact grep pattern in howToDetect). These get a cheap pattern INVENTORY, never per-occurrence LLM verify/adjudicate (re-deriving ESLint 96× is the waste shared §G warns against). NOT mechanical if telling a real violation from a benign match needs ANY interpretation: blanket vs targeted (\`/* eslint-disable */\` vs \`/* eslint-disable max-lines -- reason */\` — only the first is a "no-blanket-disable" hit), \`any\` in a comment vs a real \`: any\`, or any rule needing semantic judgment (typed-errors-only, no-floating-promises, SQL-parameterized). Those go to the per-file Find lane where the verifier can judge. A wrongly-mechanical rule ships unverified false positives.
- \`suspended\`: TRUE **only** for a rule that is still genuinely UNDECIDED — explicitly PROPOSED / under debate with NO agreed target shape yet. Crucial distinction: an architecture that is **APPROVED / signed off** (e.g. the fetcher's five-band pipeline, marked APPROVED 2026-06-13) is NOT suspended even though the current code predates it and even though the diff-reviewer skill still defers the check for everyday PRs — that PR-gate deferral is a noise concern this audit OVERRIDES, and the code↔target gap is precisely what the milestone must fix. Mark \`suspended\` true only when there is no agreed standard to measure against at all. (The fetcher §B ingest INVARIANTS bind today and are never suspended.)
- \`crossFile\`: TRUE if judging the rule needs the import graph ACROSS files — dependency cycles, transitive band-skips, "is every declared handler/route actually registered", an orphaned/unreferenced module, a global fence ("only staging/ may import pg"). FALSE for a rule visible in ONE file's own imports (that file importing upward, or sitting in the wrong band) — Find handles those with the layerMap. crossFile rules are routed to the Structural lane, NOT dropped.

Also produce \`layerMap\`: the stack's architecture as DATA — one entry per band/layer/crate with its \`dirs\` globs, the units it \`mayDependOn\`, and any explicit \`fences\`. Derive it from the conventions architecture section (fetcher five-band table; server module/layer rules; parser crate-dependency rules). This map is what the per-file Find and the Structural lane both use to judge placement and import direction. If the stack genuinely has no layering, return \`layerMap: []\`.

And \`compositionRoot\`: the path glob(s) of the dependency-injection composition root — the file(s) that ASSEMBLE/inject dependencies (the fetcher conventions say \`commands/\` does dependency assembly, e.g. \`commands/shared.ts\` \`resolveDependencies\`; for server an app/bootstrap composition file). Imports there are wire-time and exempt from band rules. Empty [] if the stack has none.

Be thorough — completeness of the catalog AND the layerMap is what lets the milestone trust "this is every deviation." Return the schema only (this is data the workflow consumes).`

// The catalog is the run's single point of failure — a transient API drop here aborts a 30-min
// audit before it starts. Retry a few times before giving up (agent() already retries terminal
// errors internally; this survives a mid-response connection close that still returns null).
let catalog = null
for (let attempt = 1; attempt <= 3 && !(catalog && Array.isArray(catalog.rules) && catalog.rules.length); attempt++) {
  if (attempt > 1) log(`Scope: catalog attempt ${attempt}/3 (previous returned no usable catalog).`)
  catalog = await agent(catalogPrompt, { schema: CATALOG, label: `catalog${attempt > 1 ? `:retry${attempt}` : ''}`, phase: 'Scope', model: 'sonnet' })
}

if (!catalog || !Array.isArray(catalog.rules) || catalog.rules.length === 0) {
  log('Scope failed — no rule catalog extracted after 3 attempts; cannot audit.')
  return { error: 'rule-catalog-extraction-failed', meta: { repo, stack: forcedStack || 'unknown', staticOnly: true } }
}

const stack = catalog.stack || forcedStack || 'unknown'
const exts = (STACK_SKILLS[stack] && STACK_SKILLS[stack].exts) || ['.ts', '.tsx', '.rs']

// Rust keeps unit tests INLINE in production files via `#[cfg(test)] mod tests`. Those
// files are correctly in scope, but their test blocks are test scaffold — judge only the
// production code, or test fixtures (`unwrap()`, mock structs) read as production violations.
const inlineTestNote =
  stack === 'parser'
    ? ' Rust note: production `.rs` files embed `#[cfg(test)] mod tests` blocks — IGNORE everything inside a `#[cfg(test)]` / `#[test]` block; flag only production code paths.'
    : ''

const suspendedRuleIds = catalog.rules.filter((r) => r.suspended).map((r) => r.ruleId)
// Three lanes + one excluded set:
//   perFileRules    → the grouped Find pipeline (semantic file-local signals, incl. per-file layer rules)
//   structuralRules → the Structural lane, swept ONE RULE AT A TIME against the import graph
//   mechanicalRules → a cheap pattern INVENTORY (count + occurrence list), NO verify/adjudicate funnel
//   suspendedRules  → coverage only (genuinely undecided; no agreed target)
const structuralRules = catalog.rules.filter((r) => !r.suspended && r.crossFile && !r.mechanical)
const structuralRuleIds = structuralRules.map((r) => r.ruleId)
const mechanicalRules = catalog.rules.filter((r) => !r.suspended && r.mechanical && !r.crossFile)
const perFileRules = catalog.rules.filter((r) => !r.suspended && !r.crossFile && !r.mechanical)
const ruleById = new Map(catalog.rules.map((r) => [r.ruleId, r]))
const layerMap = Array.isArray(catalog.layerMap) ? catalog.layerMap : []
const compositionRoot = Array.isArray(catalog.compositionRoot) ? catalog.compositionRoot : []
const archCount = catalog.rules.filter((r) => !r.suspended && r.architecture).length

// Universal subset (req: tests are judged by ordinary conventions too) — the production rules that
// bind ALL code (type-over-interface, no-any, naming…), reused by the TEST lane alongside the test
// catalog. Architecture/domain rules (appliesToTests=false) never touch test files.
const universalRules = catalog.rules.filter((r) => !r.suspended && r.appliesToTests && !r.crossFile)

// Fix #5 — the composition root (DI assembly point) legitimately imports across bands at wire time;
// band-direction/band-skip rules must NOT flag those imports. Only end-use orchestration there is a
// violation. Injected into the per-file layer check and the structural sweep.
const compositionRootClause = compositionRoot.length
  ? `\n\nCOMPOSITION-ROOT EXEMPTION: files matching ${JSON.stringify(compositionRoot)} are the dependency-injection assembly point. Their imports exist to CONSTRUCT/INJECT dependencies and reference their types — that is authorized; do NOT flag them as band-skip / upward / wrong-band. Flag such a file ONLY if it RUNS another band's end-use logic (orchestration) rather than merely wiring it.`
  : ''

// Fix #2 — guarantee FULL-CATALOG coverage: a single Find pass over 80+ rules made the Haiku agent
// cherry-pick ~11 of them (pilot: ~75/86 rules never checked). Chunk the semantic per-file rules into
// small GROUPS and run one focused Find per (batch × group) so every rule is actually applied.
const GROUP_SIZE = 10
const ruleGroups = []
for (let i = 0; i < perFileRules.length; i += GROUP_SIZE) ruleGroups.push(perFileRules.slice(i, i + GROUP_SIZE))

log(
  `Scope: stack=${stack} rules=${catalog.rules.length} (per-file=${perFileRules.length} in ${ruleGroups.length} groups, structural=${structuralRules.length}, mechanical=${mechanicalRules.length}, architecture=${archCount}, suspended=${suspendedRuleIds.length}); layerMap units=${layerMap.length}`
)

if (perFileRules.length === 0 && structuralRules.length === 0 && mechanicalRules.length === 0) {
  log('No active rules after removing suspended — nothing to audit.')
  return {
    meta: { repo, stack, commit: forcedCommit || '', staticOnly: true, blindSpots: BLIND_SPOTS, opusAdjudications: { used: 0, skippedByBudget: 0 } },
    coverage: { suspendedRuleIds, rulesNotChecked: [], dirsSkipped: [] },
    summary: { byRule: {}, bySeverity: { '🔴': 0, '🟠': 0, '🟡': 0, '🔵': 0 } },
    findings: [],
  }
}

// Compact, verbatim slices reused across stage prompts (stable bytes → prompt-cache friendly).
const groupCatalogJson = (group) =>
  JSON.stringify(
    group.map((r) => ({ ruleId: r.ruleId, title: r.title, howToDetect: r.howToDetect, severity: r.severity, citation: r.citation, architecture: !!r.architecture })),
    null,
    2
  )
const activeCatalogJson = groupCatalogJson(perFileRules) // full per-file catalog, for the Opus prefix
const layerMapJson = JSON.stringify(layerMap, null, 2)
// The layer-context clause Find needs to judge placement + import direction per file.
const layerClause = layerMap.length
  ? `\n\nLAYER MAP (judge each file's PLACEMENT and its own IMPORT directions against this — a file under one unit's \`dirs\` importing a module outside that unit's \`mayDependOn\`, or sitting in the wrong unit, is an architecture violation; cite the matching architecture ruleId):\n\`\`\`json\n${layerMapJson}\n\`\`\`${compositionRootClause}`
  : ''

// =============================================================================
// Phase 2 — Enumerate: list & batch every in-scope source file (Haiku)
// =============================================================================

phase('Enumerate')

// ROUTING (not exclusion): tests are reliability-critical and audited by a separate TEST lane, so
// Enumerate SPLITS files — production vs test vs fixture/helper — instead of dropping tests. The
// classification is a PATH-SEGMENT problem (server-2 keeps non-`.test.ts` helpers inside `/tests/`),
// and the `/examples/`,`/tests/` anchors must NOT swallow `src/bin/` (parser-quality's production
// binaries). Misrouting a test into the production batches is what flooded the pilot with false
// `type-over-interface`-on-`.test.ts` findings — keep the split clean.
const rustNote =
  stack === 'parser'
    ? `\n- (Rust) \`crates/*/tests/*.rs\` → TEST (integration); \`crates/*/examples/*.rs\` → EXCLUDE (codegen drivers, dirsSkipped); \`crates/*/src/bin/*.rs\` → PRODUCTION. A production \`.rs\` file with an inline \`#[cfg(test)]\` block is DUAL: put it in \`batches\` (production) AND in \`testBatches\` (kind:unit) so the test lane judges its test block — the production Find ignores the \`#[cfg(test)]\` span and the test lane judges only it.`
    : ''

const enumeration = await agent(
  `You enumerate every tracked source/test file for a whole-repo convention audit and ROUTE each into PRODUCTION, TEST, or FIXTURE. ${inRepo}

Drive enumeration from \`git -C <repo> ls-files\` (TRACKED files only) — NOT a filesystem walk: \`graphify-out/\` and \`.planning/generated/\` exist on disk untracked and a \`find\` would wrongly include them. Read HEAD's short SHA into \`commit\` (\`git -C <repo> rev-parse --short HEAD\`), or "" if not a git repo.

Consider only files with an in-scope extension (${exts.join(', ')}; drop \`*.d.ts\`). EXCLUDE entirely (→ dirsSkipped, neither lane): \`node_modules/\`, \`dist/\`, \`build/\`, \`target/\`, \`.git/\`, \`coverage/\`, \`.coverage/\`, \`graphify-out/\`, \`.mempalace/\`, \`gsd-briefs/\`, \`docs/\`, \`deploy/\`, \`.planning/\` (carries spike probes with INTENTIONAL violations — CRITICAL to drop), \`.agents/\`, \`.claude/\`, database \`migrations/\`, the repo-ROOT \`openapi/\` (generated; but KEEP \`src/openapi/\`), \`schemas/\` (parser), root \`vitest.config.ts\` / \`*.config.ts\` / \`.dependency-cruiser.cjs\`, and (parser) \`crates/*/examples/\`.

ROUTE every surviving file by FIRST MATCH:
1. FIXTURE/HELPER → \`fixtureFiles\`: \`*.fixtures.ts\`, golden-fixture loaders, and helper files inside a \`/tests/\` dir whose name does NOT end in \`.test.\` (e.g. \`utilities.ts\`, \`references.ts\`, \`insert-assertions.ts\`).
2. TEST → \`testBatches\` with \`kind\`:
   - \`*.integration.test.*\`, \`/test/integration/\`, \`*/tests/postgres.test.ts\`, \`*.golden.test.ts\`, \`src/test/app.test.ts\` → kind \`integration\`;
   - \`*.contract.test.ts\` / \`frozen-contract.test.ts\` (openapi) → kind \`contract\`;
   - any other \`*.test.*\` / \`*.spec.*\`, or a non-helper file under a \`/tests/\`,\`/test/\`,\`/__tests__/\` dir → kind \`unit\`.${rustNote}
3. PRODUCTION → \`batches\`: everything else.

Batch PRODUCTION by module/dir (≤ ~12 files; split large dirs like \`src/modules/\` per-module). Batch TEST by module too — keep a co-located unit and its decomposed \`<unit>/tests/\` suite in the SAME testBatch (≤ ~10 files). Do NOT read file contents — enumeration only. Return the schema only.`,
  { schema: ENUM, label: 'enumerate', phase: 'Enumerate', model: 'haiku' }
)

if (!enumeration || !Array.isArray(enumeration.batches) || enumeration.batches.length === 0) {
  log('Enumerate failed — no source files found in scope.')
  return {
    meta: { repo, stack, commit: forcedCommit || '', staticOnly: true, blindSpots: BLIND_SPOTS, opusAdjudications: { used: 0, skippedByBudget: 0 } },
    coverage: { suspendedRuleIds, rulesNotChecked: [...structuralRuleIds, ...perFileRules.map((r) => r.ruleId), ...mechanicalRules.map((r) => r.ruleId)], dirsSkipped: enumeration ? enumeration.dirsSkipped || [] : [] },
    summary: { byRule: {}, bySeverity: { '🔴': 0, '🟠': 0, '🟡': 0, '🔵': 0 } },
    findings: [],
  }
}

const commit = forcedCommit || enumeration.commit || ''
const testBatches = Array.isArray(enumeration.testBatches) ? enumeration.testBatches : []
const fixtureFiles = Array.isArray(enumeration.fixtureFiles) ? enumeration.fixtureFiles : []
const productionFileSet = new Set(enumeration.batches.flatMap((b) => b.files || []))
const totalFiles = productionFileSet.size
const totalTestFiles = testBatches.reduce((n, b) => n + (b.files ? b.files.length : 0), 0)
log(`Enumerate: ${totalFiles} production files in ${enumeration.batches.length} batches; ${totalTestFiles} test files in ${testBatches.length} testBatches; ${fixtureFiles.length} fixtures; skipped ${(enumeration.dirsSkipped || []).length} dir(s).`)

// =============================================================================
// Phases 3–4 — Find then Verify, pipelined per batch (Haiku)
//   Each batch flows Find → Verify independently (no barrier): a batch can be in
//   Verify while another is still in Find. Verify fans out per candidate inside
//   the batch's stage so a slow span never blocks the next batch.
// =============================================================================

phase('Find')

// One verifier, reused by BOTH lanes (per-file Find and the Structural pass) so every
// candidate — naming, error-handling, or a cross-file fence break — passes the same
// re-Read-the-span funnel. Returns the candidate enriched with the verdict, or null.
const verifyCandidate = (c) => {
  const rule = ruleById.get(c.ruleId)
  const ruleBlock = rule
    ? `Rule \`${c.ruleId}\` — ${rule.title}\nHow it's violated: ${rule.howToDetect}\nTypical severity: ${rule.severity}  Citation: ${rule.citation}`
    : `Rule \`${c.ruleId}\` (not in catalog — treat the candidate's own \`why\` as the rule statement).`
  // The TEST lane judges test code, so the production "ignore #[cfg(test)]" note is inverted there.
  const liveCodeNote =
    c.lane === 'test'
      ? stack === 'parser'
        ? ' This is a TEST-lane finding — judge the test code (INCLUDING `#[cfg(test)]` blocks); that IS the subject here.'
        : ''
      : inlineTestNote
  return agent(
    `You VERIFY a single candidate ${c.lane === 'test' ? 'TEST-quality' : 'convention'} violation. ${inRepo}

Candidate:
- ruleId: \`${c.ruleId}\`${c.kind === 'structural' ? ' (cross-file architecture finding — the violation is the IMPORT/dependency relationship, confirm the import edge actually exists)' : ''}
- file: \`${c.file}\`  lines ${c.lineStart}-${c.lineEnd}
- claimed quote:
\`\`\`
${c.quote}
\`\`\`
- finder's reasoning: ${c.why}

${ruleBlock}

Re-Read \`${c.file}\` around lines ${c.lineStart}-${c.lineEnd}. \`verified\` is your VERDICT, not a description — set it TRUE only if ALL hold:
1. The quoted code still exists at (or very near) those lines.
2. It is LIVE code — not inside a comment, a string, or a disabled/dead branch.${liveCodeNote}
3. It genuinely breaks THIS rule (re-read the rule; do not invent a stricter one).${c.kind === 'structural' ? ' For an import-direction/fence finding, also confirm the import target really belongs to the band the rule forbids (a re-export or type-only import can be a false edge), and that a CYCLE rule actually has a reverse edge — a one-way import is NOT a cycle.' : ''}
If ANY of the three fails, set \`verified\` = FALSE. Hard rule: \`verified:true\` and a \`message\` that says "false positive" / "no violation" / "not actually" is a CONTRADICTION — if your message would say that, the verdict is FALSE. The \`message\` of a verified finding states the violation for a fix agent; it never argues the finding away.
Then set the final \`severity\` (§C bucket — pick the higher on genuine ambiguity), the concrete \`fix\` per the convention, your \`confidence\`, and \`contested\` = true only if the verdict is genuinely arguable (rule interpretation or severity borderline). Return the schema only.`,
    { schema: VERIFY, label: `verify:${c.file}:${c.lineStart}`, phase: 'Verify', model: 'haiku' }
  ).then((v) => (v ? { ...c, ...v, stack } : null))
}

// Fix #2 — one focused Find per (batch × rule-group). A unit's agent checks the batch's files
// against ONLY its ~10 rules, so it can't cherry-pick a few and skip the rest (the pilot's
// ~75/86-unchecked failure). Each unit pipelines Find → Verify independently.
const findUnits = []
for (const batch of enumeration.batches) {
  for (let g = 0; g < ruleGroups.length; g++) findUnits.push({ batch, group: ruleGroups[g], gi: g })
}
log(`Find: ${enumeration.batches.length} batches × ${ruleGroups.length} rule-groups = ${findUnits.length} focused passes.`)

const perUnit = await pipeline(
  findUnits,
  // Stage 1: this batch's files × this rule-group ONLY → candidates.
  (unit) =>
    agent(
      `You audit ONE batch of source files against a FOCUSED set of convention rules — only the rules below, nothing else (other rules are covered by other passes; do not skip these to chase ones you remember). ${inRepo}

Read EVERY file in this batch IN FULL (not a skim — violations hide outside the obvious lines):
${(unit.batch.files || []).map((f) => `- ${f}`).join('\n')}

Rules to check (group ${unit.gi + 1}/${ruleGroups.length} — judge each file against EACH of these; \`architecture: true\` ones are placement/import-direction rules, as load-bearing as the rest — this audit drives a refactor, so flag layer gaps, do NOT excuse them as "legacy"):
\`\`\`json
${groupCatalogJson(unit.group)}
\`\`\`${unit.group.some((r) => r.architecture) ? layerClause : ''}

For each place a file breaks one of THESE rules, emit one candidate: \`ruleId\`, \`file\` (repo-relative), \`lineStart\`/\`lineEnd\`, a VERBATIM \`quote\` of the offending span (copy it exactly — a later stage re-reads those lines), and a one-line \`why\`. Report EVERY occurrence separately — do not group across files or dedupe (§G noise filter OFF). Stay evidence-based (§A): only flag what the cited rule actually forbids, with a real line and a real consequence.${inlineTestNote} If nothing in this group is violated, emit no candidates. Return the schema only.`,
      { schema: FIND, label: `find:${unit.batch.dir}:g${unit.gi + 1}`, phase: 'Find', model: 'haiku' }
    ),
  // Stage 2: verify each candidate independently — re-Read the span, confirm true violation.
  (findResult) => {
    const candidates = (findResult && findResult.candidates) || []
    if (candidates.length === 0) return []
    return parallel(candidates.map((c) => () => verifyCandidate(c)))
  }
)

const perFileVerified = perUnit
  .flat()
  .filter(Boolean)
  .filter((f) => f.verified === true)
log(`Find/Verify (per-file): ${perFileVerified.length} verified across ${findUnits.length} passes.`)

// =============================================================================
// Phase — Mechanical: cheap pattern INVENTORY of lint/formatter-enforced rules (Haiku)
//   Fix #4 — type-over-interface et al. are real but ESLint-enforced; re-deriving them with a
//   full Find→Verify→Adjudicate funnel flooded the pilot (96 findings = 77%) and burned tokens.
//   Here ONE focused agent per mechanical rule greps its pattern and returns occurrences — counted
//   and listed, NEVER sent through verify/Opus. (§G: don't re-print the linter; just inventory it.)
// =============================================================================

let mechanicalFindings = []
if (mechanicalRules.length > 0) {
  phase('Mechanical')
  const allInScope = enumeration.batches.flatMap((b) => b.files || [])
  const mechResults = await parallel(
    mechanicalRules.map((r) => () =>
      agent(
        `You INVENTORY every occurrence of one mechanical (linter-enforced) convention violation by pattern match — no judgment calls, just find them all. ${inRepo}

Rule \`${r.ruleId}\` — ${r.title}
Pattern to grep: ${r.howToDetect}
Citation: ${r.citation}  Severity: ${r.severity}

grep ONLY these exact PRODUCTION files — pass them explicitly to grep (e.g. \`grep -nE PATTERN file1 file2 …\`); do NOT use \`grep -r\` or scan the repo. Test files are audited by a separate lane and must NOT appear here. List EVERY hit (file, line, the matching line as \`quote\`):
${allInScope.map((f) => `- ${f}`).join('\n')}
${inlineTestNote} Be exhaustive — every occurrence is its own entry (§G off). Return the FIND schema only (\`why\` = one-word match note); do not verify or judge, just collect.`,
        { schema: FIND, label: `mechanical:${r.ruleId}`, phase: 'Mechanical', model: 'haiku' }
      ).then((res) => ({ rule: r, candidates: (res && res.candidates) || [] }))
    )
  )
  for (const mr of mechResults.filter(Boolean)) {
    for (const c of mr.candidates) {
      mechanicalFindings.push({
        ...c,
        ruleId: mr.rule.ruleId,
        severity: mr.rule.severity,
        stack,
        kind: 'mechanical',
        mechanical: true,
        verified: true, // pattern match is its own proof; not sent through the LLM verifier
        verifiedBy: 'pattern',
        message: `${mr.rule.title} (lint-enforced — run the formatter/linter to auto-fix).`,
        fix: mr.rule.howToDetect,
      })
    }
  }
  // Fix #6 (deterministic) — a mechanical agent that over-grepped (`grep -r`) leaked 27 test-file
  // findings in the pilot. Keep ONLY hits in the enumerated PRODUCTION set; nothing else can slip in.
  const beforeFilter = mechanicalFindings.length
  mechanicalFindings = mechanicalFindings.filter((f) => productionFileSet.has(f.file))
  const dropped = beforeFilter - mechanicalFindings.length
  log(`Mechanical: ${mechanicalFindings.length} occurrences across ${mechanicalRules.length} lint-enforced rules${dropped ? ` (dropped ${dropped} out-of-scope/test-file hits)` : ''} (no verify/adjudicate).`)
}

// =============================================================================
// Phase — Structural: cross-file architecture / fence / cycle violations (Sonnet)
//   The per-file lane catches a file importing upward in its OWN imports. This lane
//   catches what no single file shows: dependency cycles, transitive band-skips,
//   forbidden cross-band client imports, orphaned/unregistered modules. Build an
//   import-edge map by grep, then reason over it against the layerMap + structural
//   rules. Candidates flow through the SAME verifyCandidate funnel.
// =============================================================================

phase('Structural')

let structuralVerified = []
const allFiles = enumeration.batches.flatMap((b) => b.files || [])
const runStructural = layerMap.length > 0 && structuralRules.length > 0 && allFiles.length > 0

if (runStructural) {
  // Step 1 — build the internal import-edge map from the graphify knowledge graph. The
  // graph resolves real dependency edges (re-exports, barrels, type-only imports) that
  // grep blurs, and carries community structure for orphan/cycle work. If the graph is
  // STALE (built-commit ≠ HEAD) we REFRESH it with `graphify update` — a no-API-cost
  // static re-extraction (NOT a product build/test) — rather than degrade to grep. Grep
  // is a last resort only if the graphify tool itself is unavailable.
  const importMap = await agent(
    `You build the INTERNAL import-edge map for a repo's source files, for cross-file architecture analysis. ${inRepo}

SOURCE OF EDGES — use the graphify knowledge graph, refreshed to HEAD:
1. Look under \`.planning/graphs/\` (\`GRAPH_REPORT.md\`, \`GRAPH_COMMUNITIES.md\`, \`graph.json\`). Read \`GRAPH_REPORT.md\` → "Graph Freshness → Built from commit: \`<sha>\`" and compare it to HEAD (\`git -C <repo> rev-parse HEAD\`).
2. If the graph is STALE (built-commit ≠ HEAD) or absent, REFRESH it first: run \`graphify update <repo>\` (the report itself documents this as **no API cost** — deterministic static extraction, not a build/test of the product, so it does NOT break the audit's static-only rule). Then read the regenerated graph.
3. Use the fresh graph as the AUTHORITATIVE dependency source (resolves re-exports, barrels, type-only imports a raw grep misclassifies). Only if the \`graphify\` tool is entirely unavailable, FALL BACK to grep over import/use statements (TS \`import … from './…'\`/\`from '../…'\`; Rust \`use crate::…\` / \`use super::…\`) and say so plainly in the edge data so the gap is visible.
Normalize into the schema: for each file list its INTERNAL (same-repo) imports only — skip third-party/std. For each import give the target module path (repo-relative if resolvable, else the specifier) and the line. Tag each file with its layerMap \`unit\` and each import's \`targetUnit\` using the map below.

LAYER MAP:
\`\`\`json
${layerMapJson}
\`\`\`

Files (${allFiles.length}):
${allFiles.map((f) => `- ${f}`).join('\n')}

Return the schema only — this is data, be exhaustive over the import lines, do not analyze yet.`,
    { schema: IMPORT_MAP, label: 'import-map', phase: 'Structural', model: 'sonnet' }
  )

  const edges = importMap && Array.isArray(importMap.edges) ? importMap.edges : []
  const edgesJson = JSON.stringify(edges, null, 2)
  log(`Structural: import map built for ${edges.length} files; sweeping ${structuralRules.length} rules one at a time.`)

  // Step 2 — Fix #3: sweep ONE structural rule at a time over the shared edge map. A single
  // freeform pass over all structural rules let the pilot check only cycles (1 finding) and skip
  // every band/fence rule. One focused agent per rule forces each fence/band/cycle/orphan rule to
  // actually be applied. The edge map + layer map are identical bytes across calls (cache-friendly).
  const structuralFinds = edges.length
    ? await parallel(
        structuralRules.map((r) => () =>
          withRetry(() =>
          agent(
            `You are the STRUCTURAL ARCHITECTURE auditor, checking ONE cross-file rule against the import graph. ${inRepo}

This audit drives a refactor milestone: the conventions are PRESCRIPTIVE and the architecture is an AGREED target — report every gap (a "the code predates the refactor" state is exactly what to surface, never excuse it).

THE RULE to check (only this one):
- ruleId: \`${r.ruleId}\` — ${r.title}
- how it shows in the graph: ${r.howToDetect}
- severity: ${r.severity}  citation: ${r.citation}

LAYER MAP (units, allowed \`mayDependOn\`, \`fences\`):
\`\`\`json
${layerMapJson}
\`\`\`${compositionRootClause}

IMPORT-EDGE MAP (file → internal imports, each tagged with its unit + targetUnit):
\`\`\`json
${edgesJson}
\`\`\`

Walk the edge map and emit one candidate per violation of THIS rule: \`ruleId\` = \`${r.ruleId}\`, \`file\` (the importing/offending file, repo-relative), \`lineStart\`/\`lineEnd\` (the import line from the map), a VERBATIM \`quote\` (the import statement — Verify re-reads it), and a one-line \`why\` naming the units/edge. For a CYCLE rule, only emit if there is a real reverse edge (a one-way import is NOT a cycle). For an ORPHAN rule, "no in-scope file imports it AND it is not a declared entrypoint". You MAY corroborate cycles/orphans against the graphify graph (\`.planning/graphs/GRAPH_COMMUNITIES.md\`), but every candidate must trace to a concrete edge with a real \`file\`:line. If this rule is honored everywhere, emit no candidates. Return the FIND schema only.`,
            { schema: FIND, label: `structural:${r.ruleId}`, phase: 'Structural', model: 'sonnet' }
          )
          )
        )
      )
    : []

  const structuralCandidates = structuralFinds
    .filter(Boolean)
    .flatMap((res) => (res.candidates || []))
    .map((c) => ({ ...c, kind: 'structural' }))
  log(`Structural: ${structuralCandidates.length} cross-file candidates from ${structuralRules.length} per-rule sweeps → verifying.`)

  if (structuralCandidates.length) {
    const sv = await parallel(structuralCandidates.map((c) => () => verifyCandidate(c)))
    structuralVerified = sv.filter(Boolean).filter((f) => f.verified === true)
  }
  log(`Structural: ${structuralVerified.length} verified.`)
} else {
  log(`Structural: skipped (layerMap units=${layerMap.length}, structural rules=${structuralRules.length}).`)
}

// Fix #1 (defense in depth) — drop a finding whose message LEADS with a false-positive verdict
// (the v1.0 leak led with "False positive: …no cycle exists"). Anchored to the START so a message
// that merely CONTAINS a negation in confirming prose — "…is a genuine band-skip, not a false
// positive", "line 6 is NOT a violation — source/ is itself Cross-cutting" — is NOT dropped (those
// are real findings; an un-anchored match wrongly killed them in testing).
const SELF_CONTRADICT = /^\s*(?:this is\s+)?(?:a\s+|an\s+)?(false[ -]positive|no (?:real )?violation|not a (?:real )?violation|no cycle\b|this does not (?:violate|break))/i
const llmVerified = [...perFileVerified, ...structuralVerified].filter((f) => {
  if (f.message && SELF_CONTRADICT.test(f.message)) {
    log(`Dropped self-contradicting verdict [${f.ruleId}] ${f.file}:${f.lineStart} — message argues it away.`)
    return false
  }
  return true
})

// Merge all lanes, then exact-duplicate dedup ONLY: same ruleId + same file + same start line.
// No grouping across files — every occurrence is its own finding (§G off by design).
const verifiedFindings = [...llmVerified, ...mechanicalFindings]
const seen = new Set()
const dedupedFindings = []
for (const f of verifiedFindings) {
  const key = `${f.ruleId}::${f.file}::${f.lineStart}`
  if (seen.has(key)) continue
  seen.add(key)
  dedupedFindings.push(f)
}

log(`Verified total: ${verifiedFindings.length} (per-file ${perFileVerified.length} + structural ${structuralVerified.length} + mechanical ${mechanicalFindings.length}), ${dedupedFindings.length} after dedup.`)

// =============================================================================
// Phase 5 — Recall: which rules / dirs / fences were never checked (Haiku)
// =============================================================================

phase('Recall')

const checkedRuleIds = [...new Set([...perUnit.flat(), ...structuralVerified, ...mechanicalFindings].filter(Boolean).map((f) => f.ruleId))]
const dirsEnumerated = enumeration.batches.map((b) => b.dir)
const dirsWithFindings = [...new Set(dedupedFindings.map((f) => f.file.split('/').slice(0, -1).join('/')))]
// Structural rules the structural lane could not run against count as not-checked up front.
const structuralUnrun = runStructural ? [] : structuralRuleIds

const recall = await agent(
  `You are the RECALL CRITIC of a whole-repo convention audit — you catch FALSE NEGATIVES (rules/areas never really checked), not false positives. This audit drives a refactor milestone, so a silently skipped rule is worse than a false positive.

How the run was structured (this matters for your judgment):
- Every PER-FILE rule (${perFileRules.length}) was applied to EVERY file batch — the catalog was split into small groups and each group run as its own focused pass, so a per-file rule with zero candidates was genuinely CHECKED and is most likely clean, not skipped.
- Every MECHANICAL rule (${mechanicalRules.length}) was grep-swept across all files (pattern inventory).
- Every STRUCTURAL rule (${structuralRules.length}) got its OWN dedicated sweep over the import graph.${structuralUnrun.length ? ` EXCEPTION: the structural lane did NOT run, so these are unchecked: ${JSON.stringify(structuralUnrun)}.` : ''}

Per-file catalog:
\`\`\`json
${activeCatalogJson}
\`\`\`
Structural rules: ${JSON.stringify(structuralRules.map((r) => r.ruleId))}

Signals:
- ruleIds that produced ≥1 candidate: ${JSON.stringify(checkedRuleIds)}
- directories enumerated: ${JSON.stringify(dirsEnumerated)}
- directories with ≥1 confirmed finding: ${JSON.stringify(dirsWithFindings)}

Given the structure above, a zero-candidate rule is presumptively CLEAN. Put a ruleId in \`rulesNotChecked\` ONLY when you have a concrete reason its pass could not actually judge it — e.g. it needs runtime/dynamic info a static read can't see, the structural lane fell back to grep, or a whole dir looks unexpectedly silent. Do NOT dump every zero-candidate rule. Pay special attention to ARCHITECTURE/fence coverage. List genuine \`rulesNotChecked\`, suspiciously-silent \`dirsNotChecked\`, and free-text \`gaps\`. Return the schema only.`,
  { schema: RECALL, label: 'recall', phase: 'Recall', model: 'haiku' }
)

const rulesNotChecked = [...new Set([...(recall ? recall.rulesNotChecked || [] : []), ...structuralUnrun])]
const dirsNotChecked = recall ? recall.dirsNotChecked || [] : []
const recallGaps = recall ? recall.gaps || [] : []

// =============================================================================
// Phase 6 — Adjudicate: contested / 🔴🟠 subset only, budgeted Opus
//   Opus runs ONLY on the high-stakes / arguable subset, behind a semaphore (429
//   lever) and a per-run call budget (weekly-Opus lever). Everything else keeps
//   its Haiku verdict. Every Opus prompt shares one verbatim prefix so the prompt
//   cache amortizes the catalog across calls.
// =============================================================================

phase('Adjudicate')

// Contested = arguable OR high-severity OR an architecture finding. Mechanical findings are
// pattern-matched and NEVER adjudicated (re-judging a linter is the waste we removed in Fix #4).
const isArch = (f) => {
  const r = ruleById.get(f.ruleId)
  return (r && r.architecture) || f.kind === 'structural'
}
const isContested = (f) => f.contested === true || f.severity === '🔴' || f.severity === '🟠' || isArch(f)
const contestedScore = (f) =>
  (SEVERITY_WEIGHT[f.severity] || 0) + (f.contested ? 2 : 0) + (f.confidence === 'low' ? 1 : 0)

const pool = dedupedFindings.filter((f) => !f.mechanical && isContested(f))
// Fix #1 — architecture/structural AND 🔴-critical findings are ALWAYS adjudicated: they are the
// milestone's point and the highest false-positive risk (the v1.0 leak was a structural cycle the
// budget skipped; the v1.1 run left all 5 🔴 on Haiku-only verdicts because architecture ate the
// budget). The Opus budget is a CAP on the LOWER-severity contested tail only — it can never drop an
// architecture or critical finding.
const mustAdjudicate = (f) => isArch(f) || f.severity === '🔴'
const archMust = pool.filter(mustAdjudicate)
const otherContested = pool.filter((f) => !mustAdjudicate(f)).sort((a, b) => contestedScore(b) - contestedScore(a))
const otherSlots = Math.max(0, OPUS_BUDGET - archMust.length)
const toAdjudicate = [...archMust, ...otherContested.slice(0, otherSlots)]
const skippedByBudget = Math.max(0, otherContested.length - otherSlots)
log(`Adjudicate: ${archMust.length} architecture+critical (always) + ${Math.min(otherContested.length, otherSlots)}/${otherContested.length} other contested → ${toAdjudicate.length} to Opus (budget ${OPUS_BUDGET}, semaphore ${OPUS_CONCURRENCY}); ${skippedByBudget} lower-severity skipped by budget.`)

// Shared verbatim Opus prefix — identical first bytes on every adjudication call so
// the Anthropic prompt cache reuses the catalog instead of re-billing it each time.
const OPUS_PREFIX = `You are the senior ADJUDICATOR for a whole-repo convention audit on the \`${stack}\` stack — a run that drives a refactor milestone, so architecture/layer findings matter as much as correctness ones. ${inRepo}
You re-judge ONE already-verified candidate finding that was flagged as contested, high-severity, or architecture. Confirm it, correct its severity, or overturn it (verified=false) — be decisive and cite the rule. For an architecture/import-direction finding, judge it against the layer map below (do NOT overturn it merely because "the code predates the refactor" — that gap is exactly the finding).

Active rule catalog:
\`\`\`json
${activeCatalogJson}
\`\`\`
${layerMap.length ? `Layer map:\n\`\`\`json\n${layerMapJson}\n\`\`\`\n` : ''}
--- the finding to adjudicate ---
`

const opusSem = makeSemaphore(OPUS_CONCURRENCY)
let opusUsed = 0

const adjudicated = await parallel(
  toAdjudicate.map((f) => () =>
    opusSem(() => {
      opusUsed++
      const rule = ruleById.get(f.ruleId)
      return agent(
        `${OPUS_PREFIX}- ruleId: \`${f.ruleId}\`${rule ? ` — ${rule.title} (${rule.citation})` : ''}
- file: \`${f.file}\`  lines ${f.lineStart}-${f.lineEnd}
- quote:
\`\`\`
${f.quote}
\`\`\`
- Haiku verdict: severity ${f.severity}, confidence ${f.confidence}; message: ${f.message}

Re-Read the span in \`${f.file}\` yourself. Decide \`verified\` (is it a real violation of THIS rule, on live code?), the correct \`severity\`, a precise \`message\` + \`fix\` for the downstream agent, and your \`rationale\`. Return the schema only.`,
        { schema: ADJUDICATE, label: `adjudicate:${f.file}:${f.lineStart}`, phase: 'Adjudicate', model: 'opus' }
      ).then((v) => ({ finding: f, verdict: v }))
    })
  )
)

// Fold Opus verdicts back in (keyed by file:line:rule); overturned findings drop out.
const adjudicatedKey = (f) => `${f.ruleId}::${f.file}::${f.lineStart}`
const verdictByKey = new Map()
for (const a of adjudicated) {
  if (a && a.verdict) verdictByKey.set(adjudicatedKey(a.finding), a.verdict)
}

const finalFindings = []
for (const f of dedupedFindings) {
  const v = verdictByKey.get(adjudicatedKey(f))
  if (v) {
    if (v.verified === false) continue // Opus overturned it
    finalFindings.push({ ...f, severity: v.severity, message: v.message, fix: v.fix, adjudicated: true })
  } else {
    finalFindings.push({ ...f, adjudicated: false })
  }
}

// =============================================================================
// Phase — Test lane (+ Edge-case). Tests are reliability-critical. Each test file is judged by the
//   TEST catalog (RITE/AAA/determinism/over-mock/oracle/coverage-suppression…) AND the UNIVERSAL
//   subset of production conventions (appliesToTests) — never by architecture/domain rules (that
//   misrouting flooded the pilot). A static Edge-case pass pairs each production module with its
//   tests and surfaces untested branches as LEADS. Severity capped per shared-review-standards §F
//   (≤ REQUEST CHANGES unless a test masks a real bug). No Opus — §F bounds the severity. Static.
// =============================================================================

for (const f of finalFindings) f.lane = 'production'
let testFindings = []
let edgeFindings = []

if (testBatches.length > 0 || enumeration.batches.length > 0) {
  phase('Test')
  const testSkill = (STACK_SKILLS[stack] && STACK_SKILLS[stack].tests) || `solidstats-${stack}-tests`
  const universalJson = JSON.stringify(
    universalRules.map((r) => ({ ruleId: r.ruleId, title: r.title, howToDetect: r.howToDetect, severity: r.severity, citation: r.citation })),
    null,
    2
  )

  const TEST_CATALOG = {
    type: 'object',
    required: ['rules'],
    properties: {
      rules: {
        type: 'array',
        items: {
          type: 'object',
          required: ['ruleId', 'group', 'title', 'howToDetect', 'severity', 'mechanical', 'citation'],
          properties: {
            ruleId: { type: 'string', description: 'kebab id, e.g. test-no-real-sleep, test-weak-oracle, test-over-mock' },
            group: { type: 'string', description: 'RITE/AAA/determinism/doubles/oracle/naming/coverage-suppression/no-test-only-export/unit-vs-integration/placement/thoroughness' },
            title: { type: 'string' },
            howToDetect: { type: 'string', description: 'concrete, file-local signal in a test file' },
            severity: { type: 'string', enum: SEVERITIES, description: 'per §F: 🟡 default, 🔵 for naming/cosmetic, 🔴 ONLY for a test that asserts wrong behavior (masks a real bug)' },
            mechanical: { type: 'boolean', description: 'true if a literal grep is 100% correct (no @preserve, real setTimeout in test body)' },
            citation: { type: 'string', description: '[test: §X] reference' },
          },
        },
      },
    },
  }

  // 1) Test Scope — extract the TEST catalog from the live test skills.
  const testCat = await withRetry(() =>
    agent(
      `You extract the TEST-QUALITY rule catalog for auditing test files. ${inRepo}
Read the live test skills under \`<repo>/.claude/skills/\`: \`${testSkill}\` and \`solidstats-shared-testing-standards\` (RITE §A, unit/integration §B, AAA §C, naming §D, determinism §E, doubles/over-mock §F, oracle §G, coverage+suppression §H, scope/no-test-only-export §I, checklist §L), plus \`solidstats-shared-review-standards\` §F for severity.
Produce one entry per concrete, detectable test-quality rule: \`ruleId\`, \`group\`, \`title\`, \`howToDetect\` (a file-local signal in a test file — e.g. "a real \`setTimeout(resolve, n)\`/sleep in a non-integration test body instead of injected/fake time", "sole assertion is \`toBeDefined\`/\`is_ok()\`", "\`/* v8 ignore *\`/ without \`@preserve\`", "\`vi.mock\` on a repo-owned layer where a hand fake exists", "an export in a production file imported only by tests"), \`severity\` (§F: 🟡 default; 🔵 naming/cosmetic; 🔴 ONLY a test asserting wrong behavior), \`mechanical\` (true only if a literal grep is 100% correct), and \`citation\`. Be thorough. Return the schema only.`,
      { schema: TEST_CATALOG, label: 'test-catalog', phase: 'Test', model: 'sonnet' }
    )
  )
  const testRules = (testCat && Array.isArray(testCat.rules) && testCat.rules) || []
  for (const r of testRules) if (!ruleById.has(r.ruleId)) ruleById.set(r.ruleId, r)
  const testCatJson = JSON.stringify(testRules, null, 2)
  log(`Test Scope: ${testRules.length} test-quality rules + ${universalRules.length} universal conventions.`)

  // 2) Test Find — per test batch: test files × (test catalog + universal subset) → verify.
  if (testBatches.length && (testRules.length || universalRules.length)) {
    const tv = await pipeline(
      testBatches,
      (tb) =>
        agent(
          `You audit ONE batch of TEST files. Judge each against (a) the TEST-QUALITY catalog and (b) the UNIVERSAL code-style conventions that apply to all code — NOT production architecture/domain rules. ${inRepo}

Test files (batch kind: ${tb.kind}); read each IN FULL${stack === 'parser' ? ' — for a production .rs file routed here, judge ONLY its `#[cfg(test)]` block' : ''}:
${(tb.files || []).map((f) => `- ${f}`).join('\n')}

TEST-QUALITY catalog:
\`\`\`json
${testCatJson}
\`\`\`
UNIVERSAL conventions (apply to test code too):
\`\`\`json
${universalJson}
\`\`\`
For each violation emit one candidate: \`ruleId\` (from either catalog), \`file\`, \`lineStart\`/\`lineEnd\`, a VERBATIM \`quote\`, a one-line \`why\`. Severity follows §F — test issues are at most REQUEST CHANGES; a test asserting WRONG behavior (masking a bug) is the only 🔴. Report every occurrence (§G off). Return the FIND schema only.`,
          { schema: FIND, label: `test-find:${tb.dir}`, phase: 'Test', model: 'haiku' }
        ),
      (res) => {
        const cs = (res && res.candidates) || []
        if (cs.length === 0) return []
        return parallel(cs.map((c) => () => verifyCandidate({ ...c, lane: 'test', kind: c.kind || 'test' })))
      }
    )
    testFindings = tv.flat().filter(Boolean).filter((f) => f.verified === true).map((f) => ({ ...f, lane: 'test' }))
  }

  // 3) Edge-case / thoroughness — pair each production module with its tests; flag untested branches.
  const allTestFiles = testBatches.flatMap((b) => b.files || [])
  if (enumeration.batches.length) {
    const ev = await parallel(
      enumeration.batches.map((b) => () =>
        agent(
          `You are the EDGE-CASE / THOROUGHNESS auditor (shared-testing-standards §H: every branch/boundary/error path should be exercised). STATIC ONLY — no test execution; your findings are LEADS to confirm with coverage, not proof. ${inRepo}

For each PRODUCTION file in this batch, find its paired test(s) among the test files below (pairing: strip a \`.test\`/\`.integration.test\` suffix → same-path source; or co-located; or by the test's imports), then read the production file and enumerate its top-level branches/error-paths: \`if/else\`, \`switch\`/\`match\` arms, \`catch\` clauses, guard \`return\`/\`throw\`, \`??\`/\`?.\` fallbacks, Rust \`?\`/\`Result\`/\`Option\` arms. For each, grep the paired test(s) for something that exercises it (a scenario name, \`toThrow\`, a stub set to fail, fixture data, an error-code string). Emit one candidate per branch NO paired test exercises: \`ruleId\` = \`test-untested-branch\` (or \`test-no-paired-test\` for a production module with NO test at all), \`file\` (the PRODUCTION file), \`lineStart\`/\`lineEnd\` (the branch), \`quote\` (the branch line), \`why\` (the condition + which tests were checked). Keep to top-level branches; do not chase dynamic DI dispatch. If a module's branches are all covered, emit nothing for it.

PRODUCTION files in this batch:
${(b.files || []).map((f) => `- ${f}`).join('\n')}

TEST files available for pairing (${allTestFiles.length}):
${allTestFiles.map((f) => `- ${f}`).join('\n')}
Return the FIND schema only.`,
          { schema: FIND, label: `edge:${b.dir}`, phase: 'Test', model: 'haiku' }
        )
      )
    )
    edgeFindings = ev
      .filter(Boolean)
      .flatMap((r) => r.candidates || [])
      .map((c) => ({ ...c, lane: 'test', kind: 'edge-case', stack, verified: true, verifiedBy: 'static', adjudicated: false, static: 'unconfirmed', severity: c.severity || '🟡', message: (c.why || 'untested branch') + ' — STATIC ONLY: confirm by running coverage.', fix: c.fix || 'Add a test that exercises this branch (§H).' }))
  }

  // §F cap — a test-lane finding is 🔴 only when it masks a real bug; otherwise downgrade to 🟠.
  const masksBug = (f) => /mask|wrong behaviou?r|asserts? (the )?wrong|correctness/i.test(`${f.message || ''} ${f.ruleId || ''}`)
  for (const f of [...testFindings, ...edgeFindings]) if (f.severity === '🔴' && !masksBug(f)) f.severity = '🟠'

  // Dedup the test + edge findings the same way the production lane dedups (they're added after that
  // pass, so they need their own exact-dup pass: same ruleId + file + start line, across both and
  // against what production already emitted).
  const tSeen = new Set(finalFindings.map((f) => `${f.ruleId}::${f.file}::${f.lineStart}`))
  for (const f of [...testFindings, ...edgeFindings]) {
    const key = `${f.ruleId}::${f.file}::${f.lineStart}`
    if (tSeen.has(key)) continue
    tSeen.add(key)
    finalFindings.push(f)
  }
  log(`Test lane: ${testFindings.length} test-quality findings + ${edgeFindings.length} edge-case leads (pre-dedup).`)
}

// --- assemble the JSON contract (deterministic JS — never ask a model to emit thousands of entries)
const order = { '🔴': 0, '🟠': 1, '🟡': 2, '🔵': 3 }
finalFindings.sort(
  (a, b) => (order[a.severity] - order[b.severity]) || a.file.localeCompare(b.file) || a.lineStart - b.lineStart
)

const byRule = {}
const bySeverity = { '🔴': 0, '🟠': 0, '🟡': 0, '🔵': 0 }
let architectureCount = 0
let mechanicalCount = 0
let testLaneCount = 0
let edgeCaseCount = 0
for (const f of finalFindings) {
  byRule[f.ruleId] = (byRule[f.ruleId] || 0) + 1
  bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1
  if (isArch(f)) architectureCount++
  if (f.mechanical) mechanicalCount++
  if (f.lane === 'test') testLaneCount++
  if (f.kind === 'edge-case') edgeCaseCount++
}

return {
  meta: {
    repo: repo || '(session cwd)',
    stack,
    commit,
    staticOnly: true,
    purpose: 'refactor-milestone — surface every deviation from the prescribed standard, architecture included',
    structuralLaneRan: runStructural,
    testLaneRan: testBatches.length > 0,
    blindSpots: BLIND_SPOTS,
    opusAdjudications: { used: opusUsed, skippedByBudget, alwaysAdjudicated: archMust.length },
  },
  coverage: {
    suspendedRuleIds,
    // Don't label a dir "skipped" if it actually produced findings — the recall critic flagged
    // src/types / src/evidence / src/logging as silent when they in fact had findings (v1.1).
    dirsSkipped: [
      ...(enumeration.dirsSkipped || []),
      ...dirsNotChecked.filter((d) => !finalFindings.some((f) => f.file.startsWith(d.replace(/\/$/, '') + '/') || f.file.split('/').slice(0, -1).join('/') === d.replace(/\/$/, ''))),
    ],
    rulesNotChecked,
    recallGaps,
  },
  summary: { byRule, bySeverity, architecture: architectureCount, mechanical: mechanicalCount, test: testLaneCount, edgeCase: edgeCaseCount },
  findings: finalFindings.map((f) => ({
    ruleId: f.ruleId,
    severity: f.severity,
    stack: f.stack || stack,
    lane: f.lane || 'production',
    file: f.file,
    lineStart: f.lineStart,
    lineEnd: f.lineEnd,
    quote: f.quote,
    message: f.message,
    fix: f.fix,
    citation: ruleById.get(f.ruleId) ? ruleById.get(f.ruleId).citation : '',
    architecture: isArch(f),
    mechanical: f.mechanical === true,
    static: f.static === 'unconfirmed' ? 'unconfirmed' : undefined,
    kind: f.kind === 'edge-case' ? 'edge-case' : f.lane === 'test' ? 'test' : f.mechanical ? 'mechanical' : f.kind === 'structural' ? 'structural' : 'per-file',
    verified: true,
    verifiedBy: f.verifiedBy || 'llm',
    adjudicated: f.adjudicated === true,
  })),
}

export const meta = {
  name: 'audit-skill-trigger-discrimination',
  description:
    'Valid triggering eval for solidstats-process-repo-convention-audit (the run_loop harness mis-scores Workflow-wrapper skills): build the real skill menu, then per query ask a judge which single skill it would route to, and score discrimination — positives must route to the audit skill, near-miss negatives must route elsewhere.',
  phases: [
    { title: 'Menu', detail: 'gather the real candidate skill descriptions (one agent)' },
    { title: 'Route', detail: 'per query: judge picks one skill (sonnet)' },
  ],
}

const NEW_SKILL = '/home/afgan0r/Projects/SolidGames/skills/solidstats-process-repo-convention-audit/SKILL.md'
const FETCHER = '/home/afgan0r/Projects/SolidGames/replays-fetcher'
const AUDIT = 'solidstats-process-repo-convention-audit'

// The 20 queries from trigger-eval.json, with the discrimination target.
// expectAudit=true → must route to the audit skill; false → must route to ANY other skill / handle directly.
const QUERIES = [
  { q: 'прогони весь replays-fetcher по нашим конвенциям и собери все отклонения в один список — готовлю рефакторинг-milestone', expectAudit: true },
  { q: "we're about to do a big cleanup pass on server-2 — inventory every place the code breaks our conventions AND architecture so I can turn it into tasks", expectAudit: true },
  { q: 'вскрой все нарушения архитектуры в replay-parser-2, нужно привести крейты в соответствие со скиллами', expectAudit: true },
  { q: 'find every layering violation across the whole fetcher repo, not just my branch — upward imports, wrong band, fence breaks, all of it', expectAudit: true },
  { q: 'audit the entire server-2 codebase against solidstats-server-ts-conventions and give me JSON I can feed to a fix agent', expectAudit: true },
  { q: 'хочу полный аудит соответствия конвенциям по всему репозиторию парсера, без ограничения по числу файлов', expectAudit: true },
  { q: 'go through all of replays-fetcher and list everywhere we diverge from the prescribed standard so we can make it all shine before the release', expectAudit: true },
  { q: 'compliance sweep of the whole server-2 repo — naming, typed errors, zod, layering, the works, every occurrence', expectAudit: true },
  { q: 'приведи кодбазу server-2 в соответствие со скиллами: сначала нужен инвентарь всех нарушений по всему проекту', expectAudit: true },
  { q: 'scan the full parser repo (all 5 crates) for convention + architecture deviations and bucket them by severity', expectAudit: true },
  { q: 'review my PR on server-2 before I merge — I touched the ingest module', expectAudit: false },
  { q: 'посмотри мой диф в replays-fetcher перед мержем, всё ли по конвенциям', expectAudit: false },
  { q: 'do a deep adversarial review of my current branch with the lenses', expectAudit: false },
  { q: 'is the /admin/stats endpoint actually authorized on every code path in server-2?', expectAudit: false },
  { q: 'напиши новую стадию инжеста в фетчере по конвенциям', expectAudit: false },
  { q: 'where should I put the new S3 evidence adapter in the fetcher, which band does it go in?', expectAudit: false },
  { q: "run the test suite and typecheck for server-2 and tell me what's failing", expectAudit: false },
  { q: 'audit our pnpm dependencies in server-2 for known CVEs and security advisories', expectAudit: false },
  { q: 'build a codebase map for replay-parser-2 so a new dev can onboard to the crates', expectAudit: false },
  { q: 'the graphify graph for server-2 looks stale, can you regenerate it', expectAudit: false },
]

const MENU = {
  type: 'object',
  required: ['skills'],
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description'],
        properties: { name: { type: 'string' }, description: { type: 'string', description: 'the skill description, trimmed to ~60 words' } },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['chosen', 'reason'],
  properties: {
    chosen: { type: 'string', description: 'the single skill name to invoke, or "none" to handle directly' },
    reason: { type: 'string', description: 'one line: why this skill over the others' },
  },
}

phase('Menu')

// Build the realistic candidate menu the user actually faces: the audit skill (not yet installed
// in the repo — read its SKILL.md directly) + the skills installed in the fetcher repo + the global
// process skills it competes with. One agent assembles it so all judges see identical bytes.
const menu = await agent(
  `Assemble the candidate SKILL MENU a SolidStats developer's Claude Code session would see, for a routing test.
Include, with a ~60-word description each (read the real frontmatter, do not invent):
1. \`${AUDIT}\` — read its description from \`${NEW_SKILL}\` (frontmatter \`description\`).
2. Every \`solidstats-*\` skill installed under \`${FETCHER}/.claude/skills/\` (list the dir, read each SKILL.md frontmatter description) — code-review, conventions, tests, review-lenses, shared-*.
3. The global process skills it competes with, by their known purpose: \`estesis-process-deep-code-research\` (verify ONE high-stakes code claim / exhaustive path trace), \`estesis-process-codebase-map\` (build a codebase map for onboarding), \`graphify\` (build/update/query the code knowledge graph), \`security-review\` (security/CVE/vuln review).
Return the schema only.`,
  { schema: MENU, label: 'menu', phase: 'Menu', model: 'sonnet' }
)

const menuJson = JSON.stringify((menu && menu.skills) || [], null, 2)

phase('Route')

const verdicts = await parallel(
  QUERIES.map((item, i) => () =>
    agent(
      `You are the skill ROUTER inside a Claude Code session. A SolidStats developer just typed the message below. Decide which SINGLE skill from the menu you would invoke to handle it — or "none" if you'd just answer/act directly without any of these skills. Choose by what the message actually asks for, not keyword overlap.

MENU:
\`\`\`json
${menuJson}
\`\`\`

Developer message:
"""${item.q}"""

Return the schema only: \`chosen\` = the exact skill name (or "none"), \`reason\` = one line.`,
      { schema: VERDICT, label: `route:${i + 1}`, phase: 'Route', model: 'sonnet' }
    ).then((v) => ({ i: i + 1, q: item.q, expectAudit: item.expectAudit, chosen: v ? v.chosen : null, reason: v ? v.reason : null }))
  )
)

// Score discrimination.
const routedToAudit = (c) => typeof c === 'string' && c.includes('repo-convention-audit')
let tp = 0, fn = 0, tn = 0, fp = 0
const misroutes = []
for (const r of verdicts.filter(Boolean)) {
  const hit = routedToAudit(r.chosen)
  if (r.expectAudit && hit) tp++
  else if (r.expectAudit && !hit) { fn++; misroutes.push({ ...r, kind: 'MISS (should have routed to audit)' }) }
  else if (!r.expectAudit && !hit) tn++
  else { fp++; misroutes.push({ ...r, kind: 'FALSE-FIRE (routed to audit, should not)' }) }
}
const positives = tp + fn, negatives = tn + fp
return {
  scores: {
    shouldTrigger: `${tp}/${positives} routed to audit (recall)`,
    shouldNotTrigger: `${tn}/${negatives} routed elsewhere (specificity)`,
    overall: `${tp + tn}/${positives + negatives}`,
  },
  misroutes,
  all: verdicts.filter(Boolean).map((r) => ({ i: r.i, expectAudit: r.expectAudit, chosen: r.chosen, reason: r.reason })),
}

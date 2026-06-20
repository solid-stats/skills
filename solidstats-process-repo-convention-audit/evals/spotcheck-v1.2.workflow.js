export const meta = {
  name: 'audit-v1.2-spotcheck',
  description:
    'Adversarially verify a stratified sample of the v1.2 replays-fetcher@c850190 audit findings (plus the 5 v1.1 🔴 as a regression before/after) against the real source, to measure the v1.2 false-positive rate and test the 🔴 5→0 delta. Parameterized: pass args.repo + args.sample (array of {ruleId,severity,file,lineStart,lineEnd,quote,citation,kind,lane,mechanical,stratum}).',
  phases: [{ title: 'Verify' }],
}

const A = typeof args === 'string' ? JSON.parse(args) : args || {}
const REPO = A.repo || '/home/afgan0r/Projects/SolidGames/replays-fetcher'
const SAMPLE = Array.isArray(A.sample) ? A.sample : []

const VERDICT = {
  type: 'object',
  required: ['real', 'confidence', 'reason'],
  properties: {
    real: { type: 'boolean', description: 'true ONLY if this is a genuine violation of the cited rule on the kind of code the rule targets' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reason: { type: 'string', description: 'one or two lines: what you found at the cited span and why it does or does not violate the rule' },
  },
}

phase('Verify')

const results = await parallel(
  SAMPLE.map((x) => () =>
    agent(
      `You ADVERSARIALLY verify ONE convention-audit finding against the source. Default SKEPTICAL — your job is to catch false positives. The repo is at \`${REPO}\` (NOT your cwd): run every command as \`git -C ${REPO} ...\` and read files by absolute path. The finding's \`file\` may be repo-relative (resolve it under \`${REPO}/\`) or already absolute. Read the rule's own skill under \`${REPO}/.claude/skills/\` if you need the exact rule wording.

The finding CLAIMS:
- rule: \`${x.ruleId}\` (${x.citation || 'no citation'})  severity ${x.severity}  kind ${x.kind || '?'}  lane ${x.lane || 'production'}${x.mechanical ? ' (mechanical/pattern rule)' : ''}
- location: \`${x.file}\` lines ${x.lineStart}-${x.lineEnd}
- quoted span:
\`\`\`
${x.quote}
\`\`\`

Re-Read that span yourself. Set \`real\` = true ONLY if ALL hold:
(1) the quoted code is actually there at/near those lines;
(2) it is LIVE code of the kind this rule targets — for a PRODUCTION-lane finding, real source (not a comment, string literal, or dead branch); for a TEST-lane finding, a genuine test as the test rule intends (being inside a *.test.* file is EXPECTED here, NOT a disqualifier);
(3) it genuinely breaks the cited rule AS THAT RULE IS ACTUALLY WRITTEN — do not invent a stricter rule and do not silently re-grade severity. For a mechanical/pattern rule, (3) means the pattern truly matches. For an \`as\`-cast LSP/contract rule, real=true ONLY if the cast actually defeats or violates a type contract (asserts a shape the value is not guaranteed to have, e.g. an unchecked JSON.parse result), NOT merely an unexplained-but-safe cast. For a blocking-I/O async rule, real=true ONLY if the called function truly performs synchronous/blocking I/O on a hot async path.
If any condition fails, \`real\` = false with the reason. Return the schema only.`,
      { schema: VERDICT, label: `check:${x.stratum}:${x.ruleId}:${x.lineStart}`, phase: 'Verify', model: 'haiku' }
    )
      .then((v) => ({ ...x, verdict: v }))
      .catch(() => null)
  )
)

const done = results.filter((r) => r && r.verdict)
const real = done.filter((r) => r.verdict.real)
const fp = done.filter((r) => !r.verdict.real)

const byStratum = {}
for (const r of done) {
  const k = r.stratum || 'untagged'
  byStratum[k] = byStratum[k] || { n: 0, real: 0, fp: 0 }
  byStratum[k].n++
  if (r.verdict.real) byStratum[k].real++
  else byStratum[k].fp++
}

const v11 = done.filter((r) => r.stratum === 'v1.1-red')

return {
  sampled: SAMPLE.length,
  verified: done.length,
  realCount: real.length,
  falsePositiveCount: fp.length,
  fpRate: done.length ? +(fp.length / done.length).toFixed(3) : null,
  byStratum,
  v11RedRegression: {
    total: v11.length,
    stillReal: v11.filter((r) => r.verdict.real).length,
    verdicts: v11.map((r) => ({ ruleId: r.ruleId, file: r.file, line: r.lineStart, real: r.verdict.real, confidence: r.verdict.confidence, reason: r.verdict.reason })),
  },
  falsePositives: fp.map((r) => ({ stratum: r.stratum, ruleId: r.ruleId, file: r.file, line: r.lineStart, severity: r.severity, reason: r.verdict.reason })),
  lowConfidenceReals: real
    .filter((r) => r.verdict.confidence === 'low')
    .map((r) => ({ stratum: r.stratum, ruleId: r.ruleId, file: r.file, line: r.lineStart, reason: r.verdict.reason })),
}

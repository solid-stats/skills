# Profile loading

The SolidStats profile is bundled in the writer skill. Both writer and reviewer
load `solidstats-profile.md`, `wording-registry.md`, `pattern-index.md` and the
pattern groups matching the contract. No separate consumer profile repository
or per-developer service registry is required.

Both skills also read
`solidstats-shared-project-standards/references/http-api-contract.md` from the
sibling skills root. This common contract is required for server/web agreement;
do not substitute a stale local copy or skip it when only an entry point was
injected into a specialist prompt.

## Resolve the consumer

The consumer is `server-2`; specification paths are relative to its root even
when the skill is installed globally or invoked from the skills repository.
Locate the actual checkout from task context; do not embed workstation paths in
the skill or committed artifacts. Follow repository freshness and managed
instruction requirements before using another checkout as evidence.

Read the active `.planning/` context and the relevant `plans/server-2/briefs/`
documents when present. Resolve referenced product decisions from their actual
owners rather than inventing an Estesis-style `docs/` or `registry/` structure.

## Resolve current and intended behavior

- Current generated contract: `server-2/openapi/server-2.openapi.json`,
  identified
  by commit and digest. A deployed schema is additional evidence when its URL
  is available from repository documentation; do not invent a deployment URL.
- Current behavior: relevant source, tests and live observations when available.
- Intended behavior: the user's requirements and the current proposed or
  approved iteration, with prior decisions and explicit supersedes.
- Prescriptive engineering rules: the applicable SolidStats standards. If a
  desired contract conflicts with a standard, surface that exact conflict for
  resolution instead of silently weakening either source.

These have different roles. A generated schema is evidence of the existing API,
not authority to reject a deliberate target change. An accepted target does not
make the existing deployment compliant: record the gap and required transition.

For affected `web`, parser or fetcher contracts, read only the relevant adjacent
source and decisions. Report unavailable evidence precisely. Do not create a
duplicate service registry, guess the behavior or claim verified compatibility.

## Apply the profile

1. Resolve the target phase pair and current iteration.
2. Load core rules and all profile rules relevant to that slice.
3. Use the profile's language, error, identifier and auth boundaries.
4. Follow the iteration workflow and validate before requesting approval.
5. Name the read skill/reference files in the review or handoff evidence.

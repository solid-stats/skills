# Corrections log — solidstats-shared-project-standards

<!-- markdownlint-disable MD013 -->

Append-only journal of skill divergences captured through
`solidstats-process-skill-feedback`.

## Entries

### SC-2026-08-20-d4c7 · divergence · fact · §D

```yaml
id: SC-2026-08-20-d4c7
date: 2026-08-20
target_skill: solidstats-shared-project-standards
repo: web
source: free-form-prose
signal: divergence
class: fact
generalized: true
section: "§D"
topic: auth
dev_change: >
  The §D boundary map named Steam OpenID, but the active product decision pack supersedes
  player-facing Steam auth. Server-2 owns Discord OAuth for request authors, moderators, and
  admins; replay identity remains nickname-and-date based and is not owned by a Discord account.
code:
  file: null
  line: null
  source: none
  status: n-a
  snippet: |
rationale: >
  This is an objectively stale product-boundary fact. The plans repository records Discord OAuth
  as the active auth contract and explicitly marks Steam player login obsolete, so one occurrence
  is enough to promote the correction.
status: promoted
signature: "divergence|§D|Discord OAuth replaces Steam player auth"
```

### SC-2026-08-20-6e21 · preference · preference · §J

```yaml
id: SC-2026-08-20-6e21
date: 2026-08-20
target_skill: solidstats-shared-project-standards
repo: n-a
source: free-form-prose
signal: preference
class: preference
generalized: true
section: "§J"
topic: agent-instructions
dev_change: >
  CLAUDE.md is no longer part of the SolidStats repository documentation contract. AGENTS.md is
  the only required agent-instruction file; agents must not create, restore, or validate
  CLAUDE.md files that repository owners remove.
code:
  file: null
  line: null
  source: none
  status: n-a
  snippet: |
rationale: >
  This changes a repository-policy preference rather than correcting an objective code fact. The
  maintainer explicitly approved direct promotion, so the generalized preference does not remain
  warming in the journal.
status: promoted
signature: "preference|§J|CLAUDE.md is not required"
```

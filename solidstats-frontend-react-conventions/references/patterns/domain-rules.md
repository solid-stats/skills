# Domain rules

SolidStats-specific product rules the UI must honor (from `gsd-briefs/web.md`). These are domain
contracts, not style preferences.

## Public surfaces & URLs

- Surfaces: **players, squads, rotations, commander-side stats, bounty** stats/leaderboards, and public
  **replay** detail pages.
- **Player/squad routes are slug-only**, resolving to the **current owner** (nicknames are unique among
  active players; historical slug stability is not guaranteed — a reused nickname opens the current
  owner). **Replay** routes use **replay ID**. Rotations are canonical pages **and** a filter context
  across stat surfaces.
- Public tables target **10k–100k rows**: search, filters, sorting, and cursor pagination are
  **server-driven**; shareable state in the URL, ephemeral state out of it (see `state.md`).

## Data trust & provenance

- Show visible provenance where available: last-updated, relevant replay/source links, **unknown** and
  **conflict** badges, parse/status context. Never render an unknown/conflicted value as certain.
- **Legacy commander-side games with unknown outcome** are shown as an explicit unknown status and are
  **filterable**.
- **Bounty** shows the formula breakdown where data exists (victim-player effectiveness, squad
  effectiveness, rotation context); squad effectiveness is **explainable**, not an opaque number.
  Bounty is points/statistics only — clearly **not money**.
- **SteamID is masked** — only the last 4 digits shown. Full nickname history is public; squad
  membership history is a public timeline with dates and unknown gaps.

## Requests & moderation

- Auth-gated actions use **inline login prompts** and return the user to the original flow after Steam
  OAuth.
- v1 request flows are **separate guided steppers** (no final review step): **identity, add/remove
  kills, add/remove teamkills, remove player from replay, commander dispute**. Validation shows errors
  after submit, then updates live as each is fixed.
- **Drafts are `server-2` resources** (SSR-prefetched, not local-only): created after the first
  meaningful edit, debounced autosave with save/saving/error states, **7-day** expiry.
- Evidence: **image uploads + external links** (moderate limits, safe external-link handling).
- Moderation: queue default priority **risk + age**; request detail is an **immutable audit timeline**;
  all moderation comments visible in history; rejected requests can be **reopened**; **no bulk**
  decisions in v1. Request visibility is requester + staff only; status notifications are in-app for v1.

## Admin / ops / RBAC

- Moderation, role management, rotation management, and ops visibility are **launch-blocking** v1.
- **RBAC** is driven by roles **plus explicit capabilities** from session/API data; unauthorized routes
  show a contextual **403** with missing-rights context and recovery. Ops views expose limited actions
  (retry / mark-reviewed) **only** where `server-2` explicitly supports them and auditability exists.

Review flags:

- A player/squad route keyed by id instead of current-owner slug; a replay route not by id.
- Client-driven filtering/sorting/pagination on a public table (must be server-driven).
- An unknown/conflict/legacy-unknown value rendered as certain or not filterable; full SteamID shown.
- A request flow as one big form instead of a guided stepper; a draft kept local instead of as a
  `server-2` resource; a final-review step added.
- A moderation action that mutates the audit timeline; a bulk-decision UI in v1; RBAC from roles alone
  without capabilities.

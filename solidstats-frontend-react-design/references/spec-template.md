# Surface Spec Template

Fill this per surface. In GSD it becomes the UI phase's `CONTEXT` (what to build) + `VALIDATION`
(acceptance) — it is the durable contract that outlives any prototype. `DESIGN.md` owns tokens;
**this owns the screen.** Copy the headings and answer every one — an unanswered section is a design
hole that surfaces as a bug later. Derived from the checklist.design per-component checklists and
the Selectel pre-handoff checklist.

## Checklists to apply (checklist.design — actively, per surface)

Before and while writing this spec, **actively browse
[checklist.design/browse](https://www.checklist.design/browse)** and pull the checklists for every
component and flow on this surface — table, navigation, searchbar, tabs, modal / dialog, skeleton,
empty state, loading, form, dark mode, responsiveness, and any others present. **Record the ones
that apply right here**, then fold their items into the states (§4/§5), responsiveness (§6),
component states (§7), and acceptance (§9). Every user-visible item becomes an **E2E assertion** in
§9 / the use-cases. There is no checklist.design MCP — fetch the relevant `/browse` pages with
WebFetch and record manually; pair with the Selectel pre-handoff checklist.

- [ ] checklist.design — `<component>`: applied → folded into §__
- [ ] checklist.design — `<flow>`: applied → folded into §__
- [ ] Selectel pre-handoff checklist: applied

## 1. Job & priority

- One paragraph: what this surface is for, who lands here, the single most important thing they do.
- Information priority order, top → bottom. Headline data sits high, right after identity + top
  stats — never buried at the bottom.

## Use cases / product scenarios (the E2E source)

List the concrete user journeys this surface must support, as ordered steps with the actor and the
expected outcome. These are the **source for Playwright E2E** (`solidstats-frontend-react-tests`) —
not just prose. One scenario per real task; cover the critical path and the important alternates.

Format each as **[role] goal — steps → expected.** Example (Players list):

- **Visitor finds a player** — open Players → type "Vasiliy" in search → row appears → click it →
  Profile opens at the right slug. *Expected:* SSR HTML before JS; no blocking reload.
- **Visitor drills and returns** — scroll deep → apply a tier filter → open a profile → press Back.
  *Expected:* the list restores filter + scroll + virtualized position from cache, no CLS (the
  brief's signature journey).
- **Player submits a correction** (auth) — open own profile → "request correction" → fill the
  stepper → upload evidence → submit. *Expected:* draft autosaves; success names the request id.
- **Moderator reviews** (role) — open the queue → open a request → approve with a comment.
  *Expected:* immutable audit row added; queue count decrements.

Each scenario maps 1:1 to an E2E spec. The ×5 scenario endings (§4) and ×4 data-volume states (§5)
are the state matrix *within* these journeys — the journey is the path, those are the conditions it
must survive.

## 2. Roles ×4

How the surface differs for **signed-out visitor · player** (own data, requests) **· moderator**
(queue, manual fills) **· admin** (roles, rotations). For each: what they see, what they can do,
what is denied (and how the denial reads).

## 3. Data shape

- The real fields, from `server-2`'s OpenAPI (`openapi-typescript` paths). Name them.
- Domain formulas the mock data must satisfy (e.g. `Score = (kills − TK) ÷ (games + deaths-from-TK)`)
  so mock numbers are internally consistent and never contradict the real backend.
- Source of truth, the freshness signal (SSE), what is cached vs live.

## 4. Scenario endings ×5

- **Success** — the happy path.
- **Error** — distinguish *system* error (request/debug id + a contact path) from *user* error
  (sits by the field, names the fix).
- **Loading** — skeleton with reserved height — **CLS = 0**, the skeleton matches the final
  colgroup / header / row height exactly. SSR-warm renders with no skeleton; only
  a genuine async wait gets one.
- **Onboarding / first-run** — empty-but-expectant.
- **Empty** — no data; actionable copy ("No squads match these filters — clear filters to see all
  1,204 squads").

## 5. Data-volume states ×4

For every list / table / field: **empty · few · many · limit-reached.** Long values truncate +
tooltip or wrap — never clip. Tables keep all entries but cap a **visible window + sticky-header
scroll** (desktop) with the total in the label/caption (`История ников · 15`). Side-by-side tables
reserve **fixed row slots** (faint placeholders when short) so they stay equal height for any data.
Provide a typical/heavy data toggle so edge states are demonstrable, not hypothetical.

## 6. Responsiveness — the project breakpoints

Explicit behavior at every project breakpoint (the canonical set + content-width strategy live in
[`design-system.md`](design-system.md) → Responsive breakpoints), keyed off the **container**
(`container-type: inline-size` + `@container`), **not** the viewport. The app previews inside device
frames, so the iframe viewport ≠ content width and viewport media queries silently never fire —
**verify at the real column width** (simulate the mobile-floor 360px column and look). On mobile: no nested
scroll (the page already scrolls), no horizontal scroll, drop secondary columns (e.g. max-dist),
top-N + a "show all · N" expander instead of dumping every row.

## Localization (RU + EN)

Every UI string is typed-ICU i18n-keyed from the start — RU and EN, no hardcoded text. Per surface:

- Which strings this surface introduces (labels, empty/error copy, status vocabulary, tooltips).
- **RU length expansion** — Russian runs longer than English; verify the longest RU label/value
  doesn't clip or wrap badly in the narrowest column (stack label-over-value there).
- Pluralization (ICU plural) for counts; localized dates/numbers (decimal comma in RU); UTC in a
  tooltip for ops contexts.
- The RU reads naturally, not machine-literal.

## 7. Component states

For every interactive atom: **enabled / hover / pressed / focused / selected / disabled /
loading.** Define the **click zone** (whole row beats text). Fixed vs fluid sizing. Visible focus
ring on every control; ≥44px touch target; never hover-only meaning.

## 8. Cross-surface impact

What this surface's changes ripple into. Surfaces that must stay synced share the same shell, tier
system, freshness/provenance, i18n, and tweaks (e.g. Overview top-players card → Players list →
Player profile).

## 9. Acceptance (→ `VALIDATION`)

The user-visible checks that prove it is done:

- Every §4 ending and §5 volume state renders correctly at every project breakpoint.
- **Back restores table state + scroll + virtualized position + cache** with no blocking reload and
  no CLS (the brief's signature continuity requirement).
- axe-core clean (WCAG 2.2 AA + the targeted AAA criteria); contrast passes `design.md lint`; visible focus; keyboard-complete.
- RU **and** EN read naturally — no clipped or awkward labels.

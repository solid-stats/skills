# SolidStats Implementation Surface Overlay

Use this with the global `design/references/implementation-surface-spec.md` template. The global file
owns the generic structure: source, job, use cases, roles, data shape, scenario endings, data
volumes, component states, responsiveness, copy/localization, cross-surface impact, and acceptance.
This file adds the SolidStats-specific content that must be folded into those sections.

## Source

- Accepted Claude Design surface: `<Claude Design project/card URL, pulled via DesignSync>`
- Approval screenshots: `<paths>`
- Global checklist items deferred to implementation: `<source URL> -> spec section`
- SolidStats items added here: `<data trust / role / RU+EN / replay data> -> spec section`

If a visual decision is missing from the accepted Claude Design surface, send it back to design
iteration instead of inventing it inside the implementation spec.

## API And Domain Data

Fold into the global data-shape section:

- real fields from `server-2` OpenAPI / `openapi-typescript` paths;
- typed client/query boundary for each data source;
- cache vs live fields, SSE freshness, reconnecting/offline/stale behavior;
- source replay count and provenance for every disputed number;
- domain formulas the fixture data must obey, for example Score and K-D;
- representative min/typical/max values for table rows, names, filters, numeric deltas, and tooltips.

Mock data must be internally consistent and must not outrank or contradict known real leaders.

## Roles

Fold into the global roles/permissions section:

- **Signed-out visitor** - public stats, filters, profile/list browsing, denied authenticated actions.
- **Player** - own profile/actions, correction requests, drafts, evidence upload, status tracking.
- **Moderator** - queues, manual fills, approvals/rejections, audit trail.
- **Admin** - roles, rotations, operational settings.

For every denied action, specify what is hidden, disabled, or shown with explanatory copy.

## Data Trust And Freshness

Fold into scenario endings, data volumes, and component states:

- Known, Unknown, Conflict, and stale are real states with designed UI.
- Unknown is never shown as `0` or a plain dash when the distinction matters.
- Freshness copy is explicit: Up to date, Stale, Offline, Reconnecting.
- Provenance is close to the number: computed from N replays, source, last update.
- Pending workflow events such as merges or correction requests render as quiet inline status, not
  full-width decorative banners unless the task is blocking.

## Localization

Fold into copy/localization:

- every string is typed ICU and present in RU and EN;
- Russian length expansion is checked in the narrowest relevant column;
- plurals use ICU plural rules;
- dates and numbers are localized, with UTC in tooltips where operationally useful;
- status/outcome vocabulary is symmetric across RU and EN.

## Public Stats Continuity

Fold into acceptance for public pages:

- SSR HTML contains indexable primary stats before client JS;
- route head metadata is present where the page is public/shareable;
- Back restores filters, sorting, scroll offset, virtualized position, and Query cache;
- SSE updates do not steal focus, reorder above the viewport, or cause CLS;
- loading skeletons reserve final height and column geometry.

## Ladle And UIKIT

Ladle is mandatory for the UIKit. `web` is a single-package repo with no active catalog yet — build
one fresh under `src/shared/uikit/` (`.legacy/ladle-design/` holds the retired package-based one,
reference only; see `.planning/PROJECT.md`).

Fold into implementation acceptance:

- shared components have durable colocated Ladle stories;
- stories cover component states and relevant data-volume variants;
- Tailwind values come from generated theme tokens, not arbitrary values;
- icons are Lucide;
- numbers use tabular mono and right alignment in numeric table columns;
- whole-row click zones are used when rows are clickable.

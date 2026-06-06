# State boundaries

Every kind of state has exactly one home. Putting state in the wrong place is the most common cause of
the back-navigation, shareability, and CLS bugs the brief forbids.

## The four homes

| State | Home | Examples |
|-------|------|----------|
| **Shareable** | **URL / Router search params** | search query, filters, sorting, cursor/page, active tab when shareable |
| **Server data** | **TanStack Query cache** | players/squads/replays lists & details, request data, session |
| **Client-only, persistent-ish** | **Nano Stores** | table density toggle, theme, last-used UI preferences, ephemeral cross-component flags |
| **Transient / ephemeral** | **component state (or Router)** | scroll position & virtualized row position (Router-restored), open/closed of a local menu, in-progress uncommitted form input |

Decision rule, in order: *is it shareable/bookmarkable?* → URL. *Is it server data?* → Query. *Is it
client-only but should outlive a component?* → Nano. *Otherwise* → component/Router.

## URL / Router search params

- Shareable state lives in **validated** typed search params (see `routing.md`), and is the **single
  source of truth** — the UI reacts to the URL; it never writes both the URL and a mirror store for the
  same value.
- Reset goes through the established reset pattern. If filters use a draft-vs-applied model (an explicit
  Apply), the draft is local component state and only the applied value lands in the URL.
- Defaults and "has non-default filters" derive from one helper, not literals duplicated across the URL
  schema and the widget.

## Query cache

- Server data lives only in the Query cache (see `data-flow.md`); don't copy fetched data into Nano
  Stores or component state "to hold onto it" — that breaks freshness and the back-nav restore.

## Nano Stores

- Use atoms/maps for small client-only state. Keep stores tiny and single-purpose; derived values use
  computed atoms, not duplicated state.
- **Never** put server data, or anything shareable/bookmarkable, in a Nano store — those belong in
  Query or the URL.
- A store read in a component subscribes via the official React bindings; unsubscribes are handled by
  the binding (no manual listener leaks).

## Ephemeral

- Scroll position and virtualized row position are **restored by the Router**, not hand-managed in a
  store. Transient UI state (a hover, an uncommitted input) stays in component state.

Review flags:

- Shareable state (a filter, a sort) kept in a Nano store or component state instead of the URL.
- The same value written to both the URL and a store (two sources of truth).
- Server data mirrored into a Nano store or component state.
- Scroll/virtualization position hand-managed instead of using Router restoration.

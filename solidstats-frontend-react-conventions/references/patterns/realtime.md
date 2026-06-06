# Realtime (SSE)

Real-time updates use **SSE by default**. WebSocket is reserved for flows where the client must send
live messages to the server — don't introduce it otherwise.

## No-surprise updates

- SSE updates **must not reorder or insert content above the current viewport** in a way that causes
  layout shift (CLS budget — see `performance.md`). They must not steal focus (see `a11y.md`).
- When live data changes while the user is reading a table, prefer a **"new updates available"
  affordance** or a controlled merge over unexpected viewport movement.

## Per-page merge discipline

Merge behavior is page-specific (brief):

- **Small, local** changes can **auto-merge** with a notification.
- **Large recalculations** or updates affecting multiple tables/charts require **explicit user
  confirmation** before applying.

The merge policy for a page is an explicit decision, not an accident of where the SSE handler lives.

## Connection & freshness states

- **Reconnect, offline, timeout, and stale-data states** are visible, accessible, and **testable**.
- Cached or stale data is **explicitly labeled** when offline, timed out, or served after a backend
  error. Public stats may use long cache lifetimes precisely because SSE supplies the freshness signal —
  so the staleness label is how the user knows what they're seeing.

Review flags:

- An SSE update that shifts the viewport / inserts above the fold / steals focus.
- A large recalc auto-applied without confirmation; a small local change forcing a full reload.
- A missing/unlabeled stale/offline/timeout/reconnect state.
- WebSocket introduced for a server→client-only flow that SSE covers.

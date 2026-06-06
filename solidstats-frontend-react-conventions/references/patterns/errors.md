# Errors

Errors are part of the trust the product sells. UI must make clear what went wrong and what the user
can do next.

## Error codes

- API and UI errors use **stable, unique error codes** (the API owns its codes; `server-2` keeps them
  versioned). UI maps codes to localized recovery copy — never renders a raw error string.
- Recovery copy **distinguishes user-action errors from application/server errors**: a user-action error
  tells the user how to fix it; an **application/server error** includes a path to contact the
  maintainers and surfaces a **request/debug identifier** where available.

## Request & form states

- Request UI handles every `server-2` state: **validation, duplicate, cooldown, rate-limit, and
  rejection**. Validation behavior (brief): after submit, show validation errors, then update them live
  as each error is fixed.
- Form errors appear near the field, are announced accessibly, and include recovery guidance (see
  `a11y.md`).

## Data trust states

- Stale / offline / timeout data is **explicitly labeled** (see `realtime.md`). Provenance — last
  updated, unknown/conflict badges, parse/status context — is shown where available (see
  `domain-rules.md`); an unknown or conflicted value is never silently rendered as if certain.

## Boundaries

- Route/render errors are caught at a route error boundary with a recovery action, not a blank screen
  or a console-only failure (Playwright blocks console errors on critical journeys — see `tests.md`).
- Unauthorized (wrong role) access shows a contextual **403** with missing-rights context and recovery
  (see `routing.md`).

Review flags:

- A raw error string rendered to the user instead of a code-mapped, localized message.
- An application/server error with no contact path / request id; a user error with no recovery guidance.
- A request flow missing a `server-2` state (rate-limit/duplicate/cooldown/validation/rejection).
- Stale/unknown/conflict data rendered as certain; a route error that blanks the screen or only logs.

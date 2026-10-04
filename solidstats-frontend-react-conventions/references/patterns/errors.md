# Errors

Errors are part of the trust the product sells. UI must make clear what went
wrong and what the user
can do next.

## Error codes

Read the
[public HTTP
contract](../../../solidstats-shared-project-standards/references/http-api-contract.md)
for the canonical envelope, code semantics, and exact details schemas. The API
owns public codes;
the frontend consumes its generated variants and owns their localized recovery
behavior.

- The envelope retains `statusCode`, `error`, `message`, and optional
  `details`, and adds required
  **`errorCode`**. `error` is the HTTP status label; `message` is safe display
  text. Neither is a
  programmatic key. Public `errorCode` values are stable snake_case and globally
  unambiguous by
  semantic meaning. Reuse across endpoints is valid only for the same meaning
  and details contract;
  do not invent per-screen substitutes for API codes.
- Branch on **`errorCode`** for domain causes and map known variants to
  localized recovery copy and
  actions. Keep HTTP status for transport/auth handling; two domain errors
  sharing a status still
  require different recovery when their semantics differ. Never branch on
  `message`, `error`, or
  status alone to distinguish domain causes, and never parse a message to
  recover missing codes.
- Narrow a known generated error variant by `errorCode` before reading its exact
  `details`.
  Requiredness and nullability belong to that code's schema; avoid a generic
  details bag, unrelated
  field probes, or casts. Localization/recovery maps over known finite codes
  must be complete at
  compile time (see `typescript.md`).
- Unknown code, missing/malformed envelope, empty response, or network failure
  goes to a safe
  localized fallback with an appropriate recovery action. Preserve available
  HTTP/debug context,
  avoid leaking raw response text, and do not cast a fallback into a known API
  error union or assign
  a known domain code without evidence. Boundary decoding lives in the shared
  client, not repeated
  in each component; generated static types alone do not prove an actual
  response is valid.
- Recovery copy **distinguishes user-action errors from application/server
  errors**: a user-action error
  tells the user how to fix it; an **application/server error** includes a path
  to contact the
  maintainers and surfaces a **request/debug identifier** where available.

## Request & form states

- Request UI handles every `server-2` state: **validation, duplicate, cooldown,
  rate-limit, and
  rejection**. Validation behavior (brief): after submit, show validation
  errors, then update them live
  as each error is fixed.
- Form errors appear near the field, are announced accessibly, and include
  recovery guidance (see
  `a11y.md`).

## Data trust states

- Stale / offline / timeout data is **explicitly labeled** (see `realtime.md`).
  Provenance — last
  updated, unknown/conflict badges, parse/status context — is shown where
  available (see
  `domain-rules.md`); an unknown or conflicted value is never silently rendered
  as if certain.

## Boundaries

- Route/render errors are caught at a route error boundary with a recovery
  action, not a blank screen
  or a console-only failure (Playwright blocks console errors on critical
  journeys — see `tests.md`).
- Unauthorized (wrong role) access shows a contextual **403** with
  missing-rights context and recovery
  (see `routing.md`).

Review flags:

- A raw error string rendered to the user instead of a code-mapped, localized
  message.
- Domain branching on status, `message`, or `error` instead of `errorCode`;
  two same-status causes
  collapsed into the same recovery despite distinct declared semantics.
- Details accessed without code narrowing, widened to an untyped bag, or
  unknown/malformed responses
  asserted to a known generated variant.
- An application/server error with no contact path / request id; a user error
  with no recovery guidance.
- A request flow missing a `server-2` state
  (rate-limit/duplicate/cooldown/validation/rejection).
- Stale/unknown/conflict data rendered as certain; a route error that blanks the
  screen or only logs.

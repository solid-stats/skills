# Security (frontend / SSR server)

The `web` Node SSR server is a public, OAuth-gated surface — it needs header/secret discipline at the
request/runtime layer, not only client-side input handling.

## Security headers & CSP

- The SSR server sets security headers on responses: a **Content-Security-Policy** (prefer a
  nonce-based policy; avoid blanket `unsafe-inline`), `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, and a frame policy (`frame-ancestors`). Set them via TanStack
  Start request middleware / `setResponseHeaders`.
- A missing CSP is a real XSS/clickjacking exposure for a public site — treat it as launch-blocking.

## Environment & secrets

- Only browser-intended variables carry the client prefix (`VITE_…`); **everything else is
  server-only**. **Never read a secret at module scope** in code that can reach a client bundle —
  bundlers inline module-scope values, leaking the secret into shipped JS.
- Validate env at startup (e.g. with `zod/v4-mini`) and fail fast on a missing/invalid var. Secrets are
  env-only and rotatable; never commit them, never surface them in error responses or client state.

## Uploads (evidence attachments)

- Validate uploads by **content** (magic bytes), not just filename / `Content-Type` (both forgeable);
  enforce size and type limits client- *and* server-side; strip EXIF from images.
- The drop zone is keyboard-accessible with an accessible progress indicator (see `a11y.md`); object
  URLs are revoked on cleanup (see `performance.md`).
- External evidence links use safe handling (`rel="noopener noreferrer"`, no auto-fetch/preview of
  untrusted URLs).

Review flags:

- No CSP / security headers on the SSR server; a CSP with blanket `unsafe-inline`.
- A secret read at module scope, or a non-`VITE_`-prefixed secret reachable from client code.
- An upload validated only by filename/MIME; size/type limit only on one side; EXIF not stripped.
- An external evidence link without `rel="noopener noreferrer"`.

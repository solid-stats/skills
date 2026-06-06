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

Evidence is **image uploads + external links** (brief). The upload component is a security *and*
accessibility surface — treat it as a full spec, not an `<input type="file">`.

**Validation (defense in depth — client *and* server):**

- **Validate by content, not filename/`Content-Type`** — both are attacker-forgeable. Sniff the
  **magic bytes** and accept only the allowlisted image types (e.g. PNG/JPEG/WebP); reject everything
  else with a clear error.
- Enforce **size and dimension limits** and a **per-request count** on the client (fast feedback) and
  re-enforce them on `server-2` (the real gate) — the client check is UX, never trust it.
- **Strip EXIF/metadata** from images before upload or on ingest (GPS/PII leakage); never preview an
  SVG (script vector) — disallow SVG for evidence.

**UX & accessibility:**

- The drop zone is a **keyboard-accessible** control (focusable, Enter/Space to open the picker, an
  explicit "browse" button), not a div-only drag target; drag-over state is announced, not color-only.
- Upload progress uses an accessible indicator (`<progress>` / `role="progressbar"` with an accessible
  name); the in-flight state blocks duplicate submits (see `a11y.md`).
- Show per-file pending/success/error/retry; a rejected file states *why* (type/size) and how to fix.
- **Revoke object URLs** on unmount/replace (`URL.revokeObjectURL`) — leaked blob URLs are a memory
  leak (see `performance.md`).

**External links:**

- Render with `rel="noopener noreferrer"` and `target="_blank"`; **never auto-fetch or preview** an
  untrusted external URL (SSRF/tracking/malware surface) — show the link, let the user open it.

Review flags:

- No CSP / security headers on the SSR server; a CSP with blanket `unsafe-inline`.
- A secret read at module scope, or a non-`VITE_`-prefixed secret reachable from client code.
- An upload validated only by filename/MIME, or limits only on one side; EXIF not stripped; SVG allowed.
- A div-only (non-keyboard) drop zone; upload progress with no accessible name; object URLs not revoked.
- An external evidence link without `rel="noopener noreferrer"`, or an auto-fetched/previewed untrusted URL.

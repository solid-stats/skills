# Synthetic specification exercise

This is a closed synthetic fixture, not a real server-2 feature or repository
snapshot. Treat this brief as the complete product decision and as-is evidence.
No external source lookup or backend edits are needed.

The next API slice is a public catalog of example items. The requested output is
one draft specification iteration under `swagger/changes/001_example-items/`,
with its supporting documents and catalog entry. The synthetic milestone is
`eval-v1`, specification phase `1`, implementation phase `2`. Both phases use
discussion, research, plan, execution, and verification. Discussion and research
for this exercise are complete; human approval of the resulting contract has
not been given. Independent review will occur after the exercise.

## Desired contract

- GET `/example-items` is public. It returns `items`, `hasMore`, and
  `nextCursor`. The cursor is an opaque, query-bound token, 1–1024 characters.
  Omit it for the first page. It encodes immutable creation time plus UUID,
  ordered descending by both. There are no filters or alternative sorts.
- `limit` is an integer from 1 to 100, default 25. The final page has
  `hasMore: false` and `nextCursor: null`. Otherwise both indicate continuation.
- New entries ahead of the cursor appear on refresh, deletions are omitted,
  and no snapshot or count is promised. A cursor remains usable after deletion
  of its anchor because it carries the ordering values.
- Each public item has `id` (UUID string), `name` (1–200 characters), and
  `createdAt` (RFC 3339 date-time). Internal `moderatorNote` is never public.
- POST `/example-items` is intentionally public in this synthetic fixture. It
  accepts exactly `{name}` with the same bounds, rejects unknown properties,
  and synchronously creates and returns one item with `201`. Duplicate names
  are allowed. No auth, cookie, ownership, or idempotency requirement exists.
- Schema-invalid inputs return `422`. An invalid or query-mismatched cursor
  returns `400`. The envelope is `{statusCode, error, errorCode, message}`.
  `error` is the HTTP label (`Bad Request` or `Unprocessable Entity`);
  `errorCode` is `invalid_query`, `invalid_body`, or `invalid_cursor` as applicable.
  Each code has one stable meaning across the API; no details are needed here.
  Define per-response status/code combinations, not arbitrary cross-products.
- Author OpenAPI 3.0.3. The target is prescriptive and must be reviewable
  without
  a running server.

## Synthetic current state and accepted transition

The old implementation uses integer IDs, offset pagination, and returns `200`
on creation. It has no external consumers or retained records. These are known
implementation gaps; the implementation phase replaces the old contract and
regenerates the client. The owner explicitly accepts this breaking change.
There is no real remote, baseline SHA, or published issue for this fixture:
cite this fixture honestly and never invent one.

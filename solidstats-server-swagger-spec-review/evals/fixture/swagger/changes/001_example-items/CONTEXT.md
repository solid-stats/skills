# Example items

Synthetic desired contract: see `../../../brief.md`. The brief owns scope,
acceptance, live behavior, migration, and public access.

## Acceptance map

- Read/traverse items: GET `/example-items`.
- Create item: POST `/example-items`.
- Protect internal data: public item projection.
- Validate inputs: response-specific error schemas.

## Dependencies

Depends On: none. Supersedes: synthetic integer/offset baseline described in
the brief. Changed Baselines: identifiers, pagination, and creation status.
No retained records or consumers; replace the old API and regenerate clients.

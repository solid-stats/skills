# Project patterns — index

Read this first to decide which `references/patterns/*` files apply to the code you're touching. Load
only the relevant ones, not all at once.

## By `src/` path

| Path | Load |
|------|------|
| `src/routes/**` | `routing.md`, `data-flow.md` (loader prefetch), `seo.md` (route metadata), `architecture.md` (route stays thin) |
| `src/pages/**` | `architecture.md`, `component-shape.md`, `state.md`, then the topic file for what the page does (data-flow / a11y / performance) |
| `src/shared/api/**` | `data-flow.md`, `typescript.md` (generated types) |
| `src/shared/uikit/**` | `component-shape.md`, `styling.md`, `a11y.md` |
| `src/shared/.../*.css.ts` | `styling.md` |
| anything with search params / navigation | `routing.md`, `state.md` |
| anything fetching/mutating server data | `data-flow.md` |
| anything with client-only state | `state.md` |
| localization files / UI strings | `localization.md` |
| SSE / live updates | `realtime.md`, `a11y.md`, `performance.md` |
| error handling / request states | `errors.md` |
| SSR server headers / CSP / env / secrets / uploads | `security.md` |
| any TS/TSX | `typescript.md`, `component-shape.md` (cross-cutting) |
| tests | `tests.md` (+ the `solidstats-frontend-react-tests` skill) |
| anything touching player/squad/rotation/commander/bounty/request/moderation behavior | `domain-rules.md` |

## By change type

- **New page/feature** → `architecture.md` (placement) → `routing.md` + `data-flow.md` (route+data) →
  `component-shape.md` + `styling.md` (UI) → `a11y.md` + `performance.md` + `seo.md` (quality) →
  `localization.md` → `domain-rules.md`.
- **New shared primitive** → `architecture.md` (uikit boundary) + `component-shape.md` + `styling.md` +
  `a11y.md`.
- **Data fetch/mutation** → `data-flow.md` + `typescript.md`.
- **Realtime** → `realtime.md` (+ `a11y.md`, `performance.md`).

## Common searches

- Where a resource is fetched: `rg "queryOptions\(|\$api\.(useQuery|useMutation)"`
- Hand-written DTOs (should not exist): `rg "type .*(Request|Response|Dto) ="`
- Raw fetch (should not exist): `rg "\bfetch\("`
- Hardcoded UI strings (smell): `rg ">[A-ЯA-Z][a-zа-я ]{3,}<"`
- Magic z-index / raw hex (smell): `rg "z-?index:\s*\d|#[0-9a-fA-F]{3,6}"`

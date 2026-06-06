# Architecture: layers and slices

Where code lives: the root layers, the UI layers, slice/entrypoint rules, and the uikit-vs-feature
boundary. Component-writing rules (props, server/client) live in `component-shape.md`; the data layer
(Query/Router/Nano) lives in `data-flow.md` and `state.md`. Taken from the estesis FSD frontend
architecture, retargeted to TanStack Start.

## Root layers

- **`src/routes`** — the TanStack Router file-based route tree. A route file holds the route
  definition, its **loader** (which prefetches into the Query cache — see `data-flow.md`),
  SSR/`head`/meta, and route-level guards. **Route files stay thin**: a loader plus a render that
  delegates to a page in `src/pages`. New page-level feature logic does **not** live in `src/routes`.
- **`src/pages`** — page implementations used by route entries (the composition of a whole page).
  (TanStack's route tree is `src/routes`, so the cleaner `pages` name is free here — it was `pagesUI`
  in estesis only because Next reserves `pages`.)
- **`src/shared`** — reusable components, the typed API client + query hooks, Nano stores, i18n,
  generated types, and business helpers.

## UI layers

Inside `src/pages` and `src/shared`:

- **pages** — compose the full page.
- **widgets** — compose visual blocks; may contain app logic.
- **composites** — group slices around shared logic (a "page within a page": a large, independent
  region such as a scoped feature or a multi-part dialog). A single block/modal is a **widget**, not
  a composite.
- **actions** — user interactions: buttons, inputs, uploads, submits.
- **displays** — display-only; must not interact with the user or mutate state.
- **layouts** — shared visual structure; no app/business logic.
- **wrappers** — wrap `children` for side effects, subscriptions, or data concerns; must not depend
  on the internals of the children they wrap.
- **lib** — utilities, hooks, types, schemas, constants, business helpers.

Review flags:

- Business/request/processing logic inside a visual composition file.
- User interaction added to a `displays` slice.
- App/business logic added to a `layouts` slice.
- A wrapper that depends on details of the children it wraps.
- Page-specific component or localization added to `shared/uikit`.
- New page-level feature logic placed directly in `src/routes` when nearby pages live in `src/pages`.

## Slices and entrypoints

- A **slice** is a folder with a React component; slices are **PascalCase**.
- Every slice has an `index.ts` entrypoint; consumers import from `index.ts`, never from internals.
- The entry component file matches the slice folder name and carries a **layer suffix** where the
  architecture expects it: `PlayerTableWidget`, `ApplyFiltersAction`, `RankDisplay`, `PageLayout`.
- A **composite** folder is named by its **domain** (`RequestReview`), not by layer
  (`RequestReviewComposite`); the entry *file* keeps the `Composite` suffix
  (`RequestReviewComposite.tsx`) for searchability.
- Slices contain **segments**: `ui/` (presentation), `lib/` (hooks, types, helpers, constants),
  `business/` (domain logic), and `api/` (query hooks + the typed client calls for that slice). The
  data segment holds **TanStack Query hooks and Nano stores** — there is no MobX store layer.
- **DRY:** don't copy logic, constants, or enum maps between call sites — extract one source (often a
  shared hook or a derived selector) and reuse it. After building a shared/generic component, migrate
  old ad-hoc call sites to it.
- Keep folder structure consistent within a layer; don't leave a loose file where siblings are
  foldered.

Review flags:

- Missing `index.ts` for a new slice; default export name not matching the file name.
- Code bypassing a slice's public `index.ts` to import internals.
- Composite folder named by layer, or a composite created for a single component that should be a
  widget.
- A widget reaching into another slice's `api/`/`lib` internals instead of its `index.ts`.
- Logic/constants/enum maps duplicated across slices instead of one shared source.
- A local type lifted to `shared/lib/types` when it belongs to one page/composite; a shared
  extraction with a single caller and no reuse pressure.

## Uikit vs feature UI

- **`shared/uikit`** — generic primitives only (built on Ark UI for accessible behavior). It must not
  import `pages`, business modules, page query hooks, or page localizations; props-down only.
- **`shared/layouts`** — structural slot-based layout.
- **`shared/composites`** — reusable domain UI shared across pages.
- Page-specific stores, query hooks, localization, and search-param schemas live in `pages`.

Review flags:

- A domain concept (player/squad/bounty/request) added to `shared/uikit`.
- A uikit primitive importing page/business/localization modules.
- A page slice reimplementing a generic control that already exists in uikit.
- A reusable primitive lacking controlled props, accessible names, disabled behavior, or predictable
  callback names.

# Component shape

How a component is written. The slice/layer placement lives in `architecture.md`; this file is the
component body itself. (No `observer()` — there is no MobX; components read the Query cache with
`useQuery` and client state with the Nano bindings.)

## Shape

```tsx
type Props = {
  // system props first
  className?: string;
  // then values → booleans → callbacks
  player: PlayerData;
  isActive: boolean;
  onSelect: (id: PlayerData['id']) => void;
};

export function PlayerRowDisplay({ className, player, isActive, onSelect }: Props) {
  ...
}
```

- Components are **named functions** with a typed `Props`. The **slice entry component is the default
  export matching the file name** (see `architecture.md`); other components are named exports.
- Props order — destructure (and declare) **system props first** (`children`, `className`, `style`),
  then values → booleans → callbacks/handlers.
- A wrapper around a base component reuses the base props via `Omit`/`Except` for what it injects —
  don't re-declare them.
- Callbacks passed to children use `useCallback`; **never pass a fresh inline object/array literal** as
  a prop — split into primitive props or `useMemo`.
- JSX conditionals use explicit ternaries returning `null`; never leak `0`, `''`, or a raw boolean.
- Prefer explicit variants/composition over many boolean mode props (**YAGNI** — don't add a prop you
  don't need now). Names describe behavior (`loading`, not `busy`).
- Don't extract a single-use constant that only forces the reader to jump around the file — inline it.

## Server vs client (TanStack Start)

- SEO-critical and LCP content renders on the **server** (route loader + server component); it must be
  in the initial HTML, not behind a client-only fetch (see `data-flow.md`, `seo.md`).
- **Client** components own interactivity: `useQuery`/`useMutation`, event handlers, Router hooks, Nano
  store reads. Keep the client boundary as low as composition allows — don't make a whole page a client
  component to add one interactive widget.
- Never move client hooks into server route/loader code, or server-only helpers into client components.

## Icons & controls

- Icons are **Lucide** components, renamed to PascalCase locals (`leftIcon: LeftIcon`). No emoji as
  structural icons. Decorative icons are `aria-hidden`; icon-only controls require an accessible name
  (see `a11y.md`).
- Buttons default to `type="button"` unless a submit is intentional.

## Media & layout stability

- Reserve dimensions for images, media, tables, and skeletons so nothing shifts (CLS budget — see
  `performance.md`). Use the framework image handling with explicit sizing; lazy by default, eager only
  for a real first-viewport/LCP image.

Review flags:

- An anonymous-arrow component where a named function is expected; entry component not the default
  export matching the file name.
- Props not system-first; a fresh inline object/array passed as a prop; a handler not memoized.
- JSX leaking `0`/`''`/boolean from a `&&` conditional.
- A client hook in server code (or vice versa); an over-broad client boundary.
- An emoji used as a structural icon; an icon-only control with no accessible name.
- Async content (image/table/skeleton) with no reserved space.

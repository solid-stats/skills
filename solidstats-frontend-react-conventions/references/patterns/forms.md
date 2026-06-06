# Forms — TanStack Form

The guided request steppers (identity, add/remove kills, add/remove teamkills, remove-from-replay,
commander dispute) and any other multi-field input use **TanStack Form**.

## Why TanStack Form

- Native TanStack Start **SSR** integration — drafts are SSR-prefetched (brief), so the form hydrates
  with server data without a client-only fill.
- **Field-level subscription**: only the changed field re-renders, which protects the INP/CWV budget on
  large steppers.
- Headless + typed: pairs with Ark UI input primitives and `zod/v4-mini` validation.

## Conventions

- One form instance per stepper. The validator is a **`zod/v4-mini`** schema (via Standard Schema),
  reused wherever the same shape is typed elsewhere.
- **Live-after-submit validation** (brief): validate on submit, then revalidate per-field on change so
  each error clears as the user fixes it (set the revalidation mode to on-change *after* first submit;
  don't validate-on-every-keystroke before the first submit). No final review step.
- **Subscribe narrowly** — use the `field` API / `form.Subscribe`; never read whole form state in a
  parent and re-render the tree.
- Submit goes through a `useSubmit<Name>` mutation (see `data-flow.md`). Drafts autosave via a
  **debounced** mutation to the `server-2` draft resource (created after the first meaningful edit,
  save/saving/error states, 7-day TTL — see `domain-rules.md`).
- Field components wrap Ark UI primitives with visible labels, helper text, and announced errors
  (see `a11y.md`); uploads follow `security.md`.
- No ad-hoc `useState` form state for a multi-field form — the form instance owns it.

Review flags:

- A multi-field form built on ad-hoc `useState`/refs instead of TanStack Form.
- Validation not wired to `zod/v4-mini`; whole-form-state read in a parent causing wide re-renders.
- Validate-on-keystroke before first submit, or no live revalidation after submit.
- Draft not autosaved to the `server-2` resource (kept local), or a final review step added.

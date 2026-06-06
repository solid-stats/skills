# Localization

Typed, ICU-capable i18n. RU + EN from the start (brief); no hardcoded UI strings. The aliasing
discipline is adapted from the estesis `ln` pattern.

## Routing & language

- Public localized routes are prefixed `/ru/...` and `/en/...` (see `routing.md`). First visit to `/`
  redirects by browser language preference where possible, with an explicit switcher and a persisted
  user choice.
- Dates/times/numbers are localized for the user; ops/moderation contexts expose UTC in a secondary
  hint where useful. Stats numerals use the tabular-numeral face (see `styling.md`).

## Keys & usage

- UI strings are **never hardcoded** in components — every string goes through the i18n path.
- Keys are structured by domain/layer (not a flat `{ key }` map), so a page/feature owns its subtree.
- In a component, alias the used subtree to **`const ln`** rather than repeating long paths in JSX. A
  second alias is allowed only as a **named** sub-tree that says what it points at
  (`const queueLn = ln.queue`), never a generic `aln`. Don't extract a single-use sub-tree.
- ICU is used for **pluralization, gender, and formatting** — RU plural rules (one/few/many) must be
  handled by ICU, not string concatenation.
- Replacement keys must **match across locales**; RU and EN are kept at parity (a key exists in both).
- Validator/error copy is localized, not hardcoded; error `code` values are stable and unique (see
  `errors.md`).

## Library

The brief mandates a **typed, ICU-capable** i18n with typed keys (the exact library is an
implementation follow-up). Whatever the choice: keys are typed (a missing/renamed key is a `tsc`
error), ICU message syntax is supported, and RU/EN parity is enforced.

Review flags:

- A hardcoded UI string in a component instead of an i18n key.
- A flat key map instead of the domain/layer structure; long localization paths in JSX instead of
  `const ln`; a generic second alias (`aln`).
- A key present in one locale but not the other; pluralization done by string concatenation instead of
  ICU.
- A localized date/number rendered with raw `toString()` instead of the localized formatter.

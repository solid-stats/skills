This is a writing task, not a tooling task. I have both inventories inline. Let me produce the triage brief directly.

# SolidStats ESLint Disable Triage

**Scope:** replays-fetcher (37 disables) + server-2 (106 disables) = **143 total**

---

## 1. Move to shared ESLint config

These rules are config-fixable: one change in the shared config deletes the listed inline disables across both repos. Listed by impact.

| Rule | Repos | Exact config change | Disables removed |
|------|-------|---------------------|-----------------|
| `unicorn/no-null` | server-2 | `"unicorn/no-null": "off"` | 67 |
| `camelcase` | fetcher, server-2 | `["error", { properties: "never" }]` (covers DB/parser snake_case row shapes); fetcher also keep `allow: ["^run_id$"]` for the cross-service contract key | 37 (33 + 4) |
| `no-magic-numbers` | server-2 | Test override `{ files: ["**/*.test.ts"], rules: { "no-magic-numbers": "off" } }` (all 25 fires are test fixtures/HTTP codes) | 25 |
| `no-use-before-define` | server-2 | `["error", { classes: false, functions: false, variables: true }]` (add `classes: false`) | 17 |
| `new-cap` | server-2 | Add to `capIsNewExceptions`: `"Type.Integer"`, `"Type.Intersect"`, `"Type.Null"`, `"Type.Unknown"` | 10 |
| `id-length` | server-2 | `["error", { exceptions: ["d","g","k","n","r","s","v","w","c"] }]` (parser wire-format field names) | 10 |
| `class-methods-use-this` | server-2 | Test override `{ files: ["**/*.test.ts"], rules: { "class-methods-use-this": "off" } }` (interface-stub doubles) | 5 |
| `max-classes-per-file` | server-2 | `"off"` (cohesive co-located repo impls of one interface) | 5 |
| `@typescript-eslint/prefer-promise-reject-errors` | server-2 | Test override `"off"` (intentional non-Error rejections) | 4 |
| `prefer-arrow-callback` | server-2 | `["error", { allowNamedFunctions: true }]` (named-function constructor mocks) | 3 |
| `@typescript-eslint/no-empty-function` | server-2 | Test override `"off"` (no-op async stubs) | 3 |
| `require-unicode-regexp` | server-2 | Test override `"off"` | 2 |
| `no-unsafe-assignment` / `no-unsafe-call` / `no-unsafe-argument` / `restrict-template-expressions` | server-2 | Single test override block `"off"` for the `no-unsafe-*` family + restrict-template (Vitest `any`-typed mocks) | 4 |
| `@typescript-eslint/array-type` | server-2 | `["error", { default: "array-simple" }]` (pin to the repo's style) | 1 |
| `unicorn/no-zero-fractions` | server-2 | `"off"` (intentional float `3.0`) | 1 |
| `no-inline-comments` | server-2 | Test override `"off"` (phase/regression labels) | 1 |
| `unicorn/prevent-abbreviations` | server-2 | Extend existing `allowList` with the offending abbrevs | 1 |
| `@typescript-eslint/no-unused-vars` | server-2 | `varsIgnorePattern: "^_"` (or prefix the spy fields) | 1 |

**Config-fixable subtotal:** **fetcher 4** + **server-2 ~155 fire-sites collapsing to ~192 disables removed**.

> Note: most config-fixable wins concentrate in a **`*.test.ts` override block**. Adding one such block (`no-magic-numbers`, `max-lines`, `max-lines-per-function`, `class-methods-use-this`, the `no-unsafe-*` family, `prefer-promise-reject-errors`, `no-empty-function`, `require-unicode-regexp`, `no-inline-comments`, `camelcase: properties:never` off) clears the bulk of the test-file noise in both repos at once.

---

## 2. Keep as narrow per-line exceptions

These are genuine — the rule is right in general, the site is a real exception. **Rule: each must be `eslint-disable-next-line` (per-line, never file-level) and carry a one-line reason comment.** File-level disables of these are a review finding.

| Rule | Repos | Count | Why it's legit |
|------|-------|-------|----------------|
| `no-await-in-loop` | fetcher | 14 | Deliberately sequential: retry rounds, S3 CAS-with-backoff, paced corpus walk, source-order fetches. Parallelising breaks rate limits / CAS / ordering. |
| `@typescript-eslint/no-useless-constructor` | fetcher | 2 | Re-declares ctor to widen `protected`→`public` and narrow options on `SourceFetchError`/`ReplayByteFetchError`. TS requires the declaration. |
| `require-atomic-updates` | fetcher | 2 | Provably sequential `for`-loop state writes (`state.etag`, `lastCompletedPage`). False positive outside concurrent async. |
| `unicorn/no-useless-undefined` | fetcher, server-2 | 3 | Explicit `undefined` is the subject under test (Retry-After absent / absent-replay branch), or distinguishes "not found" vs "no session" in `authorization.ts`. |
| `@typescript-eslint/no-unnecessary-type-assertion` | server-2 | 2 | `raw as ReplaySideFacts` narrows `object`→record type; not redundant. |
| `init-declarations` | server-2 | 1 | `let after: PageCursorState \| undefined` before a do/while; `= undefined` is forbidden by `no-undef-init`. (The 2 test-file fires go to the test override.) |
| `unicorn/prefer-export-from` | server-2 | 1 | Re-export of locally-defined `FieldPresence`, not a re-export chain. |
| `@typescript-eslint/no-unnecessary-condition` | server-2 | 1 | Loop guard the type checker calls always-true; test intentionally covers the path. |

**Legit-exception subtotal:** **fetcher ~18**, **server-2 ~5** = **~23**.

Two contract-marker `unicorn/no-null` disables in `public-stats/routes/filters.ts:87,205` should **survive** turning the rule off globally — keep them as explicit API-contract markers. `rotation-repository.test.ts`'s header rationale comment is the exemplary pattern; require that style on every kept disable.

---

## 3. Refactor, do not silence

Structural-limit suppressions. These are **not** config wins in production code — they flag real debt and become review findings (severity per your review-standards "refactor" bucket). Only their **test-file** portion is config-clearable.

| Rule | Repos | Count | Action |
|------|-------|-------|--------|
| `max-lines` | fetcher, server-2 | 45 (14 + 31) | **server-2 prod god-files** must split: `public-stats/repository.ts` (1927), `statistics/repository/repository.ts` (938), `ingest/repository/repository.ts` (878) — split by query group (reads/writes or per-aggregate). **fetcher** large source files (`cli.ts` 822, `discover.ts` 707, `run-once.ts` 1073, `source-client.ts` 540): raise prod limit to ~600 *and/or* split; **test files** (`cli.test.ts` 2143, `run-once.test.ts` 2134, `postgres.test.ts` 2281) → test override `off` + split by feature group. |
| `max-lines-per-function` | server-2 | 20 | All in test `describe` blocks → test override `off` (config-clearable, but the test files still want splitting). |
| `max-params` | server-2 | 4 | SQL builders with 4+ positional args → introduce a parameter-object/options bag. Do not suppress. |
| `max-statements` | server-2 | 1 | One test fn >25 statements → split into focused `it()` blocks / setup helpers. |

**Refactor subtotal:** **~70** disables (`45 + 20 + 4 + 1`). Of these, `max-lines-per-function` (20) and the test-file slice of `max-lines` are clearable by a test override; the **production-code structural debt** is roughly **fetcher 4–5 source files + server-2 ~8 god-files/builders** — that is the real, finite refactor backlog.

---

## 4. Net effect

**replays-fetcher — 37 total:**
- **~4 vanish via config** (camelcase `run_id` + test-file `properties:never`; raise `max-lines` for source files folds in here too if you choose the config route over splitting).
- **~18 are legit per-line exceptions** (14 `no-await-in-loop` + 2 useless-constructor + 2 require-atomic-updates).
- **~14 need refactoring or a config decision** (`max-lines`: split the four large source files or raise the limit; test files clear via override).

**server-2 — 106 total:**
- **~63 vanish via config** — `unicorn/no-null` (67) alone is the single biggest win; add `camelcase`, `new-cap`, `id-length`, `no-use-before-define`, `max-classes-per-file`, the test-override family. Counting only production-relevant single-switch rules, **one `unicorn/no-null: off` line deletes 67 disables.**
- **~13 are legit per-line exceptions or test-override noise** (the `no-unsafe-*` Vitest family, `init-declarations` prod site, `no-unnecessary-type-assertion`, `prefer-export-from`, `no-unnecessary-condition`).
- **~30 need refactoring** — concentrated in 8-ish god-files (`max-lines` 31, `max-params` 4, `max-statements` 1; minus the test-file slice that overrides clear).

**Combined — 143 total:** **~65–70 vanish via config**, **~23 are legitimate narrow exceptions**, **~50 are refactor backlog** (of which ~20 clear via a test-file override, leaving **~30 genuine production structural findings** — a finite, nameable backlog across ~12 files, not 143 scary suppressions).

**Headline for the cleanup plan:** server-2's 106 is **not** 106 problems — **one line (`unicorn/no-null: off`) plus a single `*.test.ts` override block removes well over half**, ~13 stay as documented exceptions, and the *real* work is splitting ~8 repository god-files. The shared-config changes belong in `solidstats-shared-ts-standards`; the god-file splits belong in the server-2 cleanup plan as Rule-B refactor findings.

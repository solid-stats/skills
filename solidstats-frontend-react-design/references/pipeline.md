# Pipeline — brief → spec → prototype → gate → graduate

Detail for the five stages summarized in `SKILL.md`. Each stage produces one artifact and hands to
the next. In GSD these map onto the UI phase; the spec is `CONTEXT`/`VALIDATION`, the build is an
execute step, the gate is `solidstats-frontend-react-design-review`.

## 1. Brief

State the composition and priority order **out loud before building**. A fix that pattern-matches a
request to the smallest local patch and creates two new problems is a failure, even if it closes the
one raised. Inputs: `gsd-briefs/web.md` (scope, quality bar, design direction), the `DESIGN.md`
system, and the `server-2` OpenAPI shapes for this surface. Output: the one-paragraph job +
information priority order (feeds spec §1).

## 2. Spec

Fill `references/spec-template.md`. It is the durable artifact; the prototype is disposable. Do not
start pixels until §4 (scenario endings), §5 (data volumes), and §6 (responsiveness) are answered —
they determine the layout. **Actively pull the checklist.design checklists** for this surface's
components and flows (browse `/browse`), record which apply, and fold their items into the states +
acceptance — they also seed the E2E. In GSD this becomes the UI phase `CONTEXT` + `VALIDATION`.

## 3. Prototype & catalog — local Ladle, real stack

Build the surface in the **Ladle** component catalog (Vite-native and lean, supports
Tailwind) inside the `web` repo, on the **real** stack: Ark UI headless primitives + Tailwind v4
utilities from the `DESIGN.md`-exported `@theme` + Lucide icons. Dark-only.

**Ladle is durable, not a throwaway.** Every shared UIKit component keeps a permanent Ladle story —
the story is its home, and the catalog is a first-class app deliverable: it onboards new developers
(browse every component and its states) and it is the **isolation harness for component / integration
tests** (`solidstats-frontend-react-tests` drives the stories one component at a time,
deterministically). Prototyping a new surface and growing the catalog are the same act.

The prototype is the **seed of
production** — the same component graduates into a route, so there is zero proto↔prod drift. For
full-page layouts a throwaway TanStack Start route works too. Drive UX-rule and chart choices with
`ui-ux-pro-max` advisory output.

- **Tokens only.** Use theme utilities / `var(--…)`. **No arbitrary values** (`bg-[#…]`, `p-[7px]`)
  — they bypass the token single-source-of-truth and the adherence lint, and the whole point of the
  `DESIGN.md` layer evaporates.
- **Build to pass the gates.** Every state from spec §4/§5 present; container-query responsive at
  every project breakpoint (`design-system.md`); axe-core-clean; contrast-clean.

## 4. Visual gate

Hand to [`solidstats-frontend-react-design-review`](../../solidstats-frontend-react-design-review/SKILL.md):
Playwright screenshots at the project breakpoints (`design-system.md`), `design.md lint`, axe-core, CLS, scroll restoration, the
checklist.design component checklist, and the Selectel handoff checklist. **Fix the class of issue**
across the file — not just the single line the review raised.

## 5. Graduate

**Pages** compose the catalogued components into the TanStack Start route tree per
[`solidstats-frontend-react-conventions`](../../solidstats-frontend-react-conventions/SKILL.md):
loaders prefetch into the Query cache, SSR / `head` / meta, FSD placement, route-level splitting.
Commit the **spec and the code together**. Keep the hi-fi reference until the live route supersedes
it. If a new durable design rule emerged, write it into the web repo's `.design/CLAUDE.md` so the
next surface inherits it.

## LLM hygiene (when an LLM drives the pipeline)

The pipeline is meant to be run by an agent; these keep that reliable.

- **The spec template is the output schema.** Fill every section — a structured contract is what
  keeps multi-step LLM generation from drifting (output divergence on multi-step tasks runs 20–30%+,
  often more). A half-filled spec is where the bugs come from.
- **Pin the model version** for any LLM-generated spec or component. Silent model retuning changes
  output format and tool-call behavior — a real production failure mode — so reproducibility needs a
  pinned version, not "latest".
- **Review single-pass, not iteratively.** Iterative LLM feedback on the *same* design shows
  diminishing returns (established for early GPT-4; frontier models likely plateau rather than
  degrade — a calibration signal, not a hard law). Prefer generate → run the
  `solidstats-frontend-react-design-review` gates once → fix the class → regenerate, over endless
  self-review loops. The gates are **tool-grounded** (Playwright / axe-core / `design.md lint` /
  the checklists), not LLM aesthetic judgment — which is unreliable for subtle design semantics.

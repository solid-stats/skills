# Core patterns — cosmetic YAML

## core/cosmetic-yaml-indentation

```yaml
name: cosmetic-yaml-indentation
title: YAML uses two-space indentation and no tabs
category: cosmetic
kind: core
severity_when_violated: LOW
applies_to: [all specification YAML]
related: [cosmetic-yaml-key-order, cosmetic-yaml-blank-lines]
```

### Rule — cosmetic-yaml-indentation

Indent YAML by two spaces per level; never use tabs or mix indentation widths
in one file. List items
align with their parent level according to normal YAML structure.

### Rationale — cosmetic-yaml-indentation

Consistent indentation makes nested OpenAPI objects reviewable and
formatter-safe.

### Applicable situations — cosmetic-yaml-indentation

Every created or edited YAML specification.

### Detection — cosmetic-yaml-indentation

Search for tab characters and inspect sibling keys for unequal indentation.

### Severity — cosmetic-yaml-indentation

LOW — readability and merge quality suffer.

### Good example — cosmetic-yaml-indentation

_Synthetic SolidStats example:_

<!-- markdownlint-disable MD013 -->
```yaml
paths:
  /replays:
    get:
      operationId: listReplays
```
<!-- markdownlint-enable MD013 -->

### Bad example — cosmetic-yaml-indentation

<!-- markdownlint-disable MD013 -->
```yaml
paths:
    /replays:
      get:
        operationId: listReplays
```
<!-- markdownlint-enable MD013 -->

### Related rules — cosmetic-yaml-indentation

- [cosmetic-yaml-key-order](core-cosmetic-yaml.md#corecosmetic-yaml-key-order)
- [cosmetic-yaml-blank-lines](core-cosmetic-yaml.md#corecosmetic-yaml-blank-lines)

## core/cosmetic-yaml-key-order

```yaml
name: cosmetic-yaml-key-order
title: Operations and schemas use a consistent key order
category: cosmetic
kind: core
severity_when_violated: LOW
applies_to: [operations and component schemas]
related: [cosmetic-yaml-indentation, cosmetic-yaml-blank-lines]
```

### Rule — cosmetic-yaml-key-order

Use a consistent operation order: `operationId`, `summary`, `description`,
`tags`, `security`,
`parameters`, `requestBody`, `responses`. Order response statuses numerically
and schema properties
by useful domain reading order. The local document may use a verified
established order consistently.

### Rationale — cosmetic-yaml-key-order

Predictable order makes security and response changes easy to review.

### Applicable situations — cosmetic-yaml-key-order

Modified OpenAPI operations and schemas.

### Detection — cosmetic-yaml-key-order

Flag zig-zag key order, unordered statuses, or alphabetical properties that
obscure identity and
lifecycle fields without a local convention.

### Severity — cosmetic-yaml-key-order

LOW — no wire behavior changes.

### Good example — cosmetic-yaml-key-order

_Synthetic SolidStats example:_ an operation declares `security` before
validated query parameters and
statuses `200`, `401`, `422` in ascending order.

### Bad example — cosmetic-yaml-key-order

`responses` appears first, `operationId` last, and statuses are `422`, `200`,
`401`.

### Related rules — cosmetic-yaml-key-order

- [cosmetic-yaml-indentation](core-cosmetic-yaml.md#corecosmetic-yaml-indentation)
- [cosmetic-yaml-blank-lines](core-cosmetic-yaml.md#corecosmetic-yaml-blank-lines)

## core/cosmetic-yaml-blank-lines

```yaml
name: cosmetic-yaml-blank-lines
title: YAML spacing is deliberate and trailing whitespace is absent
category: cosmetic
kind: core
severity_when_violated: LOW
applies_to: [all specification YAML]
related: [cosmetic-yaml-indentation, wording-paragraph-spacing]
```

### Rule — cosmetic-yaml-blank-lines

Use one blank line between major top-level sections and adjacent path blocks
when it improves
readability. Do not leave repeated blank lines or trailing whitespace; end
each file with one newline.
Inside block descriptions, blank lines mean paragraphs and are governed by the
wording rule.

### Rationale — cosmetic-yaml-blank-lines

Whitespace affects both clean diffs and rendered Markdown-like description
paragraphs.

### Applicable situations — cosmetic-yaml-blank-lines

All YAML edits and formatter output.

### Detection — cosmetic-yaml-blank-lines

Search for trailing whitespace and repeated empty lines; inspect final newline
and description blocks.

### Severity — cosmetic-yaml-blank-lines

LOW — presentation quality is degraded.

### Good example — cosmetic-yaml-blank-lines

_Synthetic SolidStats example:_ `paths` is separated from `components` by one
blank line and adjacent
replay paths have one blank line between them.

### Bad example — cosmetic-yaml-blank-lines

Two blank lines precede every path and a multiline description has spacer-only
empty lines.

### Related rules — cosmetic-yaml-blank-lines

- [cosmetic-yaml-indentation](core-cosmetic-yaml.md#corecosmetic-yaml-indentation)
- [wording-paragraph-spacing](core-wording.md#corewording-paragraph-spacing)

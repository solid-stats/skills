# Automatic specification validation

Validate every new or changed stage YAML before human handoff and after each
contract fix. The writer and reviewer use the same helper. It reads files and
reports results; it does not format, rewrite, upload or publish a specification.

## Setup and execution

Use Python 3.10 or newer and an isolated environment. Resolve `<skill>` to the
installed writer directory and `<python>` to that environment's interpreter.
These placeholders are paths to substitute, not literal shell syntax.

<!-- markdownlint-disable MD013 -->

```text
<python> -m pip install -r <skill>/scripts/requirements.txt
<python> <skill>/scripts/validate_openapi.py --profile solidstats --cases <cases.json> <stage.yaml> <another-stage.yaml>
```

<!-- markdownlint-enable MD013 -->

Quote paths containing spaces. Reuse a suitable existing environment; do not
install into a shared or system Python merely to validate one specification.
Dependency installation can need network access, but validation accepts only
self-contained documents and does not fetch external references.

The helper always checks UTF-8 YAML/JSON parsing, duplicate keys,
JSON-compatible values, OpenAPI 3.0.3, local references and structural validity.
The required `--profile solidstats` adds the supported mechanical checks for
public naming, object-union tags/mappings, precise error variants and conflicting
error-code definitions across the supplied documents. The plain command without
the profile remains a structural diagnostic, not the authoring acceptance gate.

Pass the current compatible contract scope, including the proposed slice and
related active definitions. Do not combine superseded historical stages as if
they were simultaneous definitions. Record which files/revisions were checked;
the helper cannot discover an API-wide inventory or understand domain meaning.
It does not mechanically judge English plurals, verb/resource intent or whether
two differently described conditions are semantically the same.

A successful JSON result includes file SHA-256 values and the case-sidecar
identity when supplied. Failure returns a nonzero status; missing dependencies
return status 2. Unsupported composite forms in the strict checks are a
verification gap, not an implied pass. Local refs and supported straightforward
composition remain self-contained; validation never retrieves remote schemas.

## Payload cases

Store a JSON sidecar beside the stage YAML, for example `01_topic.cases.json`.
Pass it with `--cases`. It contains concrete payloads checked against schema
pointers, independently of any schema-level example annotations:

```json
{
  "cases": [
    {
      "file": "01_topic.yaml",
      "schema": "#/components/schemas/ReplayResult",
      "valid": true,
      "value": {"status": "ready", "replayId": "7ba97651-117d-486f-8016-d8c951fb3779"}
    },
    {
      "file": "01_topic.yaml",
      "schema": "#/components/schemas/ReplayResult",
      "valid": false,
      "category": "unknown-discriminator",
      "value": {"status": "unrecognized"}
    }
  ]
}
```

This is a format illustration; complete it for the real schema. Paths resolve
relative to the sidecar and must identify documents also passed to the command.
Every encountered union needs a valid payload matching each branch exactly
once, plus negative payloads for missing/unknown discriminator and wrong field
types. Add mixed-variant fields when variants have different fields, and
forbidden-null cases where nonnullable fields exist. Category labels alone are
not evidence: the payload must exhibit the claimed condition. Primitive unions
need appropriate case evidence without fake object discriminators; unsupported
forms must be resolved with a verified checker before acceptance.

The strict helper currently reports gaps for primitive unions, callback
operations, recursive error-shape comparisons and unsupported `allOf`
intersections. JSON error responses need concrete HTTP statuses; `default`,
`4XX` and `5XX` cannot establish a fixed status/code contract. Protocol-owned
names that fall outside the supported casing checks need explicit verification
of that exception, not a false claim that the standard profile passed.
Conventional HTTP status-label aliases are accepted; Python runtime versions
must not silently redefine that wire vocabulary.

The bundled `templates/openapi-skeleton.cases.json` demonstrates complete
positive/negative coverage for its synthetic `CursorError` union. Omit
`--cases` only if no union requires case coverage; still verify ordinary
request/response examples and optional/null semantics in review. The helper
tests branch truth independently of discriminator dispatch so a mapping cannot
hide overlapping schemas.

Record the exact command, result and schema/case content digests in the
existing phase
verification/review evidence. Review must cover the same bytes submitted for
approval. Do not claim success from visual inspection or an earlier revision.

## Meaning and limits

Validation establishes structural validity and the reported profile/case
coverage, not a complete or correct product contract. Finite examples do not
prove every possible payload. Review still checks exact business types,
semantic error-code uniqueness across the active API, authorization, live
cursor semantics, bounds, acceptance and consumer transitions. The helper does
not enforce every convention or execute the backend. Do not claim complete
semantic guarantees from a green validator.

Missing dependencies or an unavailable check are a validation gap. Resolve the
environment or report the precise blockage; never emit a clean acceptance based
on an unrun mandatory gate. A syntax-only parser is not an OpenAPI validator.

During implementation, use server-2's current export/verify commands and typed
client checks as well. Compare the intended operations and schemas to generated
output semantically; a partial stage file cannot equal the whole API byte for
byte. Also verify behavior the schema cannot encode. Existing baseline defects
are recorded as implementation work, not copied into a new authored contract.

## Primary documentation

- [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html).
- [Validator Python
  API](https://openapi-spec-validator.readthedocs.io/en/latest/python.html).
- [OpenAPI payload validator](https://openapi-schema-validator.readthedocs.io/en/latest/validation.html).
- [Fastify Swagger](https://github.com/fastify/fastify-swagger).

Dependencies are pinned in `scripts/requirements.txt`. These checks do not
authorize changing the consumer's dialect or upgrading its runtime packages.

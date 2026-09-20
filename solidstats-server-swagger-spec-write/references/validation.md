# Automatic specification validation

Validate every new or changed stage YAML before human handoff and after each
contract fix. The writer and reviewer use the same helper. It reads files and
reports results; it does not format, rewrite, upload or publish a specification.

## Setup and execution

Use Python 3.10 or newer and an isolated environment. Resolve `<skill>` to the
installed writer directory and `<python>` to that environment's interpreter.
These placeholders are paths to substitute, not literal shell syntax.

```text
<python> -m pip install -r <skill>/scripts/requirements.txt
<python> <skill>/scripts/validate_openapi.py <stage.yaml> <another-stage.yaml>
```

Quote paths containing spaces. Reuse a suitable existing environment; do not
install into a shared or system Python merely to validate one specification.
Dependency installation can need network access, but validation accepts only
self-contained documents and does not fetch external references.

The helper checks UTF-8 YAML/JSON parsing, duplicate keys, JSON-compatible
values,
the profile's OpenAPI 3.0.3 version, local `$ref` resolution and OpenAPI
structural
validity. A successful JSON result includes each file's SHA-256. A failed file
produces a nonzero exit status; missing dependencies return status 2.

Record the exact command, result and content digests in the existing phase
verification/review evidence. Review must cover the same bytes submitted for
approval. Do not claim success from visual inspection or an earlier revision.

## Meaning and limits

Validation establishes structural validity, not a complete or correct product
contract. Review still checks authorization, live cursor semantics, bounded
input, examples, acceptance coverage and implementation/consumer transitions.
The helper does not enforce every business convention or execute the backend.

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
- [Fastify Swagger](https://github.com/fastify/fastify-swagger).

Dependencies are pinned in `scripts/requirements.txt`. These checks do not
authorize changing the consumer's dialect or upgrading its runtime packages.

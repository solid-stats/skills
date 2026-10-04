"""Validate self-contained SolidStats OpenAPI files without resolving remote refs."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


def load_dependencies():
    try:
        import yaml
        from openapi_spec_validator import OpenAPIV30SpecValidator
    except ImportError as exc:
        raise RuntimeError(
            "Missing validator dependency. Install scripts/requirements.txt "
            "in an isolated Python environment."
        ) from exc
    return yaml, OpenAPIV30SpecValidator


def load_payload_validator():
    try:
        from openapi_schema_validator import OAS30Validator
    except ImportError as exc:
        raise RuntimeError("Missing payload validator dependency; install requirements.txt.") from exc
    return OAS30Validator


def load_document(raw: bytes, yaml):
    class UniqueKeyLoader(yaml.SafeLoader):
        pass

    def unique_mapping(loader, node, deep=False):
        loader.flatten_mapping(node)
        result = {}
        for key_node, value_node in node.value:
            key = loader.construct_object(key_node, deep=deep)
            if not isinstance(key, str):
                raise ValueError(
                    f"YAML mapping keys must be strings at line "
                    f"{key_node.start_mark.line + 1}; quote HTTP status codes."
                )
            if key in result:
                raise ValueError(
                    f"Duplicate YAML key {key!r} at line "
                    f"{key_node.start_mark.line + 1}."
                )
            result[key] = loader.construct_object(value_node, deep=deep)
        return result

    UniqueKeyLoader.add_constructor(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping
    )
    document = yaml.load(raw.decode("utf-8-sig"), Loader=UniqueKeyLoader)
    if not isinstance(document, dict):
        raise ValueError("An OpenAPI document must be a mapping.")
    # Reject cyclic aliases and non-JSON YAML values before passing to a validator.
    json.dumps(document, allow_nan=False)
    if document.get("openapi") != "3.0.3":
        raise ValueError("This SolidStats profile requires openapi: 3.0.3.")
    return document


def resolve_pointer(document, reference: str):
    if not reference.startswith("#"):
        raise ValueError(f"External $ref is not allowed: {reference!r}.")
    fragment = unquote(reference[1:])
    if fragment and not fragment.startswith("/"):
        raise ValueError(f"Expected an internal JSON Pointer: {reference!r}.")
    target = document
    for part in fragment.split("/")[1:]:
        token = part.replace("~1", "/").replace("~0", "~")
        try:
            if isinstance(target, dict):
                target = target[token]
            # RFC 6901 section 4: ASCII digits, with no leading zeros.
            # Numeric-looking object keys above are not array indices.
            elif isinstance(target, list) and re.fullmatch(r"0|[1-9][0-9]*", token):
                target = target[int(token)]
            else:
                raise KeyError(token)
        except (KeyError, IndexError) as exc:
            raise ValueError(f"Unresolved internal $ref: {reference!r}.") from exc
    return target


def check_references(document):
    named_maps = {
        "properties", "schemas", "parameters", "responses", "headers",
        "examples", "requestBodies", "links", "callbacks", "paths", "content",
        "securitySchemes",
    }

    def walk(value, named_map=False, example_object=False, example_map=False):
        if isinstance(value, dict):
            # Example/default/enum payloads are data, even if they contain '$ref'.
            # Carry map context from the parent; a schema itself may be named
            # 'responses' or 'properties' without becoming an OpenAPI map.
            for key, child in value.items():
                if named_map:
                    walk(child, example_object=example_map)
                    continue
                if key == "$ref":
                    if not isinstance(child, str):
                        raise ValueError("$ref must be a string.")
                    resolve_pointer(document, child)
                if (
                    key in {"example", "default", "enum"}
                    or key.startswith("x-")
                    or (key == "value" and example_object)
                ):
                    continue
                walk(child, named_map=key in named_maps, example_map=key == "examples")
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(document)


def pointer_child(pointer, token):
    return pointer + "/" + str(token).replace("~", "~0").replace("/", "~1")


def schema_nodes(document):
    """Visit Schema Objects, never example data or arbitrary extension objects."""
    def schemas(schema, pointer):
        if not isinstance(schema, dict):
            return
        yield pointer, schema
        for name, child in schema.get("properties", {}).items():
            yield from schemas(child, pointer_child(pointer_child(pointer, "properties"), name))
        for key in ("items", "additionalProperties", "not"):
            yield from schemas(schema.get(key), pointer_child(pointer, key))
        for key in ("allOf", "oneOf", "anyOf"):
            for index, child in enumerate(schema.get(key, [])):
                yield from schemas(child, pointer_child(pointer_child(pointer, key), index))

    named_maps = {"responses", "parameters", "headers", "requestBodies", "callbacks", "links", "paths", "content", "securitySchemes"}

    def objects(value, pointer, named_map=False):
        if isinstance(value, dict):
            for key, child in value.items():
                location = pointer_child(pointer, key)
                if named_map:
                    yield from objects(child, location)
                    continue
                if key.startswith("x-") or key in {"example", "examples", "default", "enum"}:
                    continue
                if location == "#/components/schemas":
                    for name, schema in child.items():
                        yield from schemas(schema, pointer_child(location, name))
                elif key == "schema":
                    yield from schemas(child, location)
                else:
                    yield from objects(child, location, key in named_maps)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                yield from objects(child, pointer_child(pointer, index))

    yield from objects(document, "#")


ANNOTATIONS = {"title", "description", "example", "examples", "default", "externalDocs"}

# Fixed status-label vocabulary: IANA labels plus conventional Node HTTP labels.
# https://www.iana.org/assignments/http-status-codes/
# https://nodejs.org/api/http.html#httpstatus_codes
# Do not let Python's changing HTTPStatus vocabulary redefine a wire contract.
HTTP_LABELS = {
    400: ("Bad Request",), 401: ("Unauthorized",), 402: ("Payment Required",),
    403: ("Forbidden",), 404: ("Not Found",), 405: ("Method Not Allowed",),
    406: ("Not Acceptable",), 407: ("Proxy Authentication Required",),
    408: ("Request Timeout",), 409: ("Conflict",), 410: ("Gone",),
    411: ("Length Required",), 412: ("Precondition Failed",),
    413: ("Content Too Large", "Payload Too Large", "Request Entity Too Large"),
    414: ("URI Too Long", "Request-URI Too Long", "Request URI Too Long"),
    415: ("Unsupported Media Type",),
    416: ("Range Not Satisfiable", "Requested Range Not Satisfiable"),
    417: ("Expectation Failed",), 418: ("I'm a teapot", "I'm a Teapot"),
    421: ("Misdirected Request",), 422: ("Unprocessable Content", "Unprocessable Entity"),
    423: ("Locked",), 424: ("Failed Dependency",), 425: ("Too Early",),
    426: ("Upgrade Required",), 428: ("Precondition Required",),
    429: ("Too Many Requests",), 431: ("Request Header Fields Too Large",),
    451: ("Unavailable For Legal Reasons",), 500: ("Internal Server Error",),
    501: ("Not Implemented",), 502: ("Bad Gateway",), 503: ("Service Unavailable",),
    504: ("Gateway Timeout",), 505: ("HTTP Version Not Supported",),
    506: ("Variant Also Negotiates",), 507: ("Insufficient Storage",),
    508: ("Loop Detected",), 510: ("Not Extended",),
    511: ("Network Authentication Required",),
}


def contract_shape(document, schema, seen=()):
    """Normalize validation shape for collision checks; prose meaning needs review."""
    if isinstance(schema, dict):
        if "$ref" in schema:
            reference = schema["$ref"]
            if reference in seen:
                raise ValueError("Verification gap: recursive error shape comparison is unsupported.")
            return contract_shape(document, resolve_pointer(document, reference), seen + (reference,))
        if "allOf" in schema:
            return contract_shape(document, effective_schema(document, schema, seen), seen)
        result = {}
        for key, value in schema.items():
            if key in ANNOTATIONS or key.startswith("x-"):
                continue
            if key == "properties":
                result[key] = {name: contract_shape(document, field, seen) for name, field in value.items()}
            elif key == "required":
                result[key] = sorted(value)
            elif key == "enum":
                result[key] = sorted(value, key=lambda item: json.dumps(item, sort_keys=True))
            elif key == "discriminator":
                result[key] = value  # Literal maps, not nested schemas.
            else:
                result[key] = contract_shape(document, value, seen)
        return result
    if isinstance(schema, list):
        return [contract_shape(document, value, seen) for value in schema]
    return schema


def effective_schema(document, schema, seen=()):
    """Resolve refs/simple allOf without pretending arbitrary intersections flatten."""
    if "$ref" in schema:
        reference = schema["$ref"]
        if reference in seen:
            raise ValueError("Verification gap: recursive composition cannot be inspected.")
        return effective_schema(document, resolve_pointer(document, reference), seen + (reference,))
    if "allOf" not in schema:
        return schema
    parts = [effective_schema(document, part, seen) for part in schema["allOf"]]
    parts.append({key: value for key, value in schema.items() if key != "allOf"})
    declaring = [part for part in parts if part.get("properties")]
    all_fields = set.union(set(), *(set(part.get("properties", {})) for part in parts))
    if (len(declaring) > 1 and any(part.get("additionalProperties") is False for part in parts)) or any(
        part.get("additionalProperties") is False and all_fields - set(part.get("properties", {})) for part in parts
    ):
        raise ValueError("Verification gap: closed allOf object intersections are unsupported.")
    merged = {}
    for part in parts:
        if any(key in part for key in ("oneOf", "anyOf", "not")):
            raise ValueError("Verification gap: alternative/negated allOf members are unsupported.")
        for key, value in part.items():
            if key in ANNOTATIONS or key.startswith("x-"):
                continue
            if key == "required":
                merged[key] = sorted(set(merged.get(key, [])) | set(value))
            elif key == "properties":
                properties = merged.setdefault(key, {})
                for name, definition in value.items():
                    if name in properties and contract_shape(document, properties[name]) != contract_shape(document, definition):
                        raise ValueError("Verification gap: intersecting allOf property constraints are unsupported.")
                    properties[name] = definition
            elif key in merged and merged[key] != value:
                raise ValueError(f"Verification gap: intersecting allOf {key} constraints are unsupported.")
            else:
                merged[key] = value
    return merged


def check_union(document, pointer, schema):
    discriminator = schema.get("discriminator", {})
    tag = discriminator.get("propertyName")
    mapping = discriminator.get("mapping")
    if not tag or not isinstance(mapping, dict):
        raise ValueError(f"{pointer}: oneOf requires a discriminator and explicit mapping.")
    literals, refs, shapes = {}, [], []
    for branch in schema["oneOf"]:
        reference = branch.get("$ref")
        if not reference or not reference.startswith("#/components/schemas/"):
            raise ValueError(f"{pointer}: Verification gap: oneOf supports named object refs only.")
        shape = effective_schema(document, branch)
        if shape.get("type") != "object" or any(key in shape for key in ("oneOf", "anyOf", "not")):
            raise ValueError(f"{pointer}: Verification gap: oneOf branch must be a concrete object.")
        field = effective_schema(document, shape.get("properties", {}).get(tag, {}))
        values = field.get("enum", [])
        if tag not in shape.get("required", []) or field.get("type") != "string" or field.get("nullable") or len(values) != 1 or not isinstance(values[0], str):
            raise ValueError(f"{pointer}: each branch requires the same non-null string tag with a singleton enum.")
        literal = values[0]
        if literal in literals:
            raise ValueError(f"{pointer}: overlapping oneOf tags: {literal!r}.")
        literals[literal] = reference
        refs.append(reference)
        shapes.append(shape)
    if mapping != literals:
        raise ValueError(f"{pointer}: discriminator mapping must match branch literal/ref pairs exactly.")
    return {"kind": "oneOf", "tag": tag, "mapping": literals, "refs": refs, "shapes": shapes}


def register_error(document, schema, location, registry, status=None):
    shape = effective_schema(document, schema)
    if "oneOf" in shape:
        if shape.get("discriminator", {}).get("propertyName") != "errorCode":
            raise ValueError(f"{location}: error oneOf discriminator must be errorCode.")
        for branch in shape["oneOf"]:
            register_error(document, branch, location, registry, status)
        return
    if shape.get("type") != "object" or any(key in shape for key in ("anyOf", "not")):
        raise ValueError(f"{location}: Verification gap: error must be a concrete object or tagged oneOf.")
    if shape.get("additionalProperties") is not False:
        raise ValueError(f"{location}: error envelope must be closed with additionalProperties: false.")
    fields = shape.get("properties", {})
    required = {"statusCode", "error", "errorCode", "message"}
    if not required <= set(shape.get("required", [])) or not required <= set(fields):
        raise ValueError(f"{location}: error envelope requires statusCode, error, errorCode, message.")
    resolved = {name: effective_schema(document, fields[name]) for name in required}
    code = resolved["errorCode"].get("enum", [])
    statuses = resolved["statusCode"].get("enum", [])
    if resolved["errorCode"].get("type") != "string" or len(code) != 1 or not isinstance(code[0], str) or not re.fullmatch(r"[a-z][a-z0-9]*(?:_[a-z0-9]+)*", code[0]):
        raise ValueError(f"{location}: errorCode requires a singleton snake_case string enum.")
    if resolved["statusCode"].get("type") != "integer" or len(statuses) != 1 or type(statuses[0]) is not int or not 400 <= statuses[0] <= 599 or (status is not None and statuses[0] != status):
        raise ValueError(f"{location}: statusCode must fix the actual 4xx/5xx status.")
    labels = HTTP_LABELS.get(statuses[0])
    if not labels:
        raise ValueError(f"{location}: Verification gap: unknown HTTP status label.")
    error_values = resolved["error"].get("enum", [])
    if resolved["error"].get("type") != "string" or len(error_values) != 1 or error_values[0] not in labels:
        raise ValueError(f"{location}: error must fix a corresponding HTTP status label: {labels!r}.")
    if resolved["message"].get("type") != "string" or any(field.get("nullable") for field in resolved.values()):
        raise ValueError(f"{location}: error envelope fields must be non-null; message must be text.")
    fingerprint = contract_shape(document, shape)
    previous = registry.get(code[0])
    if previous and previous[0] != fingerprint:
        raise ValueError(f"{location}: errorCode collision {code[0]!r}; incompatible contract at {previous[1]}.")
    registry[code[0]] = (fingerprint, location)


def check_profile(document, source, error_registry, operation_ids):
    camel = r"[a-z][a-zA-Z0-9]*"
    if document.get("components", {}).get("callbacks"):
        raise ValueError("Verification gap: callback operations are outside the bounded strict profile.")
    for parameter in document.get("components", {}).get("parameters", {}).values():
        parameter = effective_schema(document, parameter)
        if parameter.get("in") in {"query", "path"} and not re.fullmatch(camel, parameter["name"]):
            raise ValueError(f"Component query/path parameter {parameter['name']!r} must be camelCase; Verification gap for documented protocol exceptions: no automatic exemption.")
    for name in document.get("components", {}).get("schemas", {}):
        if not re.fullmatch(r"[A-Z][a-zA-Z0-9]*", name):
            raise ValueError(f"Schema name {name!r} must be PascalCase.")
    unions = {}
    for pointer, schema in schema_nodes(document):
        for name in schema.get("properties", {}):
            if not re.fullmatch(camel, name):
                raise ValueError(f"{pointer}: JSON property {name!r} must be camelCase; Verification gap for documented protocol exceptions: no automatic exemption.")
        if "$ref" in schema:
            continue  # Reference Object siblings are ignored in OAS 3.0.3.
        if not schema.get("type") and not any(key in schema for key in ("allOf", "oneOf", "anyOf")):
            if "/allOf/" in pointer:
                raise ValueError(f"{pointer}: Verification gap: untyped allOf constraint members are not inferred.")
            raise ValueError(f"{pointer}: schema needs an explicit type or resolvable composition.")
        shape = effective_schema(document, schema)
        if shape.get("type") == "array" and not isinstance(shape.get("items"), dict):
            raise ValueError(f"{pointer}: arrays require an item schema.")
        if shape.get("type") == "object" and shape.get("additionalProperties") is not False and not isinstance(shape.get("additionalProperties"), dict):
            raise ValueError(f"{pointer}: object must be closed or declare a typed dictionary.")
        if "oneOf" in shape and "anyOf" in shape:
            raise ValueError(f"{pointer}: Verification gap: combined oneOf/anyOf constraints are unsupported.")
        if "oneOf" in shape:
            unions[pointer] = check_union(document, pointer, shape)
        elif "anyOf" in shape:
            unions[pointer] = {
                "kind": "anyOf",
                "refs": [pointer_child(pointer_child(pointer, "anyOf"), index)
                         for index in range(len(shape["anyOf"]))],
            }
        if {"statusCode", "errorCode"} <= set(shape.get("properties", {})):
            register_error(document, shape, f"{source}:{pointer}", error_registry)
    methods = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}
    for path, item in document.get("paths", {}).items():
        if path.endswith("/") and path != "/":
            raise ValueError(f"{path}: trailing resource slash is not allowed.")
        for segment in path.split("/")[1:]:
            if path == "/":
                continue
            pattern = camel if segment.startswith("{") and segment.endswith("}") else r"[a-z0-9]+(?:-[a-z0-9]+)*"
            name = segment[1:-1] if segment.startswith("{") and segment.endswith("}") else segment
            if not re.fullmatch(pattern, name):
                raise ValueError(f"{path}: literal segments need lower-kebab-case; path names need camelCase.")
        item = effective_schema(document, item)
        for method, operation in item.items():
            if method not in methods:
                continue
            if operation.get("callbacks"):
                raise ValueError("Verification gap: callback operations are outside the bounded strict profile.")
            identifier = operation.get("operationId", "")
            if not re.fullmatch(camel, identifier):
                raise ValueError(f"{path} {method}: operationId is required and must be camelCase.")
            if identifier in operation_ids:
                raise ValueError(f"Duplicate operationId {identifier!r}: {operation_ids[identifier]} and {source}:{path}.")
            operation_ids[identifier] = f"{source}:{path}:{method}"
            for parameter in item.get("parameters", []) + operation.get("parameters", []):
                parameter = effective_schema(document, parameter)
                if parameter.get("in") in {"query", "path"} and not re.fullmatch(camel, parameter["name"]):
                    raise ValueError(f"{path}: query/path parameter {parameter['name']!r} must be camelCase; Verification gap for documented protocol exceptions: no automatic exemption.")
            for status, response in operation["responses"].items():
                if status != "default" and not re.fullmatch(r"[45](?:[0-9]{2}|XX)", status):
                    continue
                response = effective_schema(document, response)
                for media, content in response.get("content", {}).items():
                    if media == "application/json" or media.endswith("+json"):
                        if "schema" not in content:
                            raise ValueError(f"{path} {status}: JSON error response requires a schema.")
                        if "X" in status or status == "default":
                            raise ValueError(f"{path} {status}: Verification gap: error ranges need explicit statuses.")
                        register_error(document, content["schema"], f"{source}:{path}:{status}", error_registry, int(status))
    return unions


def load_cases(path, raw=None):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"Duplicate case JSON key {key!r}.")
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError(f"Case JSON contains non-finite value {value}.")

    document = json.loads((raw if raw is not None else path.read_bytes()).decode("utf-8-sig"), object_pairs_hook=unique, parse_constant=reject_constant)
    if not isinstance(document, dict) or set(document) != {"cases"} or not isinstance(document["cases"], list):
        raise ValueError("Case sidecar must be an object containing a cases array.")
    cases = []
    for index, case in enumerate(document["cases"]):
        if not isinstance(case, dict) or not {"file", "schema", "valid", "value"} <= set(case) or set(case) - {"file", "schema", "valid", "value", "category"}:
            raise ValueError(f"Case {index}: expected file, schema, valid, value and optional category.")
        if not isinstance(case["file"], str) or not isinstance(case["schema"], str) or type(case["valid"]) is not bool or not isinstance(case.get("category", ""), str):
            raise ValueError(f"Case {index}: file/schema/category must be strings and valid a boolean.")
        cases.append({**case, "file": str((path.parent / case["file"]).resolve())})
    return cases


def check_cases(document, cases, unions, validator_class):
    # The library dispatches unions through discriminator. Remove annotations to
    # exercise actual branch constraints/exclusivity instead of that shortcut.
    validation_root = copy.deepcopy(document)
    known_schemas = {pointer for pointer, _ in schema_nodes(document)}
    for _, schema in schema_nodes(validation_root):
        schema.pop("discriminator", None)
    validator = validator_class(validation_root, format_checker=validator_class.FORMAT_CHECKER)
    results, coverage = [], {pointer: {"branches": set(), "negative": set(), "overlap": False} for pointer in unions}
    for index, case in enumerate(cases):
        pointer = case["schema"]
        if pointer not in known_schemas:
            raise ValueError(f"Case {index}: schema must point to a Schema Object in the input document.")
        errors = list(validator.evolve(schema={"$ref": pointer}).iter_errors(case["value"]))
        actual = not errors
        if actual != case["valid"]:
            detail = errors[0].message if errors else "payload unexpectedly matches the schema"
            raise ValueError(f"Case {index} {pointer}: expected valid={case['valid']}, got {actual}: {detail}.")
        if pointer in unions:
            union = unions[pointer]
            matches = [reference for reference in union["refs"] if validator.evolve(schema={"$ref": reference}).is_valid(case["value"])]
            if actual and union["kind"] == "oneOf" and len(matches) != 1:
                raise ValueError(f"Case {index}: oneOf payload must match exactly one branch.")
            coverage[pointer]["branches"].update(matches if actual else [])
            category = case.get("category")
            value = case["value"]
            if union["kind"] == "anyOf":
                if actual and len(matches) > 1:
                    coverage[pointer]["overlap"] = True
                if not actual and category == "no-matching-branch":
                    if matches:
                        raise ValueError(f"Case {index}: negative category {category!r} is not evidenced by this payload.")
                    coverage[pointer]["negative"].add(category)
            elif not actual and isinstance(value, dict):
                tag = union["tag"]
                leaves = []
                def leaf_errors(items):
                    for error in items:
                        leaves.append(error)
                        leaf_errors(error.context)
                selected = union["mapping"].get(value.get(tag)) if isinstance(value.get(tag), str) else None
                if selected:
                    leaf_errors(validator.evolve(schema={"$ref": selected}).iter_errors(value))
                else:
                    leaf_errors(errors)
                all_fields = set.union(*(set(shape.get("properties", {})) for shape in union["shapes"]))
                selected_fields = set(union["shapes"][union["refs"].index(selected)].get("properties", {})) if selected else all_fields
                evidenced = {
                    "missing-discriminator": tag not in value,
                    "unknown-discriminator": tag in value and value[tag] not in union["mapping"] if isinstance(value.get(tag), str) else False,
                    "invalid-field-type": any(error.validator == "type" and error.instance is not None and list(error.path) and (list(error.path)[0] != tag or not isinstance(value.get(tag), str)) for error in leaves),
                    "forbidden-null": any(error.validator == "type" and error.instance is None and list(error.path) and list(error.path)[0] != tag for error in leaves),
                    "mixed-variant-fields": bool((set(value) - selected_fields) & all_fields),
                }
                if category in evidenced:
                    if not evidenced[category]:
                        raise ValueError(f"Case {index}: negative category {category!r} is not evidenced by this payload.")
                    coverage[pointer]["negative"].add(category)
        results.append({"schema": pointer, "expectedValid": case["valid"], "actualValid": actual, "category": case.get("category")})
    for pointer, union in unions.items():
        missing_branches = set(union["refs"]) - coverage[pointer]["branches"]
        if union["kind"] == "anyOf":
            missing_negative = {"no-matching-branch"} - coverage[pointer]["negative"]
            missing_overlap = not coverage[pointer]["overlap"]
            if missing_branches or missing_negative or missing_overlap:
                raise ValueError(f"{pointer}: anyOf case coverage missing branches {sorted(missing_branches)}; negatives {sorted(missing_negative)}; overlap {missing_overlap}.")
            continue
        required_negative = {"missing-discriminator", "unknown-discriminator", "invalid-field-type"}
        shapes = union["shapes"]
        all_fields = set.union(*(set(shape.get("properties", {})) for shape in shapes))
        if any(shape.get("additionalProperties") is False and all_fields - set(shape.get("properties", {})) for shape in shapes):
            required_negative.add("mixed-variant-fields")
        if any(name != union["tag"] and not effective_schema(document, field).get("nullable") for shape in shapes for name, field in shape.get("properties", {}).items()):
            required_negative.add("forbidden-null")
        missing_negative = required_negative - coverage[pointer]["negative"]
        if missing_branches or missing_negative:
            raise ValueError(f"{pointer}: oneOf case coverage missing branches {sorted(missing_branches)}; negatives {sorted(missing_negative)}.")
    return results


def validate_file(path: Path, yaml, validator_class, *, profile=False, cases=(),
                  error_registry=None, operation_ids=None, payload_validator=None):
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    document = load_document(raw, yaml)
    check_references(document)
    errors = []
    for error in validator_class(document).iter_errors():
        location = "/" + "/".join(str(part) for part in error.path)
        errors.append(f"{location}: {error.message}")
        if len(errors) == 20:
            errors.append("Stopped after 20 validation errors.")
            break
    if errors:
        raise ValueError("\n".join(errors))
    result = {"file": str(path), "sha256": digest, "valid": True}
    unions = check_profile(
        document, str(path), error_registry if error_registry is not None else {},
        operation_ids if operation_ids is not None else {},
    ) if profile else {}
    if profile or cases:
        result["profile"] = "solidstats" if profile else None
        result["cases"] = check_cases(document, cases, unions, payload_validator or load_payload_validator())
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", choices=["solidstats"], help="Check bounded SolidStats naming, exact schemas, unions and errors.")
    parser.add_argument("--cases", type=Path, help="JSON sidecar of schema-pointer positive/negative payload cases.")
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args(argv)
    try:
        yaml, validator_class = load_dependencies()
        payload_validator = load_payload_validator() if args.profile or args.cases else None
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        print(json.dumps({"valid": False, "files": [], "error": str(exc)}, indent=2))
        return 2
    try:
        case_bytes = args.cases.read_bytes() if args.cases else None
        cases = load_cases(args.cases, case_bytes) if args.cases else []
        input_files = {str(path.resolve()) for path in args.files}
        outside = {case["file"] for case in cases} - input_files
        if outside:
            raise ValueError(f"Case sidecar references files outside the supplied input scope: {sorted(outside)}.")
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        print(json.dumps({"valid": False, "files": [], "error": str(exc)}, indent=2))
        return 1
    results = []
    error_registry, operation_ids = {}, {}
    for path in args.files:
        try:
            # A rejected document must not pollute collision state for later files.
            file_errors, file_operations = copy.deepcopy(error_registry), dict(operation_ids)
            results.append(validate_file(
                path, yaml, validator_class, profile=bool(args.profile),
                cases=[case for case in cases if case["file"] == str(path.resolve())],
                error_registry=file_errors, operation_ids=file_operations,
                payload_validator=payload_validator,
            ))
            error_registry, operation_ids = file_errors, file_operations
        except Exception as exc:
            # YAML and third-party validators expose several exception classes.
            # Report a failed gate, never silently treat a crashed check as valid.
            results.append({"file": str(path), "valid": False, "error": str(exc)})
            print(f"{path}: {exc}", file=sys.stderr)
    valid = all(result["valid"] for result in results)
    report = {"valid": valid, "files": results}
    if args.cases:
        report["caseSidecar"] = {"file": str(args.cases), "sha256": hashlib.sha256(case_bytes).hexdigest()}
    print(json.dumps(report, indent=2))
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())

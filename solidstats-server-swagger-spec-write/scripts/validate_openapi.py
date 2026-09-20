"""Validate self-contained SolidStats OpenAPI files without resolving remote refs."""

from __future__ import annotations

import argparse
import hashlib
import json
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
            elif isinstance(target, list) and token.isdecimal():
                target = target[int(token)]
            else:
                raise KeyError(token)
        except (KeyError, IndexError) as exc:
            raise ValueError(f"Unresolved internal $ref: {reference!r}.") from exc


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


def validate_file(path: Path, yaml, validator_class):
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
    return {"file": str(path), "sha256": digest, "valid": True}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args(argv)
    try:
        yaml, validator_class = load_dependencies()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    results = []
    for path in args.files:
        try:
            results.append(validate_file(path, yaml, validator_class))
        except Exception as exc:
            # YAML and third-party validators expose several exception classes.
            # Report a failed gate, never silently treat a crashed check as valid.
            results.append({"file": str(path), "valid": False, "error": str(exc)})
            print(f"{path}: {exc}", file=sys.stderr)
    valid = all(result["valid"] for result in results)
    print(json.dumps({"valid": valid, "files": results}, indent=2))
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())

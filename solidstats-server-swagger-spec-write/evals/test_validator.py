"""Behavioral checks for the read-only specification validator."""

import copy
import importlib.util
import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_openapi.py"
SPEC = importlib.util.spec_from_file_location("spec_validator", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
YAML, VALIDATOR = MODULE.load_dependencies()


def minimal_document():
    return {
        "openapi": "3.0.3",
        "info": {"title": "Synthetic check", "version": "0.1.0"},
        "paths": {
            "/items": {"get": {"responses": {"200": {"description": "Success"}}}}
        },
    }


def profile_document():
    document = minimal_document()
    document["paths"]["/items"]["get"]["operationId"] = "listItems"
    return document


def error_schema(code="item_not_found", status=404):
    return {
        "type": "object", "additionalProperties": False,
        "required": ["statusCode", "error", "errorCode", "message"],
        "properties": {
            "statusCode": {"type": "integer", "enum": [status]},
            "error": {"type": "string", "enum": [MODULE.HTTP_LABELS[status][0]]},
            "errorCode": {"type": "string", "enum": [code]},
            "message": {"type": "string"},
            "details": {"type": "object", "additionalProperties": False,
                        "required": ["itemId"], "properties": {"itemId": {"type": "string"}}},
        },
    }


def union_document():
    document = profile_document()
    document["components"] = {"schemas": {
        "Result": {
            "oneOf": [{"$ref": "#/components/schemas/Ready"}, {"$ref": "#/components/schemas/Failed"}],
            "discriminator": {"propertyName": "status", "mapping": {
                "ready": "#/components/schemas/Ready", "failed": "#/components/schemas/Failed",
            }},
        },
        "Ready": {"type": "object", "additionalProperties": False,
                  "required": ["status", "count"], "properties": {
                      "status": {"type": "string", "enum": ["ready"]},
                      "count": {"type": "integer"},
                      "note": {"type": "string", "nullable": True},
                  }},
        "Failed": {"type": "object", "additionalProperties": False,
                   "required": ["status", "reason"], "properties": {
                       "status": {"type": "string", "enum": ["failed"]},
                       "reason": {"type": "string"},
                   }},
    }}
    return document


def union_cases():
    values = [
        (True, {"status": "ready", "count": 2}, "branch-ready"),
        (True, {"status": "failed", "reason": "Unavailable"}, "branch-failed"),
        (False, {"count": 2}, "missing-discriminator"),
        (False, {"status": "unknown", "count": 2}, "unknown-discriminator"),
        (False, {"status": "ready", "count": "2"}, "invalid-field-type"),
        (False, {"status": "ready", "count": None}, "forbidden-null"),
        (False, {"status": "ready", "count": 2, "reason": "Unavailable"}, "mixed-variant-fields"),
    ]
    return [{"schema": "#/components/schemas/Result", "valid": valid,
             "value": value, "category": category} for valid, value, category in values]


class ValidatorTests(unittest.TestCase):
    def validate(self, document, **options):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "spec.yaml"
            path.write_text(json.dumps(document), encoding="utf-8")
            return MODULE.validate_file(path, YAML, VALIDATOR, **options)

    def test_checked_template_and_exact_digest(self):
        result = MODULE.validate_file(
            ROOT / "templates" / "openapi-skeleton.yaml", YAML, VALIDATOR
        )
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["sha256"]), 64)

    def test_missing_dependencies_return_json_failure_and_status_two(self):
        for loader in ("load_dependencies", "load_payload_validator"):
            with self.subTest(loader=loader):
                output, errors = io.StringIO(), io.StringIO()
                with patch.object(MODULE, loader, side_effect=RuntimeError("Missing dependency")):
                    with redirect_stdout(output), redirect_stderr(errors):
                        status = MODULE.main(["--profile", "solidstats", "unread.yaml"])
                self.assertEqual(status, 2)
                self.assertEqual(json.loads(output.getvalue()), {
                    "valid": False, "files": [], "error": "Missing dependency",
                })
                self.assertIn("Missing dependency", errors.getvalue())

    def test_duplicate_paths_are_rejected_instead_of_overwritten(self):
        with self.assertRaisesRegex(ValueError, "Duplicate YAML key 'paths'"):
            MODULE.load_document(
                b"openapi: 3.0.3\npaths: {}\npaths: {}\n", YAML
            )

    def test_broken_internal_reference(self):
        document = minimal_document()
        document["paths"]["/items"]["get"]["responses"]["200"] = {
            "$ref": "#/components/responses/Missing"
        }
        with self.assertRaisesRegex(ValueError, "Unresolved internal"):
            self.validate(document)

    def test_array_reference_indices_require_canonical_ascii_digits(self):
        for profile in (False, True):
            for index in ("00", "01", "+0", "-1", "-", "\u0660", "\uff10", "", "2"):
                with self.subTest(profile=profile, index=index):
                    document = profile_document()
                    document["components"] = {"schemas": {
                        "Count": {"allOf": [{"type": "integer"}, {"type": "integer"}]},
                        "Alias": {"$ref": "#/components/schemas/Count/allOf/" + index},
                    }}
                    with self.assertRaisesRegex(ValueError, "Unresolved internal"):
                        self.validate(document, profile=profile)

    def test_canonical_array_indices_and_numeric_object_keys_still_resolve(self):
        for index in ("0", "1"):
            document = profile_document()
            document["components"] = {"schemas": {
                "Count": {"allOf": [{"type": "integer"}, {"type": "integer"}]},
                "Alias": {"$ref": "#/components/schemas/Count/allOf/" + index},
            }}
            self.assertTrue(self.validate(document, profile=True)["valid"])
        document = {"00": "leading zero key", "\u0660": "unicode key"}
        self.assertEqual(MODULE.resolve_pointer(document, "#/00"), "leading zero key")
        self.assertEqual(MODULE.resolve_pointer(document, "#/%D9%A0"), "unicode key")

    def test_unused_component_reference_is_still_checked(self):
        document = minimal_document()
        document["components"] = {"schemas": {"Item": {"$ref": "#/missing"}}}
        with self.assertRaisesRegex(ValueError, "Unresolved internal"):
            self.validate(document)

    def test_external_reference_is_rejected_before_library_resolution(self):
        document = minimal_document()
        document["paths"]["/items"]["get"]["responses"]["200"] = {
            "$ref": "https://example.invalid/private.yaml"
        }
        validator = Mock()
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "spec.json"
            path.write_text(json.dumps(document), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "External"):
                MODULE.validate_file(path, YAML, validator)
        validator.assert_not_called()

    def test_example_ref_is_literal_payload_not_a_document_reference(self):
        document = minimal_document()
        document["paths"]["/items"]["get"]["responses"]["200"]["content"] = {
            "application/json": {
                "schema": {"type": "object"},
                "examples": {"literal": {"value": {"$ref": "https://example.invalid"}}},
            }
        }
        self.assertTrue(self.validate(document)["valid"])

    def test_schema_property_named_example_still_resolves_its_ref(self):
        document = minimal_document()
        document["components"] = {"schemas": {"Item": {
            "type": "object", "properties": {"example": {"$ref": "#/missing"}}
        }}}
        with self.assertRaisesRegex(ValueError, "Unresolved internal"):
            self.validate(document)

    def test_openapi_structure_and_dialect_are_checked(self):
        for mutation in ("missing_info", "null_type", "const", "version"):
            with self.subTest(mutation=mutation):
                document = minimal_document()
                if mutation == "missing_info":
                    del document["info"]
                elif mutation == "version":
                    document["openapi"] = "3.1.0"
                else:
                    schema = {"type": "null"} if mutation == "null_type" else {
                        "type": "string", "const": "only"
                    }
                    document["components"] = {"schemas": {"Item": schema}}
                with self.assertRaises(ValueError):
                    self.validate(document)

    def test_schema_names_cannot_hide_external_references(self):
        for name in ("responses", "properties", "schemas", "examples"):
            with self.subTest(name=name):
                document = minimal_document()
                document["components"] = {"schemas": {name: {
                    "$ref": "https://example.invalid/never-fetch.yaml"
                }}}
                with self.assertRaisesRegex(ValueError, "External"):
                    MODULE.check_references(document)

    def test_literal_property_names_do_not_hide_nested_references(self):
        for name in ("default", "enum", "example", "x-private", "$ref"):
            with self.subTest(name=name):
                document = minimal_document()
                document["components"] = {"schemas": {"Item": {
                    "type": "object", "properties": {name: {"$ref": "#/missing"}}
                }}}
                with self.assertRaisesRegex(ValueError, "Unresolved internal"):
                    MODULE.check_references(document)

    def test_nullable_uuid_validation_bounds_and_201_are_accepted(self):
        document = minimal_document()
        document["paths"]["/items"]["post"] = {
            "requestBody": {"content": {"application/json": {"schema": {
                "type": "object", "additionalProperties": False,
                "properties": {"title": {"type": "string", "maxLength": 200}},
            }}}},
            "responses": {"201": {"description": "Created"}},
        }
        document["components"] = {"schemas": {"Identifier": {
            "type": "string", "format": "uuid", "nullable": True
        }}}
        self.assertTrue(self.validate(document)["valid"])

    def test_cli_reports_all_files_and_fails_on_one_bad_document(self):
        with tempfile.TemporaryDirectory() as folder:
            good = Path(folder) / "good.json"
            bad = Path(folder) / "bad.json"
            document = minimal_document()
            good.write_text(json.dumps(document), encoding="utf-8")
            invalid = copy.deepcopy(document)
            del invalid["paths"]
            bad.write_text(json.dumps(invalid), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(good), str(bad)],
                capture_output=True, text=True, check=False,
            )
        self.assertEqual(result.returncode, 1)
        report = json.loads(result.stdout)
        self.assertFalse(report["valid"])
        self.assertEqual([item["valid"] for item in report["files"]], [True, False])


class ProfileTests(unittest.TestCase):
    def validate(self, document, cases=(), registry=None):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "spec.json"
            path.write_text(json.dumps(document), encoding="utf-8")
            return MODULE.validate_file(path, YAML, VALIDATOR, profile=True,
                                        cases=cases, error_registry=registry)

    def test_no_union_does_not_require_case_sidecar(self):
        self.assertTrue(self.validate(profile_document())["valid"])

    def test_naming_rejects_each_wrong_surface(self):
        mutations = {
            "path": lambda d: d["paths"].update({"/bad_Path": d["paths"].pop("/items")}),
            "trailing": lambda d: d["paths"].update({"/items/": d["paths"].pop("/items")}),
            "schema": lambda d: d.update({"components": {"schemas": {"bad_name": {"type": "string"}}}}),
            "property": lambda d: d.update({"components": {"schemas": {"Item": {"type": "object", "additionalProperties": False, "properties": {"bad_name": {"type": "string"}}}}}}),
            "query": lambda d: d["paths"]["/items"]["get"].update({"parameters": [{"name": "bad_name", "in": "query", "schema": {"type": "string"}}]}),
            "operation": lambda d: d["paths"]["/items"]["get"].update({"operationId": "List_items"}),
            "missing-operation": lambda d: d["paths"]["/items"]["get"].pop("operationId"),
        }
        for label, mutate in mutations.items():
            with self.subTest(label=label):
                document = profile_document()
                mutate(document)
                with self.assertRaises(ValueError):
                    self.validate(document)

    def test_protocol_header_and_cookie_names_are_exempt(self):
        document = profile_document()
        document["paths"]["/items"]["get"]["parameters"] = [
            {"name": "X-Trace-Id", "in": "header", "schema": {"type": "string"}},
            {"name": "session_cookie", "in": "cookie", "schema": {"type": "string"}},
        ]
        self.assertTrue(self.validate(document)["valid"])

    def test_operation_ids_are_unique(self):
        document = profile_document()
        document["paths"]["/other-items"] = copy.deepcopy(document["paths"]["/items"])
        with self.assertRaisesRegex(ValueError, "Operation ID|operationId"):
            self.validate(document)

    def test_exact_schemas_reject_unknown_objects_untyped_fields_and_arrays(self):
        for schema in ({"type": "object"}, {"type": "object", "additionalProperties": True},
                       {"type": "array"}, {}, {"type": "object", "additionalProperties": False,
                                                "properties": {"value": {}}}):
            with self.subTest(schema=schema):
                document = profile_document()
                document["components"] = {"schemas": {"Item": schema}}
                with self.assertRaises(ValueError):
                    self.validate(document)

    def test_typed_dictionary_is_accepted(self):
        document = profile_document()
        document["components"] = {"schemas": {"Labels": {"type": "object", "additionalProperties": {"type": "string"}}}}
        self.assertTrue(self.validate(document)["valid"])

    def test_error_envelope_rejects_typed_additional_properties(self):
        for location in ("component", "inline", "reference"):
            with self.subTest(location=location):
                document = profile_document()
                schema = error_schema()
                schema["additionalProperties"] = {"type": "string"}
                if location != "inline":
                    document["components"] = {"schemas": {"MissingItem": schema}}
                if location != "component":
                    response_schema = schema if location == "inline" else {
                        "$ref": "#/components/schemas/MissingItem",
                    }
                    document["paths"]["/items"]["get"]["responses"]["404"] = {
                        "description": "Item absent",
                        "content": {"application/json": {"schema": response_schema}},
                    }
                with self.assertRaisesRegex(ValueError, "error envelope must.*closed"):
                    self.validate(document)

    def test_closed_error_envelope_allows_typed_dictionary_only_inside_details(self):
        document = profile_document()
        schema = error_schema()
        schema["properties"]["details"] = {"type": "object", "additionalProperties": {"type": "string"}}
        document["components"] = {"schemas": {"MissingItem": schema}}
        payload = {"statusCode": 404, "error": "Not Found", "errorCode": "item_not_found",
                   "message": "Item absent", "details": {"dynamicKey": "value"}}
        cases = [{"schema": "#/components/schemas/MissingItem", "valid": valid, "value": value}
                 for valid, value in (
                     (True, payload), (False, {**payload, "unexpected": "value"}),
                     (False, {**payload, "details": {"dynamicKey": 42}}),
                 )]
        self.assertTrue(self.validate(document, cases)["valid"])

    def test_anyof_requires_cases_at_root_and_nested_schema_locations(self):
        union = {"anyOf": [{"type": "number"}, {"type": "integer"}]}
        schemas = (
            union,
            {"type": "object", "additionalProperties": False, "properties": {"value": union}},
            {"type": "array", "items": union},
            {"type": "object", "additionalProperties": union},
        )
        for schema in schemas:
            with self.subTest(schema=schema):
                document = profile_document()
                document["components"] = {"schemas": {"Value": schema}}
                with self.assertRaisesRegex(ValueError, "anyOf case coverage"):
                    self.validate(document)

    def test_anyof_overlap_is_valid_for_inline_and_referenced_branches(self):
        for referenced in (False, True):
            with self.subTest(referenced=referenced):
                document = profile_document()
                schemas = {"Number": {"type": "number"}, "Integer": {"type": "integer"}}
                branches = [{"$ref": "#/components/schemas/" + name} if referenced else schema
                            for name, schema in schemas.items()]
                schemas["Value"] = {"anyOf": branches}
                document["components"] = {"schemas": schemas}
                cases = [{"schema": "#/components/schemas/Value", "valid": valid,
                          "value": value, "category": category} for valid, value, category in (
                              (True, 1.5, ""), (True, 1, ""),
                              (False, "wrong", "no-matching-branch"),
                          )]
                self.assertTrue(self.validate(document, cases)["valid"])
                # A non-integer misses the integer branch; one overlapping value
                # may cover both branches, but positive-only evidence is incomplete.
                for incomplete in (cases[::2], cases[:2]):
                    with self.assertRaisesRegex(ValueError, "anyOf case coverage"):
                        self.validate(document, incomplete)

    def test_anyof_nested_cases_target_the_union_itself(self):
        document = profile_document()
        document["components"] = {"schemas": {"Result": {
            "type": "object", "additionalProperties": False, "required": ["value"],
            "properties": {"value": {"anyOf": [{"type": "number"}, {"type": "integer"}]}},
        }}}
        cases = [{"schema": "#/components/schemas/Result/properties/value", "valid": valid,
                  "value": value, "category": category} for valid, value, category in (
                      (True, 1, ""), (False, "wrong", "no-matching-branch"),
                  )]
        self.assertTrue(self.validate(document, cases)["valid"])
        with self.assertRaisesRegex(ValueError, "anyOf case coverage"):
            self.validate(document, [{"schema": "#/components/schemas/Result", "valid": True,
                                      "value": {"value": 1}}])

    def test_anyof_negative_case_must_fail_every_branch(self):
        document = profile_document()
        document["components"] = {"schemas": {"Value": {
            "enum": [1], "anyOf": [{"type": "number"}, {"type": "integer"}],
        }}}
        cases = [{"schema": "#/components/schemas/Value", "valid": valid,
                  "value": value, "category": category} for valid, value, category in (
                      (True, 1, ""), (False, 2, "no-matching-branch"),
                  )]
        with self.assertRaisesRegex(ValueError, "not evidenced"):
            self.validate(document, cases)

    def test_anyof_cannot_skip_evidence_of_the_intended_overlap(self):
        document = profile_document()
        document["components"] = {"schemas": {"Value": {
            "anyOf": [{"type": "integer", "minimum": 0}, {"type": "integer", "maximum": 0}],
        }}}
        cases = [{"schema": "#/components/schemas/Value", "valid": valid,
                  "value": value, "category": category} for valid, value, category in (
                      (True, 1, ""), (True, -1, ""), (False, "wrong", "no-matching-branch"),
                  )]
        with self.assertRaisesRegex(ValueError, "anyOf case coverage.*overlap"):
            self.validate(document, cases)
        cases.append({"schema": "#/components/schemas/Value", "valid": True, "value": 0})
        self.assertTrue(self.validate(document, cases)["valid"])

    def test_anyof_object_branches_do_not_need_exclusive_tags(self):
        document = profile_document()
        document["components"] = {"schemas": {"Value": {"anyOf": [
            {"type": "object", "additionalProperties": False, "required": ["count"],
             "properties": {"count": {"type": "integer", bound: 0}}}
            for bound in ("minimum", "maximum")
        ]}}}
        cases = [{"schema": "#/components/schemas/Value", "valid": valid,
                  "value": value, "category": category} for valid, value, category in (
                      (True, {"count": 0}, ""), (False, {"count": "wrong"}, "no-matching-branch"),
                  )]
        self.assertTrue(self.validate(document, cases)["valid"])

    def test_combined_oneof_anyof_cannot_silently_skip_one_union(self):
        document = union_document()
        document["components"]["schemas"]["Result"]["anyOf"] = [
            {"$ref": "#/components/schemas/Ready"}, {"$ref": "#/components/schemas/Failed"},
        ]
        with self.assertRaisesRegex(ValueError, "Verification gap: combined oneOf/anyOf"):
            self.validate(document, union_cases())

    def test_cli_anyof_requires_sidecar_and_accepts_complete_cases(self):
        with tempfile.TemporaryDirectory() as folder:
            stage, sidecar = Path(folder) / "stage.json", Path(folder) / "cases.json"
            document = profile_document()
            document["paths"]["/items"]["get"]["responses"]["200"]["content"] = {
                "application/json": {"schema": {"anyOf": [{"type": "number"}, {"type": "integer"}]}},
            }
            stage.write_text(json.dumps(document), encoding="utf-8")
            command = [sys.executable, str(SCRIPT), "--profile", "solidstats", str(stage)]
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 1)
            self.assertFalse(json.loads(completed.stdout)["valid"])
            self.assertIn("anyOf case coverage", completed.stderr)
            cases = [{"file": "stage.json", "schema": "#/paths/~1items/get/responses/200/content/application~1json/schema",
                      "valid": valid, "value": value, "category": category}
                     for valid, value, category in ((True, 1, ""), (False, "wrong", "no-matching-branch"))]
            sidecar.write_text(json.dumps({"cases": cases}), encoding="utf-8")
            completed = subprocess.run([*command, "--cases", str(sidecar)], capture_output=True,
                                       text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertTrue(json.loads(completed.stdout)["valid"])

    def test_union_positive_and_negative_cases(self):
        report = self.validate(union_document(), union_cases())
        self.assertEqual(len(report["cases"]), 7)

    def test_changed_template_passes_strict_profile_and_cases(self):
        sidecar = ROOT / "templates" / "openapi-skeleton.cases.json"
        cases = MODULE.load_cases(sidecar)
        report = MODULE.validate_file(ROOT / "templates" / "openapi-skeleton.yaml",
                                      YAML, VALIDATOR, profile=True, cases=cases)
        self.assertEqual(len(report["cases"]), 7)

    def test_http_labels_accept_stable_aliases_but_not_another_status(self):
        for label, valid in (("Unprocessable Entity", True), ("Unprocessable Content", True), ("Not Found", False)):
            with self.subTest(label=label):
                document = profile_document()
                schema = error_schema("invalid_input", 422)
                schema["properties"]["error"]["enum"] = [label]
                document["components"] = {"schemas": {"InvalidInput": schema}}
                if valid:
                    self.assertTrue(self.validate(document)["valid"])
                else:
                    with self.assertRaisesRegex(ValueError, "HTTP status label"):
                        self.validate(document)

    def test_collision_keeps_properties_named_description_and_ref_equivalence(self):
        document = profile_document()
        schema = error_schema()
        schema["properties"]["details"]["properties"]["description"] = {"type": "string"}
        document["components"] = {"schemas": {"MissingItem": schema}}
        registry = {}
        self.validate(document, registry=registry)
        referenced = copy.deepcopy(document)
        referenced["components"]["schemas"]["Details"] = schema["properties"]["details"]
        referenced["components"]["schemas"]["MissingItem"]["properties"]["details"] = {"$ref": "#/components/schemas/Details"}
        self.assertTrue(self.validate(referenced, registry=registry)["valid"])
        referenced["components"]["schemas"]["MissingItem"]["properties"]["details"] = {
            "allOf": [{"$ref": "#/components/schemas/Details"}], "description": "Local annotation",
        }
        self.assertTrue(self.validate(referenced, registry=registry)["valid"])
        document["components"]["schemas"]["MissingItem"]["properties"]["details"]["properties"]["description"] = {"type": "integer"}
        with self.assertRaisesRegex(ValueError, "collision"):
            self.validate(document, registry=registry)

    def test_nullable_field_case_cannot_claim_a_forbidden_null(self):
        cases = union_cases()
        cases[5]["value"] = {"status": "ready", "count": 2, "note": None, "extra": 1}
        with self.assertRaisesRegex(ValueError, "not evidenced"):
            self.validate(union_document(), cases)

    def test_component_map_names_do_not_become_schema_keywords(self):
        document = profile_document()
        document["components"] = {"responses": {"schema": {
            "description": "Synthetic response", "content": {"application/json": {"schema": {"type": "string"}}},
        }}}
        self.assertTrue(self.validate(document)["valid"])

    def test_tag_only_union_wrong_primitive_tag_is_a_type_case(self):
        document = union_document()
        for name in ("Ready", "Failed"):
            shape = document["components"]["schemas"][name]
            shape["properties"] = {"status": shape["properties"]["status"]}
            shape["required"] = ["status"]
        cases = [{"schema": "#/components/schemas/Result", "valid": valid,
                  "value": value, "category": category} for valid, value, category in (
                      (True, {"status": "ready"}, ""), (True, {"status": "failed"}, ""),
                      (False, {}, "missing-discriminator"), (False, {"status": "unknown"}, "unknown-discriminator"),
                      (False, {"status": 4}, "invalid-field-type"),
                  )]
        self.assertTrue(self.validate(document, cases)["valid"])

    def test_cli_collision_registry_spans_files_and_operation_ids(self):
        with tempfile.TemporaryDirectory() as folder:
            paths = [Path(folder) / name for name in ("first.json", "second.json")]
            documents = [profile_document(), profile_document()]
            for index, document in enumerate(documents):
                document["paths"]["/items"]["get"]["operationId"] = f"listItems{index}"
                document["components"] = {"schemas": {"MissingItem": error_schema()}}
                paths[index].write_text(json.dumps(document), encoding="utf-8")
            command = [sys.executable, str(SCRIPT), "--profile", "solidstats", *(str(path) for path in paths)]
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            documents[1]["components"]["schemas"]["MissingItem"]["properties"]["details"]["properties"]["itemId"]["maxLength"] = 12
            paths[1].write_text(json.dumps(documents[1]), encoding="utf-8")
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 1)
            self.assertIn("collision", completed.stderr)
            documents[1]["components"]["schemas"]["MissingItem"] = error_schema()
            documents[1]["paths"]["/items"]["get"]["operationId"] = "listItems0"
            paths[1].write_text(json.dumps(documents[1]), encoding="utf-8")
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 1)
            self.assertIn("operationId", completed.stderr)

    def test_default_json_error_status_is_verification_gap(self):
        document = profile_document()
        document["paths"]["/items"]["get"]["responses"]["default"] = {
            "description": "Fallback", "content": {"application/json": {"schema": error_schema()}},
        }
        with self.assertRaisesRegex(ValueError, "Verification gap"):
            self.validate(document)

    def test_all_required_error_fields_are_nonnullable(self):
        for name in ("statusCode", "error", "errorCode", "message"):
            with self.subTest(name=name):
                document = profile_document()
                schema = error_schema()
                schema["properties"][name]["nullable"] = True
                document["components"] = {"schemas": {"MissingItem": schema}}
                with self.assertRaises(ValueError):
                    self.validate(document)

    def test_recursive_error_details_are_explicit_verification_gap(self):
        document = profile_document()
        error = error_schema()
        error["properties"]["details"] = {"$ref": "#/components/schemas/Details"}
        document["components"] = {"schemas": {"MissingItem": error, "Details": {
            "type": "object", "additionalProperties": False,
            "properties": {"child": {"$ref": "#/components/schemas/Details"}},
        }}}
        with self.assertRaisesRegex(ValueError, "Verification gap: recursive error"):
            self.validate(document)

    def test_negative_categories_require_the_claimed_schema_defect(self):
        mutations = {
            "missing-discriminator": {"status": "ready", "count": "bad"},
            "unknown-discriminator": {"status": "ready", "count": "bad"},
            "invalid-field-type": {"count": 2},
            "mixed-variant-fields": {"status": "ready", "count": "bad"},
            "forbidden-null": {"status": "ready", "count": "bad"},
        }
        for category, payload in mutations.items():
            with self.subTest(category=category):
                cases = union_cases()
                next(case for case in cases if case["category"] == category)["value"] = payload
                with self.assertRaisesRegex(ValueError, "not evidenced"):
                    self.validate(union_document(), cases)

    def test_protocol_owned_names_need_manual_exception_verification(self):
        for surface in ("query", "property"):
            with self.subTest(surface=surface):
                document = profile_document()
                if surface == "query":
                    document["paths"]["/items"]["get"]["parameters"] = [{
                        "name": "openid.mode", "in": "query", "schema": {"type": "string"},
                    }]
                else:
                    document["components"] = {"schemas": {"ProtocolPayload": {
                        "type": "object", "additionalProperties": False,
                        "properties": {"openid.mode": {"type": "string"}},
                    }}}
                with self.assertRaisesRegex(ValueError, "Verification gap.*protocol"):
                    self.validate(document)

    def test_untyped_allof_constraint_member_is_conservative_gap(self):
        document = profile_document()
        document["components"] = {"schemas": {"Title": {
            "allOf": [{"type": "string"}, {"maxLength": 12}],
        }}}
        with self.assertRaisesRegex(ValueError, "Verification gap: untyped allOf"):
            self.validate(document)

    def test_closed_empty_allof_constraint_is_not_flattened_to_false_contract(self):
        document = profile_document()
        document["components"] = {"schemas": {"MissingItem": {
            "allOf": [error_schema(), {"type": "object", "additionalProperties": False}],
        }}}
        with self.assertRaisesRegex(ValueError, "Verification gap: closed allOf"):
            self.validate(document)

    def test_union_requires_cases_and_each_branch(self):
        for cases in ([], union_cases()[1:], union_cases()[:-1]):
            with self.subTest(count=len(cases)), self.assertRaisesRegex(ValueError, "coverage"):
                self.validate(union_document(), cases)

    def test_oneof_overlap_missing_tag_nullable_tag_and_wrong_mapping_rejected(self):
        for mutation in ("overlap", "optional", "nullable", "mapping", "inline"):
            with self.subTest(mutation=mutation):
                document = union_document()
                schemas = document["components"]["schemas"]
                if mutation == "overlap":
                    schemas["Failed"]["properties"]["status"]["enum"] = ["ready"]
                elif mutation == "optional":
                    schemas["Ready"]["required"].remove("status")
                elif mutation == "nullable":
                    schemas["Ready"]["properties"]["status"]["nullable"] = True
                elif mutation == "mapping":
                    schemas["Result"]["discriminator"]["mapping"]["ready"] = "#/components/schemas/Failed"
                else:
                    schemas["Result"]["oneOf"][0] = copy.deepcopy(schemas["Ready"])
                with self.assertRaises(ValueError):
                    self.validate(document, union_cases())

    def test_payload_validation_counts_all_branches_even_with_discriminator(self):
        document = union_document()
        document["components"]["schemas"]["Failed"] = copy.deepcopy(document["components"]["schemas"]["Ready"])
        case = {"schema": "#/components/schemas/Result", "valid": False,
                "value": {"status": "ready", "count": 2}}
        results = MODULE.check_cases(document, [case], {}, MODULE.load_payload_validator())
        self.assertFalse(results[0]["actualValid"])

    def test_negative_category_cannot_claim_unrelated_invalid_payload(self):
        cases = union_cases()
        cases[2]["value"] = {"status": "ready", "count": "wrong"}
        with self.assertRaisesRegex(ValueError, "not evidenced"):
            self.validate(union_document(), cases)

    def test_optional_is_not_nullable_and_nullable_is_not_optional(self):
        document = profile_document()
        document["components"] = {"schemas": {"Update": {
            "type": "object", "additionalProperties": False, "required": ["caption"],
            "properties": {"title": {"type": "string"}, "caption": {"type": "string", "nullable": True}},
        }}}
        cases = [{"schema": "#/components/schemas/Update", "valid": valid, "value": value}
                 for valid, value in ((True, {"caption": None}), (True, {"caption": "text", "title": "name"}),
                                      (False, {"caption": "text", "title": None}), (False, {}))]
        self.assertTrue(self.validate(document, cases)["valid"])

    def test_same_error_code_same_contract_reuse_allowed(self):
        registry = {}
        for index in range(2):
            document = profile_document()
            schema = error_schema()
            schema["description"] = f"Same condition, wording revision {index}"
            document["components"] = {"schemas": {f"MissingItem{index}": schema}}
            self.assertTrue(self.validate(document, registry=registry)["valid"])
        self.assertEqual(set(registry), {"item_not_found"})

    def test_error_code_different_details_collides_across_input_scope(self):
        registry = {}
        document = profile_document()
        document["components"] = {"schemas": {"MissingItem": error_schema()}}
        self.validate(document, registry=registry)
        document["components"]["schemas"]["MissingItem"]["properties"]["details"]["properties"]["itemId"] = {"type": "integer"}
        with self.assertRaisesRegex(ValueError, "collision"):
            self.validate(document, registry=registry)

    def test_error_envelope_code_status_label_and_details_are_precise(self):
        for mutation in ("missing", "code", "status", "label", "details", "null"):
            with self.subTest(mutation=mutation):
                document = profile_document()
                schema = error_schema()
                if mutation == "missing":
                    schema["required"].remove("errorCode")
                elif mutation == "code":
                    schema["properties"]["errorCode"]["enum"] = ["ItemNotFound"]
                elif mutation == "status":
                    schema["properties"]["statusCode"]["enum"] = [400]
                elif mutation == "label":
                    schema["properties"]["error"]["enum"] = ["item_not_found"]
                elif mutation == "details":
                    schema["properties"]["details"] = {"type": "object", "additionalProperties": True}
                else:
                    schema["properties"]["errorCode"]["nullable"] = True
                document["components"] = {"schemas": {"MissingItem": schema}}
                document["paths"]["/items"]["get"]["responses"]["404"] = {
                    "description": "Item absent", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/MissingItem"}}},
                }
                with self.assertRaises(ValueError):
                    self.validate(document)

    def test_redirect_json_is_not_treated_as_error(self):
        document = profile_document()
        document["paths"]["/items"]["get"]["responses"]["302"] = {
            "description": "Redirect", "content": {"application/json": {"schema": {"type": "string"}}},
        }
        self.assertTrue(self.validate(document)["valid"])

    def test_simple_reference_allof_supported_unsupported_intersection_is_gap(self):
        document = profile_document()
        document["components"] = {"schemas": {"Base": error_schema(), "MissingItem": {
            "allOf": [{"$ref": "#/components/schemas/Base"}], "description": "Annotation wrapper",
        }}}
        self.assertTrue(self.validate(document)["valid"])
        document["components"]["schemas"]["MissingItem"]["allOf"].append({
            "type": "object", "properties": {"other": {"type": "string"}},
        })
        with self.assertRaisesRegex(ValueError, "Verification gap"):
            self.validate(document)

    def test_case_schema_must_point_to_a_real_schema_not_examples(self):
        document = profile_document()
        document["x-payload"] = {"type": "string"}
        with self.assertRaisesRegex(ValueError, "Schema Object"):
            self.validate(document, [{"schema": "#/x-payload", "valid": True, "value": "x"}])

    def test_cli_profile_case_hash_and_input_scope(self):
        with tempfile.TemporaryDirectory() as folder:
            stage, sidecar = Path(folder) / "stage.json", Path(folder) / "cases.json"
            stage.write_text(json.dumps(union_document()), encoding="utf-8")
            cases = [{**case, "file": "stage.json"} for case in union_cases()]
            sidecar.write_text(json.dumps({"cases": cases}), encoding="utf-8")
            command = [sys.executable, str(SCRIPT), "--profile", "solidstats", "--cases", str(sidecar), str(stage)]
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            report = json.loads(completed.stdout)
            self.assertEqual(len(report["caseSidecar"]["sha256"]), 64)
            self.assertEqual(len(report["files"][0]["cases"]), 7)
            cases[0]["file"] = "outside.json"
            sidecar.write_text(json.dumps({"cases": cases}), encoding="utf-8")
            completed = subprocess.run(command, capture_output=True, text=True, check=False, timeout=30)
            self.assertEqual(completed.returncode, 1)
            self.assertIn("outside", completed.stderr)

    def test_cases_json_duplicate_keys_and_nonfinite_values_fail(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "cases.json"
            for text in ('{"cases":[],"cases":[]}', '{"cases":[{"value":NaN}]}'):
                with self.subTest(text=text):
                    path.write_text(text, encoding="utf-8")
                    with self.assertRaises(ValueError):
                        MODULE.load_cases(path)


if __name__ == "__main__":
    unittest.main()

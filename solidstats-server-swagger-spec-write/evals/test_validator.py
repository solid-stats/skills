"""Behavioral checks for the read-only specification validator."""

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

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


class ValidatorTests(unittest.TestCase):
    def validate(self, document):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "spec.yaml"
            path.write_text(json.dumps(document), encoding="utf-8")
            return MODULE.validate_file(path, YAML, VALIDATOR)

    def test_checked_template_and_exact_digest(self):
        result = MODULE.validate_file(
            ROOT / "templates" / "openapi-skeleton.yaml", YAML, VALIDATOR
        )
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["sha256"]), 64)

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


if __name__ == "__main__":
    unittest.main()

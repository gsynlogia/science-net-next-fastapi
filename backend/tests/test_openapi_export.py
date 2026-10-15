"""Test kontraktu API: zapisany w repozytorium schemat OpenAPI musi odpowiadać aplikacji."""

import json

from app.export_openapi import OUTPUT_PATH, build_schema_text


def test_committed_schema_matches_application() -> None:
    committed = OUTPUT_PATH.read_text(encoding="utf-8")
    assert committed == build_schema_text(), "Uruchom: uv run python -m app.export_openapi"


def test_schema_describes_main_endpoints() -> None:
    schema = json.loads(build_schema_text())
    paths = schema["paths"]
    assert "/api/articles" in paths
    assert "/api/articles/{article_id}/summary" in paths
    assert "/api/auth/login" in paths
    assert schema["info"]["title"] == "Science Net API"

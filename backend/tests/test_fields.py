"""Test endpointu słownika dziedzin."""

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.common import FieldSlug

client = TestClient(app)


def test_fields_lists_every_field_with_polish_name() -> None:
    response = client.get("/api/fields")
    assert response.status_code == 200
    body = response.json()
    assert [item["slug"] for item in body] == [slug.value for slug in FieldSlug]
    assert {"slug": "computer_science", "name": "Informatyka"} in body

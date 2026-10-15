"""Testy endpointu /api/health i dokumentacji."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_schema_lists_health_route() -> None:
    schema = client.get("/api/openapi.json").json()
    assert "/api/health" in schema["paths"]

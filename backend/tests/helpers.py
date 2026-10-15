"""Pomocnicze funkcje testów API: zakładanie kont i nagłówki autoryzacji."""

from fastapi import status
from fastapi.testclient import TestClient

EMAIL = "ada@example.com"
PASSWORD = "Haslo12345!"
REGISTRATION = {"full_name": "Ada Lovelace", "email": EMAIL, "password": PASSWORD}


def register(client: TestClient, **changes: str) -> dict[str, str]:
    """Rejestruje konto (dane można zmienić argumentami) i zwraca nagłówek `Authorization`."""
    response = client.post("/api/auth/register", json={**REGISTRATION, **changes})
    assert response.status_code == status.HTTP_201_CREATED
    return {"Authorization": f"Bearer {response.json()['access_token']}"}

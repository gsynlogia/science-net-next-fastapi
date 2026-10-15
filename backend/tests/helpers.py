"""Pomocnicze funkcje testów API: zakładanie kont i publikowanie artykułów."""

from typing import Any

from fastapi import status
from fastapi.testclient import TestClient

EMAIL = "ada@example.com"
PASSWORD = "Haslo12345!"
REGISTRATION = {"full_name": "Ada Lovelace", "email": EMAIL, "password": PASSWORD}
ARTICLE = {
    "title": "Sieci neuronowe w medycynie",
    "abstract": "Przegląd zastosowań sieci neuronowych w diagnostyce obrazowej.",
    "field": "medicine",
    "tags": ["AI", " Medycyna "],
    "full_text_url": "https://example.com/artykul.pdf",
}


def register(client: TestClient, **changes: str) -> dict[str, str]:
    """Rejestruje konto (dane można zmienić argumentami) i zwraca nagłówek `Authorization`."""
    response = client.post("/api/auth/register", json={**REGISTRATION, **changes})
    assert response.status_code == status.HTTP_201_CREATED
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def publish(client: TestClient, headers: dict[str, str], **changes: Any) -> dict[str, Any]:
    """Publikuje artykuł (dane można zmienić argumentami) i zwraca jego JSON."""
    response = client.post("/api/articles", json={**ARTICLE, **changes}, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    article: dict[str, Any] = response.json()
    return article

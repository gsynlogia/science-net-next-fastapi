"""Testy API artykułów: publikacja, walidacja, lista z kursorem i filtry (na prawdziwej bazie)."""

from typing import Any

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from tests.helpers import ARTICLE, publish, register

PAGE_SIZE = 2


def test_publishing_requires_login(client: TestClient) -> None:
    response = client.post("/api/articles", json=ARTICLE)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_publish_returns_created_article_with_normalized_tags(client: TestClient) -> None:
    article = publish(client, register(client))
    assert article["author"]["full_name"] == "Ada Lovelace"
    assert article["tags"] == ["ai", "medycyna"]
    assert article["field"] == "medicine"
    assert (article["reactions_count"], article["comments_count"], article["reacted_by_me"]) == (
        0,
        0,
        False,
    )


@pytest.mark.parametrize(
    "changes",
    [
        {"title": "abc"},
        {"abstract": "za krótkie"},
        {"tags": ["a", "b", "c", "d", "e", "f"]},
        {"full_text_url": "ftp://example.com/plik"},
        {"field": "astrology"},
    ],
    ids=["short-title", "short-abstract", "too-many-tags", "bad-url", "unknown-field"],
)
def test_publish_validates_input(client: TestClient, changes: dict[str, Any]) -> None:
    response = client.post("/api/articles", json={**ARTICLE, **changes}, headers=register(client))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_list_is_public_and_walks_pages_with_cursor(client: TestClient) -> None:
    headers = register(client)
    published = [
        publish(client, headers, title=f"Artykuł numer {number}")["id"] for number in range(5)
    ]
    seen: list[list[int]] = []
    cursor: str | None = None
    while True:
        params: dict[str, str | int] = {"limit": PAGE_SIZE}
        if cursor:
            params["cursor"] = cursor
        body = client.get("/api/articles", params=params).json()
        seen.append([item["id"] for item in body["items"]])
        cursor = body["next_cursor"]
        if cursor is None:
            break
    assert [len(ids) for ids in seen] == [2, 2, 1]
    assert [i for ids in seen for i in ids] == sorted(published, reverse=True)


def test_list_filters_by_field_query_and_author(client: TestClient) -> None:
    ada, bob = register(client), register(client, email="bob@example.com", full_name="Bob Nowak")
    medicine = publish(client, ada)
    physics = publish(client, bob, title="Kwantowa teoria pola", field="physics", tags=["qft"])
    by_field = client.get("/api/articles", params={"field": "physics"}).json()
    by_query = client.get("/api/articles", params={"q": "QFT"}).json()
    by_author = client.get("/api/articles", params={"author_id": medicine["author"]["id"]}).json()
    assert [item["id"] for item in by_field["items"]] == [physics["id"]]
    assert [item["id"] for item in by_query["items"]] == [physics["id"]]
    assert [item["id"] for item in by_author["items"]] == [medicine["id"]]


@pytest.mark.parametrize(
    "params",
    [{"cursor": "0"}, {"cursor": "abc"}, {"limit": "0"}, {"limit": "51"}, {"field": "astrology"}],
)
def test_list_rejects_bad_parameters(client: TestClient, params: dict[str, str]) -> None:
    response = client.get("/api/articles", params=params)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_read_article_returns_it_or_404(client: TestClient) -> None:
    article = publish(client, register(client))
    found = client.get(f"/api/articles/{article['id']}")
    missing = client.get("/api/articles/999999")
    assert found.json() == article
    assert missing.status_code == status.HTTP_404_NOT_FOUND

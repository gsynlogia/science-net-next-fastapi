"""Testy API komentarzy."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.schemas.comment import COMMENT_MAX_LENGTH
from tests.helpers import publish, register

MISSING_ARTICLE_URL = "/api/articles/999999/comments"


def test_adding_comment_requires_login(client: TestClient) -> None:
    article = publish(client, register(client))
    response = client.post(f"/api/articles/{article['id']}/comments", json={"body": "Hej"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_comment_is_created_listed_and_counted(client: TestClient) -> None:
    ada = register(client)
    article = publish(client, ada)
    url = f"/api/articles/{article['id']}/comments"
    created = client.post(url, json={"body": "  Ciekawa praca!  "}, headers=ada)
    listed = client.get(url).json()
    counted = client.get(f"/api/articles/{article['id']}").json()
    assert created.status_code == status.HTTP_201_CREATED
    assert created.json()["body"] == "Ciekawa praca!"
    assert [item["author"]["full_name"] for item in listed["items"]] == ["Ada Lovelace"]
    assert counted["comments_count"] == 1


@pytest.mark.parametrize(
    "body", ["", "   ", "x" * (COMMENT_MAX_LENGTH + 1)], ids=["empty", "blank", "too-long"]
)
def test_comment_validates_body(client: TestClient, body: str) -> None:
    ada = register(client)
    article = publish(client, ada)
    response = client.post(
        f"/api/articles/{article['id']}/comments", json={"body": body}, headers=ada
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_comments_are_paged_oldest_first(client: TestClient) -> None:
    ada = register(client)
    article = publish(client, ada)
    url = f"/api/articles/{article['id']}/comments"
    for number in range(3):
        client.post(url, json={"body": f"Komentarz {number}"}, headers=ada)
    first = client.get(url, params={"limit": 2}).json()
    second = client.get(url, params={"limit": 2, "cursor": first["next_cursor"]}).json()
    assert [item["body"] for item in first["items"]] == ["Komentarz 0", "Komentarz 1"]
    assert [item["body"] for item in second["items"]] == ["Komentarz 2"]
    assert second["next_cursor"] is None


def test_comments_of_missing_article_are_404(client: TestClient) -> None:
    headers = register(client)
    listed = client.get(MISSING_ARTICLE_URL)
    created = client.post(MISSING_ARTICLE_URL, json={"body": "Hej"}, headers=headers)
    assert listed.status_code == created.status_code == status.HTTP_404_NOT_FOUND

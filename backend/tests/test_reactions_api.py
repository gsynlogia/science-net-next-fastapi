"""Testy API reakcji „Przydatne”."""

from fastapi import status
from fastapi.testclient import TestClient

from tests.helpers import publish, register

MISSING_ARTICLE_URL = "/api/articles/999999/reaction"


def test_reaction_requires_login(client: TestClient) -> None:
    article = publish(client, register(client))
    url = f"/api/articles/{article['id']}/reaction"
    assert client.put(url).status_code == status.HTTP_401_UNAUTHORIZED
    assert client.delete(url).status_code == status.HTTP_401_UNAUTHORIZED


def test_adding_reaction_is_idempotent_and_visible_to_the_reactor_only(client: TestClient) -> None:
    ada = register(client)
    article = publish(client, ada)
    url = f"/api/articles/{article['id']}/reaction"
    first = client.put(url, headers=ada).json()
    again = client.put(url, headers=ada).json()
    guest_view = client.get(f"/api/articles/{article['id']}").json()
    assert (first["reactions_count"], first["reacted_by_me"]) == (1, True)
    assert (again["reactions_count"], again["reacted_by_me"]) == (1, True)
    assert (guest_view["reactions_count"], guest_view["reacted_by_me"]) == (1, False)


def test_reactions_of_different_users_add_up_and_can_be_withdrawn(client: TestClient) -> None:
    ada = register(client)
    bob = register(client, email="bob@example.com", full_name="Bob Nowak")
    article = publish(client, ada)
    url = f"/api/articles/{article['id']}/reaction"
    client.put(url, headers=ada)
    client.put(url, headers=bob)
    after_withdrawal = client.delete(url, headers=ada).json()
    withdrawn_again = client.delete(url, headers=ada).json()
    assert (after_withdrawal["reactions_count"], after_withdrawal["reacted_by_me"]) == (1, False)
    assert withdrawn_again["reactions_count"] == 1


def test_reaction_on_missing_article_is_404(client: TestClient) -> None:
    headers = register(client)
    assert client.put(MISSING_ARTICLE_URL, headers=headers).status_code == status.HTTP_404_NOT_FOUND
    assert (
        client.delete(MISSING_ARTICLE_URL, headers=headers).status_code == status.HTTP_404_NOT_FOUND
    )

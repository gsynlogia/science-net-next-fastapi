"""Testy API profili i obserwowania naukowców."""

from fastapi import status
from fastapi.testclient import TestClient

from tests.helpers import register

MISSING_USER_URL = "/api/users/999999"


def user_id(client: TestClient, headers: dict[str, str]) -> int:
    """Zwraca `id` właściciela tokenu z nagłówka."""
    return int(client.get("/api/users/me", headers=headers).json()["id"])


def test_profile_is_public(client: TestClient) -> None:
    ada = register(client)
    profile = client.get(f"/api/users/{user_id(client, ada)}").json()
    assert (profile["full_name"], profile["followers_count"], profile["followed_by_me"]) == (
        "Ada Lovelace",
        0,
        False,
    )
    assert "email" not in profile


def test_missing_profile_is_404(client: TestClient) -> None:
    assert client.get(MISSING_USER_URL).status_code == status.HTTP_404_NOT_FOUND


def test_follow_requires_login(client: TestClient) -> None:
    ada = register(client)
    url = f"/api/users/{user_id(client, ada)}/follow"
    assert client.put(url).status_code == status.HTTP_401_UNAUTHORIZED
    assert client.delete(url).status_code == status.HTTP_401_UNAUTHORIZED


def test_follow_is_idempotent_and_can_be_withdrawn(client: TestClient) -> None:
    ada = register(client)
    bob = register(client, email="bob@example.com", full_name="Bob Nowak")
    url = f"/api/users/{user_id(client, ada)}/follow"
    followed = client.put(url, headers=bob).json()
    again = client.put(url, headers=bob).json()
    as_guest = client.get(f"/api/users/{user_id(client, ada)}").json()
    unfollowed = client.delete(url, headers=bob).json()
    assert (followed["followers_count"], followed["followed_by_me"]) == (1, True)
    assert (again["followers_count"], again["followed_by_me"]) == (1, True)
    assert (as_guest["followers_count"], as_guest["followed_by_me"]) == (1, False)
    assert (unfollowed["followers_count"], unfollowed["followed_by_me"]) == (0, False)


def test_user_cannot_follow_self(client: TestClient) -> None:
    ada = register(client)
    response = client.put(f"/api/users/{user_id(client, ada)}/follow", headers=ada)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_following_missing_user_is_404(client: TestClient) -> None:
    ada = register(client)
    response = client.put(f"{MISSING_USER_URL}/follow", headers=ada)
    assert response.status_code == status.HTTP_404_NOT_FOUND

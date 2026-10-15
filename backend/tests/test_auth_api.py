"""Testy API rejestracji, logowania i zalogowanego użytkownika (na prawdziwej bazie)."""

from fastapi import status
from fastapi.testclient import TestClient

from app.security import create_access_token
from tests.helpers import EMAIL, PASSWORD, REGISTRATION, register

MISSING_USER_ID = 999_999


def test_register_returns_token_that_opens_profile(client: TestClient) -> None:
    headers = register(client)
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert (body["email"], body["full_name"], body["followers_count"]) == (EMAIL, "Ada Lovelace", 0)
    assert "password" not in body and "password_hash" not in body


def test_register_rejects_duplicate_email_in_any_letter_case(client: TestClient) -> None:
    register(client)
    response = client.post("/api/auth/register", json={**REGISTRATION, "email": "ADA@Example.com"})
    assert response.status_code == status.HTTP_409_CONFLICT


def test_register_validates_input(client: TestClient) -> None:
    short_password = client.post("/api/auth/register", json={**REGISTRATION, "password": "krotkie"})
    bad_email = client.post("/api/auth/register", json={**REGISTRATION, "email": "to-nie-email"})
    assert short_password.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert bad_email.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_login_accepts_right_password_in_any_email_case(client: TestClient) -> None:
    register(client)
    response = client.post(
        "/api/auth/login", json={"email": "Ada@Example.com", "password": PASSWORD}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["token_type"] == "bearer"


def test_login_gives_same_error_for_wrong_password_and_unknown_email(client: TestClient) -> None:
    register(client)
    wrong_password = client.post(
        "/api/auth/login", json={"email": EMAIL, "password": "zle-haslo-1"}
    )
    unknown_email = client.post(
        "/api/auth/login", json={"email": "nikt@example.com", "password": PASSWORD}
    )
    assert wrong_password.status_code == unknown_email.status_code == status.HTTP_401_UNAUTHORIZED
    assert wrong_password.json() == unknown_email.json()


def test_profile_requires_valid_token(client: TestClient) -> None:
    anonymous = client.get("/api/users/me")
    garbage = client.get("/api/users/me", headers={"Authorization": "Bearer nie-token"})
    assert anonymous.status_code == status.HTTP_401_UNAUTHORIZED
    assert garbage.status_code == status.HTTP_401_UNAUTHORIZED
    assert anonymous.headers["WWW-Authenticate"] == "Bearer"


def test_token_of_missing_account_is_rejected(client: TestClient) -> None:
    token = create_access_token(MISSING_USER_ID)
    response = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

"""Testy haszowania haseł i tokenów JWT (bez bazy danych)."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from jwt import InvalidTokenError

from app.config import get_settings
from app.security import (
    JWT_ALGORITHM,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

PASSWORD = "Haslo12345!"
USER_ID = 7
LONG_AGO = timedelta(hours=2)


def test_hash_is_not_the_password_and_is_salted() -> None:
    first, second = hash_password(PASSWORD), hash_password(PASSWORD)
    assert PASSWORD not in first
    assert first != second


def test_verify_password_accepts_only_the_right_password() -> None:
    password_hash = hash_password(PASSWORD)
    assert verify_password(PASSWORD, password_hash) is True
    assert verify_password("inne-haslo", password_hash) is False
    assert verify_password(PASSWORD, "to-nie-jest-hash") is False


def test_token_round_trip_returns_user_id() -> None:
    assert decode_access_token(create_access_token(USER_ID)) == USER_ID


def test_expired_token_is_rejected() -> None:
    token = create_access_token(USER_ID, now=datetime.now(UTC) - LONG_AGO)
    with pytest.raises(InvalidTokenError):
        decode_access_token(token)


def test_token_signed_with_other_secret_is_rejected() -> None:
    forged = jwt.encode({"sub": str(USER_ID)}, "inny-sekret-" * 4, algorithm=JWT_ALGORITHM)
    with pytest.raises(InvalidTokenError):
        decode_access_token(forged)


def test_token_without_expiry_is_rejected() -> None:
    secret = get_settings().jwt_secret
    token = jwt.encode({"sub": str(USER_ID)}, secret, algorithm=JWT_ALGORITHM)
    with pytest.raises(InvalidTokenError):
        decode_access_token(token)


def test_token_with_non_numeric_subject_is_rejected() -> None:
    token = create_access_token(USER_ID)
    claims = jwt.decode(token, options={"verify_signature": False})
    claims["sub"] = "ada"
    forged = jwt.encode(claims, get_settings().jwt_secret, algorithm=JWT_ALGORITHM)
    with pytest.raises(InvalidTokenError):
        decode_access_token(forged)

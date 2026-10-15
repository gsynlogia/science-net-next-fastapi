"""Bezpieczeństwo: haszowanie haseł (argon2) i tokeny dostępu JWT."""

from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from jwt import InvalidTokenError

from app.config import get_settings

JWT_ALGORITHM = "HS256"
REQUIRED_CLAIMS = ["exp", "sub"]
password_hasher = PasswordHasher()
DUMMY_PASSWORD_HASH = password_hasher.hash("konto-ktorego-nie-ma")


def hash_password(password: str) -> str:
    """Zwraca hash argon2 hasła (zawiera algorytm, parametry i sól)."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Zwraca `True`, gdy hasło pasuje do hasha."""
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(user_id: int, now: datetime | None = None) -> str:
    """Tworzy podpisany token JWT ważny `jwt_expire_minutes` minut."""
    settings = get_settings()
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + timedelta(minutes=settings.jwt_expire_minutes)
    claims = {"sub": str(user_id), "iat": issued_at, "exp": expires_at}
    return jwt.encode(claims, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int:
    """Zwraca `id` użytkownika albo zgłasza `InvalidTokenError`."""
    claims = jwt.decode(
        token,
        get_settings().jwt_secret,
        algorithms=[JWT_ALGORITHM],
        options={"require": REQUIRED_CLAIMS},
    )
    try:
        return int(claims["sub"])
    except ValueError as error:
        raise InvalidTokenError("Nieprawidłowy właściciel tokenu.") from error

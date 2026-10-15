"""Endpointy rejestracji i logowania."""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import SessionDep
from app.repositories.users import EmailAlreadyRegisteredError, UserRepository
from app.schemas.auth import AuthSession, LoginInput, RegisterInput
from app.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    hash_password,
    verify_password,
)

EMAIL_TAKEN_MESSAGE = "Konto z tym adresem e-mail już istnieje."
INVALID_CREDENTIALS_MESSAGE = "Nieprawidłowy e-mail lub hasło."

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthSession,
    status_code=status.HTTP_201_CREATED,
    summary="Rejestracja konta",
)
def register(data: RegisterInput, session: SessionDep) -> AuthSession:
    """Zakłada konto i od razu loguje (zwraca token)."""
    try:
        user = UserRepository(session).create(
            email=data.email, password_hash=hash_password(data.password), full_name=data.full_name
        )
    except EmailAlreadyRegisteredError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, EMAIL_TAKEN_MESSAGE) from error
    return AuthSession(access_token=create_access_token(user.id))


@router.post("/login", response_model=AuthSession, summary="Logowanie")
def login(data: LoginInput, session: SessionDep) -> AuthSession:
    """Sprawdza e-mail i hasło; zwraca token albo 401."""
    user = UserRepository(session).get_by_email(data.email)
    password_hash = user.password_hash if user else DUMMY_PASSWORD_HASH
    password_matches = verify_password(data.password, password_hash)
    if user is None or not password_matches:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE)
    return AuthSession(access_token=create_access_token(user.id))

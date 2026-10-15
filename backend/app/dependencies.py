"""Zależności FastAPI: sesja bazy i użytkownik rozpoznany po tokenie."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models import User
from app.repositories.articles import ArticleRecord, ArticleRepository
from app.repositories.users import UserRepository
from app.security import decode_access_token

UNAUTHORIZED_MESSAGE = "Zaloguj się, aby kontynuować."
BEARER_CHALLENGE = {"WWW-Authenticate": "Bearer"}
ARTICLE_NOT_FOUND_MESSAGE = "Nie znaleziono artykułu."

bearer_scheme = HTTPBearer(auto_error=False)
SessionDep = Annotated[Session, Depends(get_session)]


def unauthorized() -> HTTPException:
    """Zwraca wyjątek HTTP 401 z komunikatem i nagłówkiem wymaganym przez standard."""
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, UNAUTHORIZED_MESSAGE, headers=BEARER_CHALLENGE
    )


def get_optional_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User | None:
    """Zwraca zalogowanego użytkownika, `None` dla gościa; zły token to błąd 401."""
    if credentials is None:
        return None
    try:
        user_id = decode_access_token(credentials.credentials)
    except InvalidTokenError as error:
        raise unauthorized() from error
    user = UserRepository(session).get(user_id)
    if user is None:
        raise unauthorized()
    return user


def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    """Zwraca zalogowanego użytkownika; gość dostaje błąd 401."""
    if user is None:
        raise unauthorized()
    return user


OptionalUserDep = Annotated[User | None, Depends(get_optional_user)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]


def get_article_or_404(session: Session, article_id: int, viewer_id: int | None) -> ArticleRecord:
    """Zwraca artykuł z licznikami dla oglądającego albo zgłasza 404."""
    record = ArticleRepository(session).get(article_id, viewer_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, ARTICLE_NOT_FOUND_MESSAGE)
    return record

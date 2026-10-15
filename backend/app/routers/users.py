"""Endpointy użytkowników."""

from fastapi import APIRouter

from app.dependencies import CurrentUserDep, SessionDep
from app.mappers import to_current_user
from app.repositories.users import UserRepository
from app.schemas.user import CurrentUser

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUser, summary="Dane zalogowanego użytkownika")
def read_me(current_user: CurrentUserDep, session: SessionDep) -> CurrentUser:
    """Zwraca profil właśnie zalogowanego użytkownika."""
    record = UserRepository(session).build_record(current_user, viewer_id=current_user.id)
    return to_current_user(record)

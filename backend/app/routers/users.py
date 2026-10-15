"""Endpointy użytkowników."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUserDep, OptionalUserDep, SessionDep
from app.mappers import to_current_user, to_profile
from app.models import User
from app.repositories.follows import FollowRepository
from app.repositories.users import UserRecord, UserRepository
from app.schemas.user import CurrentUser, UserProfile

USER_NOT_FOUND_MESSAGE = "Nie znaleziono użytkownika."
CANNOT_FOLLOW_SELF_MESSAGE = "Nie możesz obserwować samego siebie."

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUser, summary="Dane zalogowanego użytkownika")
def read_me(current_user: CurrentUserDep, session: SessionDep) -> CurrentUser:
    """Zwraca profil właśnie zalogowanego użytkownika."""
    record = UserRepository(session).build_record(current_user, viewer_id=current_user.id)
    return to_current_user(record)


def get_profile_or_404(session: Session, user_id: int, viewer_id: int | None) -> UserRecord:
    """Zwraca profil z licznikami dla oglądającego albo zgłasza 404."""
    record = UserRepository(session).get_record(user_id, viewer_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, USER_NOT_FOUND_MESSAGE)
    return record


def update_follow(session: Session, current_user: User, user_id: int, follow: bool) -> UserProfile:
    """Włącza lub wyłącza obserwowanie i zwraca profil z aktualną liczbą obserwujących."""
    if user_id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, CANNOT_FOLLOW_SELF_MESSAGE)
    get_profile_or_404(session, user_id, current_user.id)
    follows = FollowRepository(session)
    if follow:
        follows.add(current_user.id, user_id)
    else:
        follows.remove(current_user.id, user_id)
    return to_profile(get_profile_or_404(session, user_id, current_user.id))


@router.get("/{user_id}", response_model=UserProfile, summary="Profil naukowca")
def read_user(user_id: int, session: SessionDep, viewer: OptionalUserDep) -> UserProfile:
    """Zwraca profil użytkownika albo 404."""
    return to_profile(get_profile_or_404(session, user_id, viewer.id if viewer else None))


@router.put("/{user_id}/follow", response_model=UserProfile, summary="Obserwuj naukowca")
def follow_user(user_id: int, session: SessionDep, current_user: CurrentUserDep) -> UserProfile:
    """Zaczyna obserwować użytkownika."""
    return update_follow(session, current_user, user_id, follow=True)


@router.delete("/{user_id}/follow", response_model=UserProfile, summary="Przestań obserwować")
def unfollow_user(user_id: int, session: SessionDep, current_user: CurrentUserDep) -> UserProfile:
    """Przestaje obserwować użytkownika."""
    return update_follow(session, current_user, user_id, follow=False)

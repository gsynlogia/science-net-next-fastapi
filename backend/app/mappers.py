"""Mappery: zamieniają obiekty bazy na modele odpowiedzi API."""

from app.models import User
from app.repositories.users import UserRecord
from app.schemas.common import FieldSlug
from app.schemas.user import CurrentUser, UserBrief, UserProfile


def to_brief(user: User) -> UserBrief:
    """Zamienia użytkownika na skrót (id, imię i nazwisko, afiliacja)."""
    return UserBrief.model_validate(user, from_attributes=True)


def to_profile(record: UserRecord) -> UserProfile:
    """Buduje profil z użytkownika i policzonych wartości."""
    user = record.user
    return UserProfile(
        id=user.id,
        full_name=user.full_name,
        affiliation=user.affiliation,
        field=FieldSlug(user.field.slug) if user.field else None,
        bio=user.bio,
        followers_count=record.followers_count,
        followed_by_me=record.followed_by_me,
        created_at=user.created_at,
    )


def to_current_user(record: UserRecord) -> CurrentUser:
    """Dokłada do profilu adres e-mail."""
    return CurrentUser(**to_profile(record).model_dump(), email=record.user.email)

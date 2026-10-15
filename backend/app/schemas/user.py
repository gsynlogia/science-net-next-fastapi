"""Modele użytkownika w odpowiedziach API: skrót, profil i dane zalogowanego."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import FieldSlug


class UserBrief(BaseModel):
    """Skrót danych użytkownika."""

    id: int
    full_name: str
    affiliation: str | None


class UserProfile(UserBrief):
    """Profil widoczny dla innych użytkowników."""

    field: FieldSlug | None
    bio: str | None
    followers_count: int
    followed_by_me: bool
    created_at: datetime


class CurrentUser(UserProfile):
    """Zalogowany użytkownik widzi także własny adres e-mail."""

    email: str

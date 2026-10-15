"""Repozytorium użytkowników: konta, profile i liczba obserwujących."""

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Follow, User


class EmailAlreadyRegisteredError(Exception):
    """Adres e-mail jest już zajęty."""


@dataclass(frozen=True)
class UserRecord:
    """Użytkownik z liczbą obserwujących i informacją, czy oglądający go obserwuje."""

    user: User
    followers_count: int
    followed_by_me: bool


class UserRepository:
    """Czyta i zapisuje użytkowników; nie zna HTTP."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, user_id: int) -> User | None:
        """Zwraca użytkownika albo `None`."""
        return self._session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Zwraca użytkownika o podanym (znormalizowanym) adresie albo `None`."""
        return self._session.scalars(select(User).where(User.email == email)).one_or_none()

    def create(self, *, email: str, password_hash: str, full_name: str) -> User:
        """Zapisuje konto; zgłasza `EmailAlreadyRegisteredError`, gdy adres jest zajęty."""
        user = User(email=email, password_hash=password_hash, full_name=full_name)
        self._session.add(user)
        try:
            self._session.commit()
        except IntegrityError as error:
            self._session.rollback()
            raise EmailAlreadyRegisteredError(email) from error
        return user

    def build_record(self, user: User, viewer_id: int | None) -> UserRecord:
        """Liczy obserwujących i sprawdza, czy oglądający obserwuje `user`."""
        followers = select(func.count()).select_from(Follow).where(Follow.followee_id == user.id)
        followers_count = self._session.execute(followers).scalar_one()
        followed_by_me = False
        if viewer_id is not None:
            relation = select(Follow).where(
                Follow.followee_id == user.id, Follow.follower_id == viewer_id
            )
            followed_by_me = self._session.execute(select(relation.exists())).scalar_one()
        return UserRecord(user, followers_count, followed_by_me)

    def get_record(self, user_id: int, viewer_id: int | None) -> UserRecord | None:
        """Zwraca profil użytkownika albo `None`, gdy go nie ma."""
        user = self.get(user_id)
        return None if user is None else self.build_record(user, viewer_id)

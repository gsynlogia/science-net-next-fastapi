"""Repozytorium obserwowania naukowców."""

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Follow


class FollowRepository:
    """Zapisuje obserwowanie; operacje są idempotentne."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, follower_id: int, followee_id: int) -> None:
        """Dodaje obserwowanie; jeśli już istnieje, nic się nie dzieje."""
        statement = (
            insert(Follow)
            .values(follower_id=follower_id, followee_id=followee_id)
            .on_conflict_do_nothing()
        )
        self._session.execute(statement)
        self._session.commit()

    def remove(self, follower_id: int, followee_id: int) -> None:
        """Usuwa obserwowanie; jeśli go nie było, nic się nie dzieje."""
        statement = delete(Follow).where(
            Follow.follower_id == follower_id, Follow.followee_id == followee_id
        )
        self._session.execute(statement)
        self._session.commit()

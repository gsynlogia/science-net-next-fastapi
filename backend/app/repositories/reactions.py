"""Repozytorium reakcji „Przydatne”."""

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Reaction


class ReactionRepository:
    """Zapisuje reakcje; operacje są idempotentne (powtórzenie nic nie psuje)."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, user_id: int, article_id: int) -> None:
        """Dodaje reakcję; jeśli już istnieje, nic się nie dzieje."""
        statement = (
            insert(Reaction).values(user_id=user_id, article_id=article_id).on_conflict_do_nothing()
        )
        self._session.execute(statement)
        self._session.commit()

    def remove(self, user_id: int, article_id: int) -> None:
        """Usuwa reakcję; jeśli jej nie było, nic się nie dzieje."""
        statement = delete(Reaction).where(
            Reaction.user_id == user_id, Reaction.article_id == article_id
        )
        self._session.execute(statement)
        self._session.commit()

"""Repozytorium komentarzy: zapis i stronicowanie kursorem (od najstarszego)."""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Comment


@dataclass(frozen=True)
class CommentPage:
    """Strona komentarzy i kursor kolejnej strony."""

    comments: list[Comment]
    next_cursor: int | None


class CommentRepository:
    """Czyta i zapisuje komentarze; nie zna HTTP."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, article_id: int, author_id: int, body: str) -> Comment:
        """Zapisuje komentarz i zwraca go."""
        comment = Comment(article_id=article_id, author_id=author_id, body=body)
        self._session.add(comment)
        self._session.commit()
        return comment

    def list_page(self, article_id: int, cursor: int | None, limit: int) -> CommentPage:
        """Zwraca `limit` komentarzy nowszych niż kursor, w kolejności dodania."""
        statement = (
            select(Comment)
            .where(Comment.article_id == article_id)
            .options(joinedload(Comment.author))
            .order_by(Comment.id)
            .limit(limit + 1)
        )
        if cursor is not None:
            statement = statement.where(Comment.id > cursor)
        rows = list(self._session.scalars(statement))
        comments = rows[:limit]
        next_cursor = comments[-1].id if len(rows) > limit else None
        return CommentPage(comments, next_cursor)

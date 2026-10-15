"""Repozytorium artykułów: zapytania o artykuły, ich liczniki i stronicowanie kursorem."""

from dataclasses import dataclass

from sqlalchemy import ColumnElement, Row, Select, false, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Article, ArticleTag, Comment, Field, Reaction
from app.schemas.article import ArticleCreate
from app.schemas.common import FieldSlug

ArticleRow = Row[Article, int, int, bool]


@dataclass(frozen=True)
class ArticleRecord:
    """Artykuł z licznikami oraz informacją, czy oglądający zareagował."""

    article: Article
    reactions_count: int
    comments_count: int
    reacted_by_me: bool


@dataclass(frozen=True)
class ArticleFilters:
    """Kryteria listy artykułów; puste kryterium oznacza brak filtra."""

    field: FieldSlug | None = None
    query: str = ""
    author_id: int | None = None


@dataclass(frozen=True)
class ArticlePage:
    """Strona artykułów i kursor kolejnej strony."""

    records: list[ArticleRecord]
    next_cursor: int | None


def to_record(row: ArticleRow) -> ArticleRecord:
    """Rozpakowuje wiersz zapytania do `ArticleRecord`."""
    article, reactions_count, comments_count, reacted_by_me = row
    return ArticleRecord(article, reactions_count, comments_count, reacted_by_me)


class ArticleRepository:
    """Czyta i zapisuje artykuły; nie zna HTTP — tylko bazę."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, author_id: int, data: ArticleCreate) -> ArticleRecord:
        """Zapisuje artykuł wraz z tagami i zwraca go z zerowymi licznikami."""
        field = self._session.scalars(select(Field).where(Field.slug == data.field.value)).one()
        article = Article(
            author_id=author_id,
            field_id=field.id,
            title=data.title,
            abstract=data.abstract,
            full_text_url=data.full_text_url,
            tags=[ArticleTag(tag=tag) for tag in data.tags],
        )
        self._session.add(article)
        self._session.commit()
        return ArticleRecord(article, reactions_count=0, comments_count=0, reacted_by_me=False)

    def get(self, article_id: int, viewer_id: int | None) -> ArticleRecord | None:
        """Zwraca artykuł lub `None`, gdy go nie ma."""
        statement = self._select(viewer_id).where(Article.id == article_id)
        row = self._session.execute(statement).one_or_none()
        return None if row is None else to_record(row)

    def list_page(
        self,
        *,
        filters: ArticleFilters,
        cursor: int | None,
        limit: int,
        viewer_id: int | None,
    ) -> ArticlePage:
        """Zwraca `limit` najnowszych artykułów starszych niż kursor, spełniających filtry."""
        statement = self._select(viewer_id).order_by(Article.id.desc()).limit(limit + 1)
        if cursor is not None:
            statement = statement.where(Article.id < cursor)
        if filters.field is not None:
            statement = statement.where(Article.field.has(Field.slug == filters.field.value))
        if filters.author_id is not None:
            statement = statement.where(Article.author_id == filters.author_id)
        needle = filters.query.strip()
        if needle:
            in_title = Article.title.icontains(needle, autoescape=True)
            in_tags = Article.tags.any(ArticleTag.tag.icontains(needle, autoescape=True))
            statement = statement.where(or_(in_title, in_tags))
        rows = self._session.execute(statement).all()
        records = [to_record(row) for row in rows[:limit]]
        has_more = len(rows) > limit
        return ArticlePage(records, records[-1].article.id if has_more else None)

    def _select(self, viewer_id: int | None) -> Select[Article, int, int, bool]:
        """Buduje zapytanie o artykuły z licznikami i flagą, bez zapytań N+1."""
        reactions = (
            select(func.count()).select_from(Reaction).where(Reaction.article_id == Article.id)
        ).scalar_subquery()
        comments = (
            select(func.count()).select_from(Comment).where(Comment.article_id == Article.id)
        ).scalar_subquery()
        reacted: ColumnElement[bool] = false()
        if viewer_id is not None:
            reaction_of_viewer = select(Reaction).where(
                Reaction.article_id == Article.id, Reaction.user_id == viewer_id
            )
            reacted = reaction_of_viewer.exists()
        return select(Article, reactions, comments, reacted).options(
            joinedload(Article.author),
            joinedload(Article.field),
            selectinload(Article.tags),
        )

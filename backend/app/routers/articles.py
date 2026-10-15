"""Endpointy artykułów: lista z filtrami i kursorem, szczegóły i publikacja."""

from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies import CurrentUserDep, OptionalUserDep, SessionDep, get_article_or_404
from app.mappers import to_article_read
from app.pagination import DEFAULT_PAGE_SIZE, CursorParam, LimitParam, encode_cursor
from app.repositories.articles import ArticleFilters, ArticleRepository
from app.schemas.article import ArticleCreate, ArticleRead
from app.schemas.common import FieldSlug, Page

MAX_QUERY_LENGTH = 100

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=Page[ArticleRead], summary="Lista artykułów od najnowszych")
def list_articles(
    session: SessionDep,
    viewer: OptionalUserDep,
    cursor: CursorParam = None,
    field: FieldSlug | None = None,
    q: Annotated[str, Query(max_length=MAX_QUERY_LENGTH)] = "",
    author_id: Annotated[int | None, Query(ge=1)] = None,
    limit: LimitParam = DEFAULT_PAGE_SIZE,
) -> Page[ArticleRead]:
    """Zwraca jedną stronę artykułów; `next_cursor` wskazuje następną."""
    page = ArticleRepository(session).list_page(
        filters=ArticleFilters(field=field, query=q, author_id=author_id),
        cursor=cursor,
        limit=limit,
        viewer_id=viewer.id if viewer else None,
    )
    next_cursor = encode_cursor(page.next_cursor)
    return Page[ArticleRead](
        items=[to_article_read(r) for r in page.records], next_cursor=next_cursor
    )


@router.get("/{article_id}", response_model=ArticleRead, summary="Szczegóły artykułu")
def read_article(article_id: int, session: SessionDep, viewer: OptionalUserDep) -> ArticleRead:
    """Zwraca artykuł albo 404."""
    record = get_article_or_404(session, article_id, viewer.id if viewer else None)
    return to_article_read(record)


@router.post(
    "",
    response_model=ArticleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Publikacja artykułu",
)
def create_article(
    data: ArticleCreate, session: SessionDep, current_user: CurrentUserDep
) -> ArticleRead:
    """Publikuje artykuł jako zalogowany użytkownik."""
    record = ArticleRepository(session).create(current_user.id, data)
    return to_article_read(record)

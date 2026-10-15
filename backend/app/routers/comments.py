"""Endpointy komentarzy pod artykułem."""

from fastapi import APIRouter, status

from app.dependencies import CurrentUserDep, SessionDep, get_article_or_404
from app.mappers import to_comment_read
from app.pagination import DEFAULT_PAGE_SIZE, CursorParam, LimitParam, encode_cursor
from app.repositories.comments import CommentRepository
from app.schemas.comment import CommentCreate, CommentRead
from app.schemas.common import Page

router = APIRouter(prefix="/articles", tags=["comments"])


@router.get(
    "/{article_id}/comments", response_model=Page[CommentRead], summary="Komentarze artykułu"
)
def list_comments(
    article_id: int,
    session: SessionDep,
    cursor: CursorParam = None,
    limit: LimitParam = DEFAULT_PAGE_SIZE,
) -> Page[CommentRead]:
    """Zwraca jedną stronę komentarzy; `next_cursor` wskazuje następną."""
    get_article_or_404(session, article_id, viewer_id=None)
    page = CommentRepository(session).list_page(article_id, cursor, limit)
    return Page[CommentRead](
        items=[to_comment_read(c) for c in page.comments],
        next_cursor=encode_cursor(page.next_cursor),
    )


@router.post(
    "/{article_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Dodaj komentarz",
)
def add_comment(
    article_id: int, data: CommentCreate, session: SessionDep, current_user: CurrentUserDep
) -> CommentRead:
    """Dodaje komentarz zalogowanego użytkownika."""
    get_article_or_404(session, article_id, current_user.id)
    comment = CommentRepository(session).create(article_id, current_user.id, data.body)
    return to_comment_read(comment)

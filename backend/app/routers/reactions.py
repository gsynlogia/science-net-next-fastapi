"""Endpointy reakcji „Przydatne” pod artykułem."""

from fastapi import APIRouter

from app.dependencies import CurrentUserDep, SessionDep, get_article_or_404
from app.mappers import to_article_read
from app.repositories.reactions import ReactionRepository
from app.schemas.article import ArticleRead

router = APIRouter(prefix="/articles", tags=["reactions"])


@router.put(
    "/{article_id}/reaction", response_model=ArticleRead, summary="Dodaj reakcję „Przydatne”"
)
def add_reaction(article_id: int, session: SessionDep, current_user: CurrentUserDep) -> ArticleRead:
    """Dodaje reakcję zalogowanego użytkownika i zwraca artykuł z aktualnymi licznikami."""
    get_article_or_404(session, article_id, current_user.id)
    ReactionRepository(session).add(current_user.id, article_id)
    return to_article_read(get_article_or_404(session, article_id, current_user.id))


@router.delete(
    "/{article_id}/reaction", response_model=ArticleRead, summary="Cofnij reakcję „Przydatne”"
)
def remove_reaction(
    article_id: int, session: SessionDep, current_user: CurrentUserDep
) -> ArticleRead:
    """Cofa reakcję zalogowanego użytkownika i zwraca artykuł z aktualnymi licznikami."""
    get_article_or_404(session, article_id, current_user.id)
    ReactionRepository(session).remove(current_user.id, article_id)
    return to_article_read(get_article_or_404(session, article_id, current_user.id))

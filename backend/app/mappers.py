"""Mappery: zamieniają obiekty bazy na modele odpowiedzi API."""

from app.models import Comment, User
from app.repositories.articles import ArticleRecord
from app.repositories.users import UserRecord
from app.schemas.article import ArticleRead
from app.schemas.comment import CommentRead
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


def to_article_read(record: ArticleRecord) -> ArticleRead:
    """Buduje odpowiedź z artykułu, jego liczników i flagi „zareagowałem”."""
    article = record.article
    return ArticleRead(
        id=article.id,
        title=article.title,
        abstract=article.abstract,
        field=FieldSlug(article.field.slug),
        tags=[tag.tag for tag in article.tags],
        full_text_url=article.full_text_url,
        created_at=article.created_at,
        author=to_brief(article.author),
        reactions_count=record.reactions_count,
        comments_count=record.comments_count,
        reacted_by_me=record.reacted_by_me,
    )


def to_comment_read(comment: Comment) -> CommentRead:
    """Buduje odpowiedź z komentarza i jego autora."""
    return CommentRead(
        id=comment.id,
        body=comment.body,
        created_at=comment.created_at,
        author=to_brief(comment.author),
    )

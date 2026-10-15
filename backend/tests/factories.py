"""Fabryki danych testowych: zapisują w bazie użytkowników i artykuły potrzebne w testach."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Article, ArticleTag, Field, User


def make_user(db: Session, email: str = "ada@example.com") -> User:
    """Dodaje użytkownika i zwraca go z nadanym `id`."""
    user = User(email=email, password_hash="hash", full_name="Ada Lovelace")
    db.add(user)
    db.flush()
    return user


def make_article(
    db: Session,
    author: User,
    *,
    title: str = "Tytuł",
    field: str = "physics",
    tags: list[str] | None = None,
) -> Article:
    """Dodaje artykuł z podaną dziedziną i tagami."""
    field_row = db.scalars(select(Field).where(Field.slug == field)).one()
    article = Article(
        author_id=author.id, field_id=field_row.id, title=title, abstract="Streszczenie"
    )
    article.tags = [ArticleTag(tag=tag) for tag in tags or []]
    db.add(article)
    db.flush()
    return article

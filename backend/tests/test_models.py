"""Testy modeli na prawdziwym PostgreSQL: ograniczenia, kaskady i zgodność migracji z modelami."""

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import delete, func, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Article, ArticleTag, Base, Comment, Field, Follow, Reaction
from tests.factories import make_article, make_user


def test_migration_seeds_seven_fields(db: Session) -> None:
    assert db.scalar(select(func.count()).select_from(Field)) == 7


def test_email_must_be_unique(db: Session) -> None:
    make_user(db)
    with pytest.raises(IntegrityError):
        make_user(db)


def test_reaction_is_unique_per_user_and_article(db: Session) -> None:
    user = make_user(db)
    article = make_article(db, user)
    statement = insert(Reaction).values(user_id=user.id, article_id=article.id)
    db.execute(statement)
    with pytest.raises(IntegrityError):
        db.execute(statement)


def test_tags_are_sorted_alphabetically(db: Session) -> None:
    article = make_article(db, make_user(db), tags=["zeta", "alfa"])
    db.refresh(article)
    assert [tag.tag for tag in article.tags] == ["alfa", "zeta"]


def test_deleting_article_removes_comments_and_tags(db: Session) -> None:
    user = make_user(db)
    article = make_article(db, user, tags=["ai"])
    db.add(Comment(article_id=article.id, author_id=user.id, body="Ciekawe"))
    db.flush()
    db.execute(delete(Article).where(Article.id == article.id))
    assert db.scalar(select(func.count()).select_from(Comment)) == 0
    assert db.scalar(select(func.count()).select_from(ArticleTag)) == 0


def test_user_cannot_follow_self(db: Session) -> None:
    user = make_user(db)
    with pytest.raises(IntegrityError):
        db.execute(insert(Follow).values(follower_id=user.id, followee_id=user.id))


def test_migrations_match_models(db: Session) -> None:
    context = MigrationContext.configure(db.connection())
    assert compare_metadata(context, Base.metadata) == []

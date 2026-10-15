"""Testy danych demonstracyjnych."""

from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Article, Base, Comment, Follow, Reaction, User
from app.seed import (
    DEMO_PASSWORD,
    SEED_ARTICLES,
    SEED_COMMENTS,
    SEED_FOLLOWS,
    SEED_REACTIONS,
    SEED_USERS,
    seed_demo_data,
)
from tests.factories import make_user


def count(db: Session, model: type[Base]) -> int:
    """Zwraca liczbę wierszy tabeli danego modelu."""
    return db.execute(select(func.count()).select_from(model)).scalar_one()


def test_seed_fills_empty_database(db: Session) -> None:
    assert seed_demo_data(db) is True
    assert count(db, User) == len(SEED_USERS)
    assert count(db, Article) == len(SEED_ARTICLES)
    assert count(db, Reaction) == len(SEED_REACTIONS)
    assert count(db, Comment) == len(SEED_COMMENTS)
    assert count(db, Follow) == len(SEED_FOLLOWS)


def test_seed_is_skipped_when_database_has_users(db: Session) -> None:
    make_user(db)
    assert seed_demo_data(db) is False
    assert count(db, Article) == 0


def test_demo_accounts_can_log_in(client: TestClient, db: Session) -> None:
    seed_demo_data(db)
    response = client.post(
        "/api/auth/login", json={"email": SEED_USERS[0].email, "password": DEMO_PASSWORD}
    )
    assert response.status_code == status.HTTP_200_OK

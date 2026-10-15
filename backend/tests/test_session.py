"""Testy połączenia z bazą skonfigurowaną w DATABASE_URL (tą, której używa aplikacja)."""

from sqlalchemy import text

from app.db.session import get_engine, get_session


def test_get_engine_is_created_once() -> None:
    assert get_engine() is get_engine()


def test_get_session_yields_session_connected_to_database() -> None:
    for session in get_session():
        assert session.execute(text("SELECT 1")).scalar_one() == 1

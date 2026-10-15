"""Fixtures testów: baza testowa ze schematem z migracji i transakcja cofana po teście."""

from collections.abc import Iterator

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.session import build_engine


def ensure_database(url: str) -> None:
    """Łączy się z bazą administracyjną `postgres` i zakłada bazę z adresu, gdy brakuje."""
    parsed = make_url(url)
    admin_url = parsed.set(database="postgres").render_as_string(hide_password=False)
    admin = build_engine(admin_url)
    with admin.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        query = text("SELECT 1 FROM pg_database WHERE datname = :name")
        exists = connection.execute(query, {"name": parsed.database}).scalar()
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{parsed.database}"'))
    admin.dispose()


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    """Przygotowuje bazę testową migracjami i zwraca silnik."""
    url = get_settings().test_database_url
    assert url is not None, "Ustaw TEST_DATABASE_URL w pliku .env"
    ensure_database(url)
    config = Config("alembic.ini")
    config.attributes["url"] = url
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    test_engine = build_engine(url)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    """Sesja działająca w transakcji, którą cofamy po teście."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(connection, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    transaction.rollback()
    connection.close()

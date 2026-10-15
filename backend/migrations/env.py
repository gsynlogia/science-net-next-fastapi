"""Środowisko Alembic: łączy migracje z naszymi modelami i adresem bazy."""

from alembic import context
from sqlalchemy import create_engine

from app.config import get_settings
from app.models import Base

target_metadata = Base.metadata


def run_migrations_online() -> None:
    """Stosuje migracje; adres bazy bierze z konfiguracji wywołania lub z ustawień."""
    url = context.config.attributes.get("url") or get_settings().database_url
    engine = create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


run_migrations_online()

"""Konfiguracja aplikacji czytana ze zmiennych środowiskowych i pliku .env."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

JWT_SECRET_MIN_LENGTH = 32


class Settings(BaseSettings):
    """Ustawienia aplikacji; brakujące wartości domyślne można podać w pliku .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Science Net API"
    app_version: str = "1.0.0"
    database_url: str
    test_database_url: str | None = None
    jwt_secret: str = Field(min_length=JWT_SECRET_MIN_LENGTH)
    jwt_expire_minutes: int = 60


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Zwraca ustawienia aplikacji (wczytane raz)."""
    return Settings()

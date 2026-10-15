"""Konfiguracja aplikacji czytana ze zmiennych środowiskowych i pliku .env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ustawienia aplikacji; brakujące wartości domyślne można podać w pliku .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Science Net API"
    app_version: str = "1.0.0"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Zwraca ustawienia aplikacji (wczytane raz)."""
    return Settings()

"""Punkt wejścia aplikacji FastAPI."""

from fastapi import FastAPI

from app.config import get_settings
from app.routers import health

API_PREFIX = "/api"


def create_app() -> FastAPI:
    """Buduje aplikację FastAPI wraz z routerami."""
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API portalu Science Net — artykuły naukowe w formie mediów społecznościowych.",
        openapi_url=f"{API_PREFIX}/openapi.json",
        docs_url=f"{API_PREFIX}/docs",
        redoc_url=None,
    )
    application.include_router(health.router, prefix=API_PREFIX)
    return application


app = create_app()

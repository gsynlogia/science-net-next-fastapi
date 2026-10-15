"""Endpoint sprawdzający, czy API działa."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    """Odpowiedź endpointu /health."""

    status: Literal["ok"]


@router.get("/health", response_model=HealthResponse, summary="Sprawdzenie, czy API działa")
def health() -> HealthResponse:
    """Zwraca status API."""
    return HealthResponse(status="ok")

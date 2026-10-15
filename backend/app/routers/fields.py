"""Endpoint słownika dziedzin nauki."""

from fastapi import APIRouter

from app.schemas.common import FIELD_NAMES, FieldRead

router = APIRouter(tags=["fields"])


@router.get("/fields", response_model=list[FieldRead], summary="Słownik dziedzin nauki")
def list_fields() -> list[FieldRead]:
    """Zwraca wszystkie dziedziny w stałej kolejności."""
    return [FieldRead(slug=slug, name=name) for slug, name in FIELD_NAMES.items()]

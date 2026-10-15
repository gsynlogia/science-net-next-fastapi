"""Wspólne elementy stronicowania kursorem: parametry adresu i kursor dla klienta."""

from typing import Annotated

from fastapi import Query

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 50

CursorParam = Annotated[int | None, Query(ge=1, description="Kursor ze strony poprzedniej.")]
LimitParam = Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE, description="Rozmiar strony.")]


def encode_cursor(value: int | None) -> str | None:
    """Zwraca kursor jako tekst — klient ma go tylko odesłać, bez zgadywania, co oznacza."""
    return None if value is None else str(value)

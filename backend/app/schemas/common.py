"""Elementy wspólne dla modeli: dziedziny nauki i strona wyników."""

from enum import StrEnum

from pydantic import BaseModel


class FieldSlug(StrEnum):
    """Dozwolone dziedziny nauki."""

    COMPUTER_SCIENCE = "computer_science"
    PHYSICS = "physics"
    BIOLOGY = "biology"
    CHEMISTRY = "chemistry"
    MATHEMATICS = "mathematics"
    MEDICINE = "medicine"
    SOCIAL_SCIENCES = "social_sciences"


FIELD_NAMES: dict[FieldSlug, str] = {
    FieldSlug.COMPUTER_SCIENCE: "Informatyka",
    FieldSlug.PHYSICS: "Fizyka",
    FieldSlug.BIOLOGY: "Biologia",
    FieldSlug.CHEMISTRY: "Chemia",
    FieldSlug.MATHEMATICS: "Matematyka",
    FieldSlug.MEDICINE: "Medycyna",
    FieldSlug.SOCIAL_SCIENCES: "Nauki społeczne",
}


class FieldRead(BaseModel):
    """Dziedzina w odpowiedzi API."""

    slug: FieldSlug
    name: str


class Page[T](BaseModel):
    """Strona wyników stronicowanych kursorem."""

    items: list[T]
    next_cursor: str | None

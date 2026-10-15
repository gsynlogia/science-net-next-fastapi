"""Modele artykułu: dane wejściowe (tworzenie) i wyjściowe (odczyt)."""

from datetime import datetime
from typing import Annotated
from urllib.parse import urlparse

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.schemas.common import FieldSlug
from app.schemas.user import UserBrief

TITLE_MIN_LENGTH = 5
TITLE_MAX_LENGTH = 200
ABSTRACT_MIN_LENGTH = 20
ABSTRACT_MAX_LENGTH = 2000
MAX_TAGS = 5
TAG_MAX_LENGTH = 30
ALLOWED_URL_SCHEMES = {"http", "https"}

Title = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=TITLE_MIN_LENGTH, max_length=TITLE_MAX_LENGTH
    ),
]
Abstract = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=ABSTRACT_MIN_LENGTH, max_length=ABSTRACT_MAX_LENGTH
    ),
]


class ArticleCreate(BaseModel):
    """Dane nowego artykułu — walidowane tak samo jak formularz we froncie."""

    title: Title
    abstract: Abstract
    field: FieldSlug
    tags: list[str] = Field(default_factory=list)
    full_text_url: str | None = None

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, value: list[str]) -> list[str]:
        tags = list(dict.fromkeys(tag.strip().lower() for tag in value if tag.strip()))
        if len(tags) > MAX_TAGS:
            raise ValueError(f"Najwyżej {MAX_TAGS} tagów.")
        if any(len(tag) > TAG_MAX_LENGTH for tag in tags):
            raise ValueError(f"Tag może mieć najwyżej {TAG_MAX_LENGTH} znaków.")
        return tags

    @field_validator("full_text_url")
    @classmethod
    def ensure_http_url(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        if urlparse(value).scheme not in ALLOWED_URL_SCHEMES:
            raise ValueError("Podaj poprawny adres http lub https.")
        return value


class ArticleRead(BaseModel):
    """Artykuł w odpowiedzi API."""

    id: int
    title: str
    abstract: str
    field: FieldSlug
    tags: list[str]
    full_text_url: str | None
    created_at: datetime
    author: UserBrief
    reactions_count: int
    comments_count: int
    reacted_by_me: bool

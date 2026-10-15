"""Modele komentarza: dane wejściowe i wyjściowe."""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.user import UserBrief

COMMENT_MIN_LENGTH = 1
COMMENT_MAX_LENGTH = 1000

CommentBody = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=COMMENT_MIN_LENGTH, max_length=COMMENT_MAX_LENGTH
    ),
]


class CommentCreate(BaseModel):
    """Dane nowego komentarza."""

    body: CommentBody


class CommentRead(BaseModel):
    """Komentarz w odpowiedzi API."""

    id: int
    body: str
    created_at: datetime
    author: UserBrief

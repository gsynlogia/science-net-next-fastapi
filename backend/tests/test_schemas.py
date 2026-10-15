"""Testy modeli Pydantic: reguły walidacji artykułu."""

import pytest
from pydantic import ValidationError

from app.schemas.article import ArticleCreate
from app.schemas.common import FieldSlug

VALID = {
    "title": "Grafy losowe",
    "abstract": "Wykazujemy próg krytyczny rozprzestrzeniania się informacji.",
    "field": "mathematics",
    "tags": ["grafy"],
    "full_text_url": "https://doi.org/10.1000/xyz",
}


def test_valid_article_is_accepted_and_trimmed() -> None:
    article = ArticleCreate.model_validate({**VALID, "title": "  Grafy losowe  "})
    assert article.title == "Grafy losowe"
    assert article.field is FieldSlug.MATHEMATICS


def test_tags_are_normalized() -> None:
    article = ArticleCreate.model_validate({**VALID, "tags": [" Grafy ", "grafy", "", "AI"]})
    assert article.tags == ["grafy", "ai"]


@pytest.mark.parametrize(
    ("field_name", "bad_value"),
    [
        ("title", "abc"),
        ("abstract", "za krótko"),
        ("field", "magia"),
        ("tags", ["a", "b", "c", "d", "e", "f"]),
        ("tags", ["x" * 31]),
        ("full_text_url", "javascript:alert(1)"),
    ],
)
def test_invalid_values_are_rejected(field_name: str, bad_value: object) -> None:
    with pytest.raises(ValidationError):
        ArticleCreate.model_validate({**VALID, field_name: bad_value})


def test_empty_url_means_no_link() -> None:
    article = ArticleCreate.model_validate({**VALID, "full_text_url": ""})
    assert article.full_text_url is None

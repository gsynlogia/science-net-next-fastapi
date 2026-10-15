"""Testy repozytorium artykułów na prawdziwej bazie: filtry, liczniki i stronicowanie kursorem."""

from sqlalchemy import event, insert
from sqlalchemy.orm import Session

from app.models import Comment, Reaction
from app.repositories.articles import ArticleFilters, ArticleRepository
from app.schemas.article import ArticleCreate
from app.schemas.common import FieldSlug
from tests.factories import make_article, make_user

PAGE_SIZE = 2
NO_FILTERS = ArticleFilters()


def list_ids(repo: ArticleRepository, filters: ArticleFilters = NO_FILTERS) -> list[int]:
    """Zwraca `id` artykułów z jednej strony po zastosowaniu filtrów."""
    page = repo.list_page(filters=filters, cursor=None, limit=50, viewer_id=None)
    return [record.article.id for record in page.records]


def test_create_stores_article_with_tags(db: Session) -> None:
    author = make_user(db)
    data = ArticleCreate(
        title="Nowe odkrycie",
        abstract="Streszczenie liczące więcej niż dwadzieścia znaków.",
        field=FieldSlug.PHYSICS,
        tags=["ML", "ai"],
    )
    record = ArticleRepository(db).create(author.id, data)
    assert record.article.id > 0
    assert [tag.tag for tag in record.article.tags] == ["ai", "ml"]
    assert (record.reactions_count, record.comments_count, record.reacted_by_me) == (0, 0, False)


def test_get_returns_none_for_missing_article(db: Session) -> None:
    assert ArticleRepository(db).get(999_999, viewer_id=None) is None


def test_list_page_walks_all_articles_newest_first(db: Session) -> None:
    author = make_user(db)
    created = [make_article(db, author).id for _ in range(5)]
    repo = ArticleRepository(db)
    seen: list[list[int]] = []
    cursor: int | None = None
    while True:
        page = repo.list_page(filters=NO_FILTERS, cursor=cursor, limit=PAGE_SIZE, viewer_id=None)
        seen.append([record.article.id for record in page.records])
        if page.next_cursor is None:
            break
        cursor = page.next_cursor
    assert [len(ids) for ids in seen] == [2, 2, 1]
    assert [i for ids in seen for i in ids] == sorted(created, reverse=True)


def test_list_page_filters_by_field_and_author(db: Session) -> None:
    ada, bob = make_user(db), make_user(db, "bob@example.com")
    physics = make_article(db, ada, field="physics").id
    biology = make_article(db, bob, field="biology").id
    repo = ArticleRepository(db)
    assert list_ids(repo, ArticleFilters(field=FieldSlug.BIOLOGY)) == [biology]
    assert list_ids(repo, ArticleFilters(author_id=ada.id)) == [physics]


def test_list_page_searches_title_and_tags(db: Session) -> None:
    author = make_user(db)
    by_title = make_article(db, author, title="Sieci neuronowe").id
    by_tag = make_article(db, author, title="Inny temat", tags=["neuro"]).id
    make_article(db, author, title="Zupełnie coś innego")
    found = list_ids(ArticleRepository(db), ArticleFilters(query=" NEURO "))
    assert found == [by_tag, by_title]


def test_search_treats_wildcards_literally(db: Session) -> None:
    author = make_user(db)
    percent = make_article(db, author, title="Skuteczność 100% pewna").id
    make_article(db, author, title="Inny temat")
    assert list_ids(ArticleRepository(db), ArticleFilters(query="%")) == [percent]


def test_counters_and_reacted_flag(db: Session) -> None:
    author, reader = make_user(db), make_user(db, "reader@example.com")
    article = make_article(db, author)
    db.execute(insert(Reaction).values(user_id=reader.id, article_id=article.id))
    db.add_all(
        [Comment(article_id=article.id, author_id=reader.id, body=text) for text in ("A", "B")]
    )
    db.flush()
    repo = ArticleRepository(db)
    as_reader = repo.get(article.id, viewer_id=reader.id)
    as_guest = repo.get(article.id, viewer_id=None)
    assert as_reader is not None and as_guest is not None
    assert (as_reader.reactions_count, as_reader.comments_count) == (1, 2)
    assert as_reader.reacted_by_me is True
    assert as_guest.reacted_by_me is False


def test_list_page_runs_constant_number_of_queries(db: Session) -> None:
    authors = [make_user(db, f"user{number}@example.com") for number in range(3)]
    for author in authors:
        make_article(db, author, tags=["a", "b"])
    db.expire_all()
    statements: list[str] = []
    event.listen(db.connection(), "before_cursor_execute", lambda *args: statements.append(args[2]))
    page = ArticleRepository(db).list_page(
        filters=NO_FILTERS, cursor=None, limit=10, viewer_id=None
    )
    names = [record.article.author.full_name for record in page.records]
    assert len(names) == len(authors)
    assert len(statements) == 2

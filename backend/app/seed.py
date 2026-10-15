"""Dane demonstracyjne: kilku naukowców, artykuły, reakcje, komentarze i obserwowanie."""

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_engine
from app.models import Article, ArticleTag, Comment, Field, Follow, Reaction, User
from app.security import hash_password

DEMO_PASSWORD = "Haslo12345!"


@dataclass(frozen=True)
class SeedUser:
    """Konto demonstracyjne."""

    email: str
    full_name: str
    affiliation: str
    field: str
    bio: str | None


@dataclass(frozen=True)
class SeedArticle:
    """Artykuł demonstracyjny; autora wskazuje numer na liście `SEED_USERS`."""

    author: int
    field: str
    title: str
    abstract: str
    tags: tuple[str, ...]
    full_text_url: str | None
    created_at: datetime


SEED_USERS = [
    SeedUser(
        "anna@example.com",
        "Anna Kowalska",
        "Politechnika Gdańska",
        "computer_science",
        "Zajmuję się przetwarzaniem języka naturalnego w dziedzinach specjalistycznych.",
    ),
    SeedUser(
        "jan@example.com",
        "Jan Nowak",
        "Uniwersytet Gdański",
        "biology",
        "Badam ekosystemy Bałtyku i wpływ zmian klimatu na rybołówstwo.",
    ),
    SeedUser(
        "maria@example.com",
        "Maria Wiśniewska",
        "Instytut Fizyki PAN",
        "physics",
        None,
    ),
]

SEED_ARTICLES = [
    SeedArticle(
        1,
        "biology",
        "Odporność koralowców na zakwaszenie oceanów",
        "Część gatunków koralowców adaptuje się do niższego pH w ciągu trzech pokoleń.",
        ("ocean", "koralowce"),
        "https://doi.org/10.1000/koralowce.2026",
        datetime(2026, 3, 1, 10, 0, tzinfo=UTC),
    ),
    SeedArticle(
        2,
        "physics",
        "Kwantowe korelacje w układach wielu cząstek",
        "Nowa metoda pomiaru splątania w łańcuchach spinowych skraca eksperyment 10-krotnie.",
        ("kwanty", "splatanie"),
        None,
        datetime(2026, 3, 5, 12, 30, tzinfo=UTC),
    ),
    SeedArticle(
        0,
        "computer_science",
        "Streszczanie publikacji medycznych modelami językowymi",
        "Porównanie streszczeń z małych modeli lokalnych i dużych modeli w chmurze.",
        ("nlp", "llm", "medycyna"),
        "https://doi.org/10.1000/llm.2026",
        datetime(2026, 3, 9, 8, 45, tzinfo=UTC),
    ),
    SeedArticle(
        1,
        "social_sciences",
        "Wpływ pracy zdalnej na współpracę zespołów naukowych",
        "Ankieta wśród 300 badaczy: mniej nieformalnych kontaktów, więcej pracy w skupieniu.",
        ("praca-zdalna", "zespoly"),
        None,
        datetime(2026, 3, 12, 16, 20, tzinfo=UTC),
    ),
    SeedArticle(
        0,
        "mathematics",
        "Szybkie algorytmy dla grafów rzadkich",
        "Nowy algorytm najkrótszych ścieżek w grafach rzadkich działa prawie liniowo.",
        ("grafy", "algorytmy"),
        "https://doi.org/10.1000/grafy.2026",
        datetime(2026, 3, 15, 9, 10, tzinfo=UTC),
    ),
    SeedArticle(
        2,
        "chemistry",
        "Nowy katalizator do rozkładu mikroplastiku",
        "Katalizator z tlenku tytanu rozkłada mikrocząstki polietylenu w świetle widzialnym.",
        ("katalizatory", "mikroplastik"),
        None,
        datetime(2026, 3, 18, 11, 0, tzinfo=UTC),
    ),
]

SEED_REACTIONS = [(0, 0), (2, 0), (0, 1), (1, 1), (1, 2), (2, 2), (1, 4), (0, 5)]
SEED_COMMENTS = [
    (0, 0, "Ciekawe wyniki — czy badano też rafy w Bałtyku?"),
    (1, 0, "Gratulacje, skrócenie eksperymentu to duży krok."),
    (2, 1, "Interesujące porównanie, brakuje mi tylko opisu danych."),
    (2, 2, "Czy modele lokalne radzą sobie z polskimi tekstami?"),
    (4, 1, "Przydałby się link do implementacji."),
]
SEED_FOLLOWS = [(1, 0), (2, 0), (0, 1)]


def seed_demo_data(session: Session) -> bool:
    """Wstawia dane demo; zwraca `False` bez zmian, gdy w bazie są już użytkownicy."""
    if session.scalar(select(func.count()).select_from(User)):
        return False
    field_ids = {field.slug: field.id for field in session.scalars(select(Field))}
    password_hash = hash_password(DEMO_PASSWORD)
    users = [
        User(
            email=seed.email,
            password_hash=password_hash,
            full_name=seed.full_name,
            affiliation=seed.affiliation,
            field_id=field_ids[seed.field],
            bio=seed.bio,
        )
        for seed in SEED_USERS
    ]
    session.add_all(users)
    session.flush()
    articles = [
        Article(
            author_id=users[seed.author].id,
            field_id=field_ids[seed.field],
            title=seed.title,
            abstract=seed.abstract,
            full_text_url=seed.full_text_url,
            created_at=seed.created_at,
            tags=[ArticleTag(tag=tag) for tag in seed.tags],
        )
        for seed in SEED_ARTICLES
    ]
    session.add_all(articles)
    session.flush()
    session.add_all(
        Reaction(user_id=users[user].id, article_id=articles[article].id)
        for user, article in SEED_REACTIONS
    )
    session.add_all(
        Comment(article_id=articles[article].id, author_id=users[author].id, body=body)
        for article, author, body in SEED_COMMENTS
    )
    session.add_all(
        Follow(follower_id=users[follower].id, followee_id=users[followee].id)
        for follower, followee in SEED_FOLLOWS
    )
    session.commit()
    return True


if __name__ == "__main__":
    with Session(get_engine()) as demo_session:
        added = seed_demo_data(demo_session)
    print("Dodano dane demonstracyjne." if added else "Baza nie jest pusta — pominięto.")

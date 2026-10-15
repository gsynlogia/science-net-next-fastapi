"""Schemat początkowy: dziedziny, użytkownicy, artykuły, tagi, reakcje, komentarze, obserwowanie."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None

FIELDS = [
    {"slug": "computer_science", "name": "Informatyka"},
    {"slug": "physics", "name": "Fizyka"},
    {"slug": "biology", "name": "Biologia"},
    {"slug": "chemistry", "name": "Chemia"},
    {"slug": "mathematics", "name": "Matematyka"},
    {"slug": "medicine", "name": "Medycyna"},
    {"slug": "social_sciences", "name": "Nauki społeczne"},
]


def upgrade() -> None:
    """Tworzy wszystkie tabele i wypełnia słownik dziedzin."""
    fields = op.create_table(
        "fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(50), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.UniqueConstraint("slug"),
    )
    op.bulk_insert(fields, FIELDS)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("affiliation", sa.String(150)),
        sa.Column("field_id", sa.Integer(), sa.ForeignKey("fields.id")),
        sa.Column("bio", sa.String(500)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "articles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("field_id", sa.Integer(), sa.ForeignKey("fields.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("abstract", sa.Text(), nullable=False),
        sa.Column("full_text_url", sa.String(2048)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_articles_field_id_id", "articles", ["field_id", sa.text("id DESC")])
    op.create_index("ix_articles_author_id_id", "articles", ["author_id", sa.text("id DESC")])
    op.create_table(
        "article_tags",
        sa.Column(
            "article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("tag", sa.String(30), primary_key=True),
    )
    op.create_index("ix_article_tags_tag", "article_tags", ["tag"])
    op.create_table(
        "reactions",
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
        ),
        sa.Column(
            "article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_reactions_article_id", "reactions", ["article_id"])
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_comments_article_id_id", "comments", ["article_id", "id"])
    op.create_table(
        "follows",
        sa.Column(
            "follower_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "followee_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("follower_id <> followee_id", name="not_self"),
    )
    op.create_index("ix_follows_followee_id", "follows", ["followee_id"])


def downgrade() -> None:
    """Usuwa wszystkie tabele w odwrotnej kolejności zależności."""
    for table in (
        "follows",
        "comments",
        "reactions",
        "article_tags",
        "articles",
        "users",
        "fields",
    ):
        op.drop_table(table)

"""Modele artykułu i jego tagów."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, desc, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.field import Field
from app.models.user import User


class Article(Base):
    """Artykuł naukowy."""

    __tablename__ = "articles"
    __table_args__ = (
        Index("ix_articles_field_id_id", "field_id", desc("id")),
        Index("ix_articles_author_id_id", "author_id", desc("id")),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"))
    title: Mapped[str] = mapped_column(String(200))
    abstract: Mapped[str] = mapped_column(Text)
    full_text_url: Mapped[str | None] = mapped_column(String(2048))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    author: Mapped[User] = relationship()
    field: Mapped[Field] = relationship()
    tags: Mapped[list["ArticleTag"]] = relationship(
        cascade="all, delete-orphan", order_by="ArticleTag.tag"
    )


class ArticleTag(Base):
    """Tag przypisany do artykułu."""

    __tablename__ = "article_tags"

    article_id: Mapped[int] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True
    )
    tag: Mapped[str] = mapped_column(String(30), primary_key=True, index=True)

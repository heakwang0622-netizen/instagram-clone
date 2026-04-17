from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (Index("ix_posts_user_id_created_at", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)

    author = relationship("User", back_populates="posts")
    media_items: Mapped[list[PostMedia]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostMedia.sort_order",
    )
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    saved_by = relationship("SavedPost", back_populates="post", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="post")


class PostMedia(Base):
    __tablename__ = "post_media"
    __table_args__ = (Index("ix_post_media_post_sort", "post_id", "sort_order"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    media_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    media_type: Mapped[str] = mapped_column(
        String(16),
        default="image",
        server_default="image",
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)

    post = relationship("Post", back_populates="media_items")

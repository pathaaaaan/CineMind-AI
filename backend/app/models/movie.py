import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, Text, func, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tmdb_id: Mapped[int | None] = mapped_column(Integer, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    original_title: Mapped[str | None] = mapped_column(String(255))
    overview: Mapped[str | None] = mapped_column(Text)
    tagline: Mapped[str | None] = mapped_column(Text)
    genres: Mapped[list[str] | None] = mapped_column(JSON)
    cast: Mapped[list[str] | None] = mapped_column(JSON)
    director: Mapped[str | None] = mapped_column(String(255))
    production_companies: Mapped[list[str] | None] = mapped_column(JSON)
    runtime: Mapped[int | None] = mapped_column(Integer, index=True)
    release_date: Mapped[date | None] = mapped_column(Date, index=True)
    vote_average: Mapped[float | None] = mapped_column(Float)
    poster_url: Mapped[str | None] = mapped_column(Text)
    backdrop_url: Mapped[str | None] = mapped_column(Text)
    processed_tags: Mapped[str | None] = mapped_column(Text)
    embedding_text: Mapped[str | None] = mapped_column(Text)
    faiss_index_id: Mapped[int | None] = mapped_column(Integer, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    watchlist_items = relationship("Watchlist", back_populates="movie", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="movie")


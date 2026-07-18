import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, func, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    search_history_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("search_history.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    movie_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"), index=True)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    similarity_score: Mapped[float | None] = mapped_column(Float)
    ai_explanation: Mapped[str | None] = mapped_column(Text)
    similar_themes: Mapped[list[str] | None] = mapped_column(JSON)
    similar_genres: Mapped[list[str] | None] = mapped_column(JSON)
    storytelling_elements: Mapped[list[str] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    search_history = relationship("SearchHistory", back_populates="recommendations")
    user = relationship("User", back_populates="recommendations")
    movie = relationship("Movie", back_populates="recommendations")


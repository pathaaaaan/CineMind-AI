from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.recommendation import Recommendation
from app.models.search_history import SearchHistory
from app.models.watchlist import Watchlist


class RecommendationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_search(self, *, user_id: UUID | None, query: str, search_type: str, top_k: int) -> SearchHistory:
        search = SearchHistory(user_id=user_id, query=query, search_type=search_type, top_k=top_k)
        self.db.add(search)
        self.db.commit()
        self.db.refresh(search)
        return search

    def create_recommendation(
        self,
        *,
        search_history_id: UUID,
        user_id: UUID | None,
        movie_id: UUID,
        rank: int,
        similarity_score: float,
        ai_explanation: str,
        similar_themes: list[str],
        similar_genres: list[str],
        storytelling_elements: list[str],
    ) -> Recommendation:
        recommendation = Recommendation(
            search_history_id=search_history_id,
            user_id=user_id,
            movie_id=movie_id,
            rank=rank,
            similarity_score=similarity_score,
            ai_explanation=ai_explanation,
            similar_themes=similar_themes,
            similar_genres=similar_genres,
            storytelling_elements=storytelling_elements,
        )
        self.db.add(recommendation)
        self.db.commit()
        self.db.refresh(recommendation)
        return recommendation

    def total_searches(self, user_id: UUID) -> int:
        return self.db.scalar(select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user_id)) or 0

    def watchlist_count(self, user_id: UUID) -> int:
        return self.db.scalar(select(func.count(Watchlist.id)).where(Watchlist.user_id == user_id)) or 0

    def recent_searches(self, user_id: UUID, limit: int = 5) -> list[SearchHistory]:
        return list(
            self.db.scalars(
                select(SearchHistory)
                .where(SearchHistory.user_id == user_id)
                .order_by(SearchHistory.created_at.desc())
                .limit(limit)
            ).all()
        )

    def history(self, user_id: UUID, limit: int = 20) -> list[SearchHistory]:
        return list(
            self.db.scalars(
                select(SearchHistory)
                .options(selectinload(SearchHistory.recommendations).selectinload(Recommendation.movie))
                .where(SearchHistory.user_id == user_id)
                .order_by(SearchHistory.created_at.desc())
                .limit(limit)
            ).all()
        )


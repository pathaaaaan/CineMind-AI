from collections import Counter

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.watchlist_repository import WatchlistRepository
from app.schemas.dashboard import DashboardHistory, DashboardSummary, GenreCount, HistoryRecommendation, SearchHistoryItem


class DashboardService:
    def __init__(self, db: Session):
        self.recommendations = RecommendationRepository(db)
        self.watchlist = WatchlistRepository(db)

    def summary(self, user: User) -> DashboardSummary:
        watchlist_items = self.watchlist.list_for_user(user.id)
        genre_counts: Counter[str] = Counter()
        for item in watchlist_items:
            for genre in item.movie.genres or []:
                genre_counts[genre] += 1
        recent = self.recommendations.recent_searches(user.id)
        return DashboardSummary(
            total_searches=self.recommendations.total_searches(user.id),
            watchlist_count=self.recommendations.watchlist_count(user.id),
            favorite_genres=[GenreCount(genre=genre, count=count) for genre, count in genre_counts.most_common(5)],
            recent_queries=[search.query for search in recent],
        )

    def history(self, user: User) -> DashboardHistory:
        searches = self.recommendations.history(user.id)
        return DashboardHistory(
            items=[
                SearchHistoryItem(
                    query=search.query,
                    created_at=search.created_at,
                    recommendations=[
                        HistoryRecommendation(title=recommendation.movie.title, rank=recommendation.rank)
                        for recommendation in sorted(search.recommendations, key=lambda item: item.rank)
                    ],
                )
                for search in searches
            ]
        )


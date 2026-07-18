from datetime import datetime

from pydantic import BaseModel


class GenreCount(BaseModel):
    genre: str
    count: int


class DashboardSummary(BaseModel):
    total_searches: int
    watchlist_count: int
    favorite_genres: list[GenreCount]
    recent_queries: list[str]


class HistoryRecommendation(BaseModel):
    title: str
    rank: int


class SearchHistoryItem(BaseModel):
    query: str
    created_at: datetime
    recommendations: list[HistoryRecommendation]


class DashboardHistory(BaseModel):
    items: list[SearchHistoryItem]


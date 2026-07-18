from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.movie import MovieListItem


class RagFilters(BaseModel):
    genres: list[str] | None = None
    max_runtime: int | None = Field(default=None, ge=1)
    min_runtime: int | None = Field(default=None, ge=1)
    min_vote_average: float | None = Field(default=None, ge=0, le=10)


class RagSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    top_k: int = Field(default=10, ge=1, le=25)
    filters: RagFilters | None = None


class RagSearchResult(BaseModel):
    movie: MovieListItem
    similarity_score: float


class RagSearchResponse(BaseModel):
    query: str
    results: list[RagSearchResult]


class Explanation(BaseModel):
    why_recommended: str
    similar_themes: list[str]
    similar_genres: list[str]
    storytelling_elements: list[str]


class RecommendationItem(BaseModel):
    movie: MovieListItem
    similarity_score: float
    explanation: Explanation


class RagRecommendationResponse(BaseModel):
    query: str
    recommendations: list[RecommendationItem]


class GeminiRecommendation(BaseModel):
    movie_id: UUID
    why_recommended: str
    similar_themes: list[str]
    similar_genres: list[str]
    storytelling_elements: list[str]


class GeminiRecommendationPayload(BaseModel):
    recommendations: list[GeminiRecommendation]


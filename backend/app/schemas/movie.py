from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MovieRead(BaseModel):
    id: UUID
    tmdb_id: int | None = None
    title: str
    original_title: str | None = None
    overview: str | None = None
    tagline: str | None = None
    genres: list[str] | None = None
    cast: list[str] | None = None
    director: str | None = None
    production_companies: list[str] | None = None
    runtime: int | None = None
    release_date: date | None = None
    vote_average: float | None = None
    poster_url: str | None = None
    backdrop_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class MovieListItem(BaseModel):
    id: UUID
    title: str
    overview: str | None = None
    genres: list[str] | None = None
    runtime: int | None = None
    vote_average: float | None = None
    poster_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedMovies(BaseModel):
    items: list[MovieListItem]
    page: int
    limit: int
    total: int


class SimilarMovieResult(BaseModel):
    movie: MovieListItem
    similarity_score: float


class SimilarMoviesResponse(BaseModel):
    source_movie: MovieListItem
    recommendations: list[SimilarMovieResult]


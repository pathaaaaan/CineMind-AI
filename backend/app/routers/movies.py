from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.movie import MovieRead, PaginatedMovies, SimilarMoviesResponse
from app.services.movie_service import MovieService


router = APIRouter()


@router.get("/search", response_model=PaginatedMovies)
def search_movies(
    query: str = Query(min_length=1, max_length=200),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> PaginatedMovies:
    return MovieService(db).search(query=query, page=page, limit=limit)


@router.get("/{movie_id}", response_model=MovieRead)
def get_movie(movie_id: UUID, db: Session = Depends(get_db)) -> MovieRead:
    return MovieService(db).get(movie_id)


@router.get("/{movie_id}/similar", response_model=SimilarMoviesResponse)
def similar_movies(
    movie_id: UUID,
    top_k: int = Query(default=10, ge=1, le=25),
    db: Session = Depends(get_db),
) -> SimilarMoviesResponse:
    return MovieService(db).similar(movie_id=movie_id, top_k=top_k)


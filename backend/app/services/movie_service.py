from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import not_found
from app.repositories.movie_repository import MovieRepository
from app.schemas.movie import MovieRead, PaginatedMovies, SimilarMovieResult, SimilarMoviesResponse
from app.vector_store.faiss_store import FaissMovieStore


class MovieService:
    def __init__(self, db: Session):
        self.movies = MovieRepository(db)
        self.vector_store = FaissMovieStore()

    def search(self, query: str, page: int, limit: int) -> PaginatedMovies:
        items, total = self.movies.search(query=query, page=page, limit=limit)
        return PaginatedMovies(items=items, page=page, limit=limit, total=total)

    def get(self, movie_id: UUID) -> MovieRead:
        movie = self.movies.get(movie_id)
        if not movie:
            raise not_found("Movie not found")
        return MovieRead.model_validate(movie)

    def similar(self, movie_id: UUID, top_k: int) -> SimilarMoviesResponse:
        source = self.movies.get(movie_id)
        if not source:
            raise not_found("Movie not found")
        if source.faiss_index_id is None:
            return SimilarMoviesResponse(source_movie=source, recommendations=[])

        hits = self.vector_store.search_by_vector_id(source.faiss_index_id, top_k=top_k + 1)
        hits = [hit for hit in hits if hit.movie_id != str(movie_id)][:top_k]
        movies = self.movies.get_many([UUID(hit.movie_id) for hit in hits])
        scores = {hit.movie_id: hit.score for hit in hits}
        return SimilarMoviesResponse(
            source_movie=source,
            recommendations=[
                SimilarMovieResult(movie=movie, similarity_score=scores[str(movie.id)])
                for movie in movies
            ],
        )


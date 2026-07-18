from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.schemas.rag import RagFilters


class MovieRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, movie_id: UUID) -> Movie | None:
        return self.db.get(Movie, movie_id)

    def get_many(self, movie_ids: list[UUID]) -> list[Movie]:
        if not movie_ids:
            return []
        movies = self.db.scalars(select(Movie).where(Movie.id.in_(movie_ids))).all()
        order = {movie_id: index for index, movie_id in enumerate(movie_ids)}
        return sorted(movies, key=lambda movie: order.get(movie.id, 10**9))

    def search(self, query: str, page: int, limit: int) -> tuple[list[Movie], int]:
        pattern = f"%{query}%"
        statement = select(Movie).where(
            or_(
                Movie.title.ilike(pattern),
                Movie.director.ilike(pattern),
                Movie.overview.ilike(pattern),
                Movie.processed_tags.ilike(pattern),
            )
        )
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        items = self.db.scalars(statement.order_by(Movie.vote_average.desc().nullslast()).offset((page - 1) * limit).limit(limit)).all()
        return list(items), total

    def apply_filters(self, movies: list[Movie], filters: RagFilters | None) -> list[Movie]:
        if not filters:
            return movies
        filtered = movies
        if filters.max_runtime:
            filtered = [movie for movie in filtered if movie.runtime is not None and movie.runtime <= filters.max_runtime]
        if filters.min_runtime:
            filtered = [movie for movie in filtered if movie.runtime is not None and movie.runtime >= filters.min_runtime]
        if filters.min_vote_average:
            filtered = [movie for movie in filtered if movie.vote_average is not None and movie.vote_average >= filters.min_vote_average]
        if filters.genres:
            desired = {genre.lower() for genre in filters.genres}
            filtered = [
                movie
                for movie in filtered
                if movie.genres and desired.intersection({genre.lower() for genre in movie.genres})
            ]
        return filtered


from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import not_found
from app.models.user import User
from app.repositories.movie_repository import MovieRepository
from app.repositories.watchlist_repository import WatchlistRepository
from app.schemas.watchlist import WatchlistAddRequest, WatchlistResponse


class WatchlistService:
    def __init__(self, db: Session):
        self.movies = MovieRepository(db)
        self.watchlist = WatchlistRepository(db)

    def add(self, user: User, payload: WatchlistAddRequest) -> dict[str, str]:
        if not self.movies.get(payload.movie_id):
            raise not_found("Movie not found")
        self.watchlist.upsert(user_id=user.id, movie_id=payload.movie_id, status=payload.status, notes=payload.notes)
        return {"message": "Movie added to watchlist"}

    def list(self, user: User) -> WatchlistResponse:
        return WatchlistResponse(items=self.watchlist.list_for_user(user.id))

    def delete(self, user: User, movie_id: UUID) -> dict[str, str]:
        deleted = self.watchlist.delete(user_id=user.id, movie_id=movie_id)
        if not deleted:
            raise not_found("Watchlist item not found")
        return {"message": "Movie removed from watchlist"}


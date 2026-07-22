from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.watchlist import WatchlistAddRequest, WatchlistAddTmdbRequest, WatchlistResponse
from app.services.watchlist_service import WatchlistService


router = APIRouter()


@router.post("/add")
def add_to_watchlist(
    payload: WatchlistAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    return WatchlistService(db).add(current_user, payload)


@router.post("/add_tmdb")
def add_to_watchlist_tmdb(
    payload: WatchlistAddTmdbRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    return WatchlistService(db).add_tmdb(current_user, payload)


@router.get("", response_model=WatchlistResponse)
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WatchlistResponse:
    return WatchlistService(db).list(current_user)


@router.delete("/{movie_id}")
def remove_from_watchlist(
    movie_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    return WatchlistService(db).delete(current_user, movie_id)


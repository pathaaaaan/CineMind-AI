from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.watchlist import Watchlist


class WatchlistRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: UUID) -> list[Watchlist]:
        return list(
            self.db.scalars(
                select(Watchlist)
                .options(selectinload(Watchlist.movie))
                .where(Watchlist.user_id == user_id)
                .order_by(Watchlist.created_at.desc())
            ).all()
        )

    def upsert(self, *, user_id: UUID, movie_id: UUID, status: str, notes: str | None) -> Watchlist:
        item = self.db.scalar(select(Watchlist).where(Watchlist.user_id == user_id, Watchlist.movie_id == movie_id))
        if item:
            item.status = status
            item.notes = notes
        else:
            item = Watchlist(user_id=user_id, movie_id=movie_id, status=status, notes=notes)
            self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, *, user_id: UUID, movie_id: UUID) -> bool:
        item = self.db.scalar(select(Watchlist).where(Watchlist.user_id == user_id, Watchlist.movie_id == movie_id))
        if not item:
            return False
        self.db.delete(item)
        self.db.commit()
        return True


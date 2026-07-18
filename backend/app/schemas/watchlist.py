from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.movie import MovieListItem


class WatchlistAddRequest(BaseModel):
    movie_id: UUID
    status: str = Field(default="saved", pattern="^(saved|favorite|watched)$")
    notes: str | None = Field(default=None, max_length=1000)


class WatchlistItemRead(BaseModel):
    id: UUID
    status: str
    notes: str | None = None
    movie: MovieListItem
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WatchlistResponse(BaseModel):
    items: list[WatchlistItemRead]


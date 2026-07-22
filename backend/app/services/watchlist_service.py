import datetime
import httpx
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.exceptions import not_found
from app.models.user import User
from app.models.movie import Movie
from app.repositories.movie_repository import MovieRepository
from app.repositories.watchlist_repository import WatchlistRepository
from app.schemas.watchlist import WatchlistAddRequest, WatchlistAddTmdbRequest, WatchlistResponse
from app.preprocessing.tag_builder import build_embedding_text, build_processed_tags


class WatchlistService:
    def __init__(self, db: Session):
        self.db = db
        self.movies = MovieRepository(db)
        self.watchlist = WatchlistRepository(db)

    def add(self, user: User, payload: WatchlistAddRequest) -> dict[str, str]:
        if not self.movies.get(payload.movie_id):
            raise not_found("Movie not found")
        self.watchlist.upsert(user_id=user.id, movie_id=payload.movie_id, status=payload.status, notes=payload.notes)
        return {"message": "Movie added to watchlist"}

    def add_tmdb(self, user: User, payload: WatchlistAddTmdbRequest) -> dict[str, str]:
        # 1. Check if movie already exists by tmdb_id
        db_movie = self.db.scalars(
            select(Movie).where(Movie.tmdb_id == payload.tmdb_id)
        ).first()

        if not db_movie:
            # 2. Fetch details from TMDB
            base_url = f"https://api.themoviedb.org/3/{payload.media_type}/{payload.tmdb_id}"
            headers = {"accept": "application/json"}
            if len(settings.tmdb_api_key) > 50:
                headers["Authorization"] = f"Bearer {settings.tmdb_api_key}"
                params = {}
            else:
                params = {"api_key": settings.tmdb_api_key}

            with httpx.Client() as client:
                try:
                    response = client.get(base_url, params=params, headers=headers, timeout=10.0)
                    response.raise_for_status()
                    tmdb_data = response.json()
                except Exception as e:
                    raise not_found(f"Failed to fetch metadata from TMDB: {str(e)}")

            # Extract fields
            title = tmdb_data.get("title") or tmdb_data.get("name") or ""
            original_title = tmdb_data.get("original_title") or tmdb_data.get("original_name") or ""
            overview = tmdb_data.get("overview") or ""
            tagline = tmdb_data.get("tagline") or ""
            genres = [g["name"] for g in tmdb_data.get("genres", []) if "name" in g]

            # Date parsing
            release_date_str = tmdb_data.get("release_date") or tmdb_data.get("first_air_date")
            release_date = None
            if release_date_str:
                try:
                    release_date = datetime.date.fromisoformat(release_date_str)
                except ValueError:
                    pass

            poster_path = tmdb_data.get("poster_path")
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
            backdrop_path = tmdb_data.get("backdrop_path")
            backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else None

            # Optional/placeholder fields for TV shows
            runtime = tmdb_data.get("runtime") or (tmdb_data.get("episode_run_time", [0])[0] if tmdb_data.get("episode_run_time") else 0)
            vote_average = tmdb_data.get("vote_average")

            processed_tags = build_processed_tags(
                overview,
                " ".join(genres),
                "",
                "",
                tagline,
                "",
            )
            embedding_text = build_embedding_text(
                title=title,
                overview=overview,
                tagline=tagline,
                genres=genres,
                cast=[],
                director="",
                production_companies=[],
                runtime=runtime,
                processed_tags=processed_tags,
            )

            # Insert into database
            db_movie = Movie(
                tmdb_id=payload.tmdb_id,
                title=title,
                original_title=original_title,
                overview=overview,
                tagline=tagline,
                genres=genres,
                cast=[],
                director="",
                production_companies=[],
                runtime=runtime,
                release_date=release_date,
                vote_average=vote_average,
                poster_url=poster_url,
                backdrop_url=backdrop_url,
                processed_tags=processed_tags,
                embedding_text=embedding_text
            )
            self.db.add(db_movie)
            self.db.commit()
            self.db.refresh(db_movie)

        # 3. Add/upsert watchlist
        self.watchlist.upsert(
            user_id=user.id,
            movie_id=db_movie.id,
            status=payload.status,
            notes=payload.notes
        )
        return {"message": f"{payload.media_type.capitalize()} added to watchlist"}

    def list(self, user: User) -> WatchlistResponse:
        return WatchlistResponse(items=self.watchlist.list_for_user(user.id))

    def delete(self, user: User, movie_id: UUID) -> dict[str, str]:
        deleted = self.watchlist.delete(user_id=user.id, movie_id=movie_id)
        if not deleted:
            raise not_found("Watchlist item not found")
        return {"message": "Movie removed from watchlist"}


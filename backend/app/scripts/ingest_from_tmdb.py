import argparse
import datetime
import sys
import httpx
from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
# Import all models to register them in SQLAlchemy registry
from app.db.base import Base, Movie, Watchlist, Recommendation, SearchHistory, User
from app.preprocessing.cleaner import clean_text
from app.preprocessing.tag_builder import build_embedding_text, build_processed_tags


def clean_movie_data(tmdb_data: dict) -> dict:
    title = tmdb_data.get("title") or tmdb_data.get("original_title") or ""
    original_title = tmdb_data.get("original_title") or ""
    overview = tmdb_data.get("overview") or ""
    tagline = tmdb_data.get("tagline") or ""

    # Extract genres
    genres = [g["name"] for g in tmdb_data.get("genres", []) if "name" in g]

    # Extract credits (cast & director)
    credits = tmdb_data.get("credits", {})
    cast = [c["name"] for c in credits.get("cast", []) if "name" in c][:12]

    director = None
    for crew_member in credits.get("crew", []):
        if crew_member.get("job") == "Director":
            director = crew_member.get("name")
            break

    # Extract production companies
    production_companies = [c["name"] for c in tmdb_data.get("production_companies", []) if "name" in c][:8]

    # Runtime and Release date
    runtime = tmdb_data.get("runtime")
    release_date_str = tmdb_data.get("release_date")
    release_date = None
    if release_date_str:
        try:
            release_date = datetime.date.fromisoformat(release_date_str)
        except ValueError:
            pass

    vote_average = tmdb_data.get("vote_average")

    # Fully-qualified image paths
    poster_path = tmdb_data.get("poster_path")
    poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
    backdrop_path = tmdb_data.get("backdrop_path")
    backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else None

    # Build tag string and embedding text block
    processed_tags = build_processed_tags(
        overview,
        " ".join(genres),
        " ".join(cast),
        director or "",
        tagline,
        " ".join(production_companies),
    )

    embedding_text = build_embedding_text(
        title=title,
        overview=overview,
        tagline=tagline,
        genres=genres,
        cast=cast,
        director=director,
        production_companies=production_companies,
        runtime=runtime,
        processed_tags=processed_tags,
    )

    return {
        "tmdb_id": tmdb_data["id"],
        "title": title,
        "original_title": original_title,
        "overview": overview,
        "tagline": tagline,
        "genres": genres,
        "cast": cast,
        "director": director,
        "production_companies": production_companies,
        "runtime": runtime,
        "release_date": release_date,
        "vote_average": vote_average,
        "poster_url": poster_url,
        "backdrop_url": backdrop_url,
        "processed_tags": processed_tags,
        "embedding_text": embedding_text,
    }


def ingest_from_tmdb(pages: int) -> None:
    api_key = settings.tmdb_api_key
    if not api_key:
        print("Error: TMDB_API_KEY is not configured in settings/environment variables.")
        sys.exit(1)

    base_url = "https://api.themoviedb.org/3"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    client = httpx.Client(timeout=30.0, headers=headers)

    print(f"Beginning ingestion from TMDB. Fetching top {pages * 20} popular movies...")

    total_added = 0
    total_updated = 0

    with SessionLocal() as db:
        for page in range(1, pages + 1):
            print(f"Fetching popular movies list page {page}/{pages}...")
            try:
                response = client.get(
                    f"{base_url}/movie/popular",
                    params={"api_key": api_key, "page": page}
                )
                response.raise_for_status()
                popular_data = response.json()
            except Exception as e:
                print(f"Failed to fetch popular list for page {page}: {e}")
                continue

            movie_results = popular_data.get("results", [])
            for index, list_item in enumerate(movie_results):
                movie_id = list_item.get("id")
                if not movie_id:
                    continue

                # Fetch detailed movie profile including cast/crew
                try:
                    detail_response = client.get(
                        f"{base_url}/movie/{movie_id}",
                        params={"api_key": api_key, "append_to_response": "credits"}
                    )
                    detail_response.raise_for_status()
                    detail_data = detail_response.json()
                except Exception as e:
                    print(f"Failed to fetch details for movie ID {movie_id}: {e}")
                    continue

                record = clean_movie_data(detail_data)

                # Upsert record database-agnostically
                db_movie = db.scalars(
                    select(Movie).where(Movie.tmdb_id == record["tmdb_id"])
                ).first()

                if db_movie:
                    for key, val in record.items():
                        setattr(db_movie, key, val)
                    total_updated += 1
                else:
                    db_movie = Movie(**record)
                    db.add(db_movie)
                    total_added += 1

            # Commit page results
            db.commit()
            print(f"Page {page} committed. Total Added: {total_added}, Total Updated: {total_updated}")

    print("TMDB Ingestion finished successfully.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest movies dynamically from TMDB API")
    parser.add_argument("--pages", type=int, default=25, help="Number of popular movie pages to fetch (20 movies/page)")
    args = parser.parse_args()
    ingest_from_tmdb(args.pages)


if __name__ == "__main__":
    main()

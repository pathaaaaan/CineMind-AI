from typing import Any

import pandas as pd

from app.preprocessing.normalizer import parse_name_list, split_words
from app.preprocessing.tag_builder import build_embedding_text, build_processed_tags


def normalize_movie_row(row: pd.Series) -> dict[str, Any]:
    genres = split_words(row.get("genres"))
    cast = split_words(row.get("cast"))[:12]
    production_companies = parse_name_list(row.get("production_companies"), limit=8)
    runtime = row.get("runtime")
    runtime_int = int(runtime) if pd.notna(runtime) else None
    processed_tags = build_processed_tags(
        row.get("overview"),
        row.get("genres"),
        row.get("cast"),
        row.get("director"),
        row.get("tagline"),
        row.get("production_companies"),
    )
    return {
        "tmdb_id": int(row["id"]) if pd.notna(row.get("id")) else None,
        "title": row.get("title") or row.get("original_title"),
        "original_title": row.get("original_title"),
        "overview": row.get("overview"),
        "tagline": row.get("tagline"),
        "genres": genres,
        "cast": cast,
        "director": row.get("director"),
        "production_companies": production_companies,
        "runtime": runtime_int,
        "release_date": row.get("release_date") if pd.notna(row.get("release_date")) else None,
        "vote_average": float(row["vote_average"]) if pd.notna(row.get("vote_average")) else None,
        "processed_tags": processed_tags,
        "embedding_text": build_embedding_text(
            title=str(row.get("title") or row.get("original_title")),
            overview=row.get("overview"),
            tagline=row.get("tagline"),
            genres=genres,
            cast=cast,
            director=row.get("director"),
            production_companies=production_companies,
            runtime=runtime_int,
            processed_tags=processed_tags,
        ),
    }


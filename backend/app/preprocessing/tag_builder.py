from app.preprocessing.cleaner import clean_text


def build_processed_tags(*parts: object) -> str:
    return clean_text(" ".join(str(part or "") for part in parts))


def build_embedding_text(
    *,
    title: str,
    overview: str | None,
    tagline: str | None,
    genres: list[str],
    cast: list[str],
    director: str | None,
    production_companies: list[str],
    runtime: int | None,
    processed_tags: str,
) -> str:
    return "\n".join(
        [
            f"Title: {title}",
            f"Tagline: {tagline or ''}",
            f"Overview: {overview or ''}",
            f"Genres: {', '.join(genres)}",
            f"Director: {director or ''}",
            f"Cast: {', '.join(cast)}",
            f"Production companies: {', '.join(production_companies)}",
            f"Runtime: {runtime or 'unknown'} minutes",
            f"Search tags: {processed_tags}",
        ]
    )


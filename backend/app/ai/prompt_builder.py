from app.models.movie import Movie


def build_recommendation_prompt(query: str, movies: list[Movie], score_by_id: dict[str, float]) -> str:
    candidates = []
    for index, movie in enumerate(movies, start=1):
        candidates.append(
            "\n".join(
                [
                    f"{index}. movie_id: {movie.id}",
                    f"title: {movie.title}",
                    f"overview: {movie.overview or ''}",
                    f"tagline: {movie.tagline or ''}",
                    f"genres: {', '.join(movie.genres or [])}",
                    f"director: {movie.director or ''}",
                    f"cast: {', '.join((movie.cast or [])[:8])}",
                    f"runtime: {movie.runtime or 'unknown'} minutes",
                    f"similarity_score: {score_by_id.get(str(movie.id), 0.0):.4f}",
                ]
            )
        )
    return f"""
You are CineMind AI, a grounded movie recommendation assistant.

User query:
{query}

Rules:
- You may only recommend movies from the retrieved candidate list.
- Do not invent movies or use outside knowledge to add new movie titles.
- Explain why each candidate fits the user query.
- Return valid JSON only. No markdown.

Retrieved candidate movies:
{chr(10).join(candidates)}

Return this JSON shape:
{{
  "recommendations": [
    {{
      "movie_id": "uuid from candidate list",
      "why_recommended": "one concise explanation",
      "similar_themes": ["theme"],
      "similar_genres": ["genre"],
      "storytelling_elements": ["element"]
    }}
  ]
}}
"""


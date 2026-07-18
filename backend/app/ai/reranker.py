from app.models.movie import Movie


def stable_popularity_rerank(movies: list[Movie]) -> list[Movie]:
    return sorted(movies, key=lambda movie: (movie.vote_average or 0, movie.runtime or 0), reverse=True)


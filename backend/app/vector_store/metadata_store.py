from uuid import UUID


def make_faiss_metadata(movie_ids: list[UUID]) -> dict[str, dict[str, str]]:
    return {str(index): {"movie_id": str(movie_id)} for index, movie_id in enumerate(movie_ids)}


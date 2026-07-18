from pathlib import Path

from sqlalchemy import select, update

from app.ai.embedding_model import EmbeddingModel
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.base import Base, Movie, Watchlist, Recommendation
from app.vector_store.index_builder import build_index


def main() -> None:
    with SessionLocal() as db:
        # Clear existing indexes to prevent UNIQUE constraint violations
        db.execute(update(Movie).values(faiss_index_id=None))
        db.flush()

        movies = list(db.scalars(select(Movie).where(Movie.embedding_text.is_not(None)).order_by(Movie.title)).all())
        documents = [movie.embedding_text or "" for movie in movies]
        embeddings = EmbeddingModel().encode_documents(documents)
        build_index(embeddings, [movie.id for movie in movies], Path(settings.faiss_index_path), Path(settings.faiss_metadata_path))
        for index, movie in enumerate(movies):
            movie.faiss_index_id = index
        db.commit()


if __name__ == "__main__":
    main()


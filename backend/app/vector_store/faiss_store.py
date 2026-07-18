import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from app.core.config import settings


@dataclass(frozen=True)
class VectorHit:
    movie_id: str
    score: float
    faiss_index_id: int


class FaissMovieStore:
    def __init__(self) -> None:
        self.index_path = Path(settings.faiss_index_path)
        self.metadata_path = Path(settings.faiss_metadata_path)
        self.index = None
        self.metadata: dict[str, dict[str, str]] = {}
        self._load()

    def _load(self) -> None:
        if self.index_path.exists():
            import faiss

            self.index = faiss.read_index(str(self.index_path))
        if self.metadata_path.exists():
            self.metadata = json.loads(self.metadata_path.read_text())

    def is_ready(self) -> bool:
        return self.index is not None and bool(self.metadata)

    def search(self, query_embedding: np.ndarray, top_k: int) -> list[VectorHit]:
        if not self.is_ready():
            return []
        scores, indexes = self.index.search(query_embedding, top_k)
        return self._to_hits(scores[0], indexes[0])

    def search_by_vector_id(self, faiss_index_id: int, top_k: int) -> list[VectorHit]:
        if not self.is_ready():
            return []
        import faiss

        vector = self.index.reconstruct(faiss_index_id).reshape(1, -1)
        scores, indexes = self.index.search(vector, top_k)
        return self._to_hits(scores[0], indexes[0])

    def _to_hits(self, scores: np.ndarray, indexes: np.ndarray) -> list[VectorHit]:
        hits: list[VectorHit] = []
        for score, index in zip(scores, indexes, strict=False):
            if index < 0:
                continue
            metadata = self.metadata.get(str(int(index)))
            if metadata and metadata.get("movie_id"):
                hits.append(VectorHit(movie_id=metadata["movie_id"], score=float(score), faiss_index_id=int(index)))
        return hits

from functools import lru_cache

import numpy as np


@lru_cache
def get_sentence_transformer():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("all-MiniLM-L6-v2")


class EmbeddingModel:
    def __init__(self) -> None:
        self.model = get_sentence_transformer()

    def encode_query(self, query: str) -> np.ndarray:
        embedding = self.model.encode([query], normalize_embeddings=True)
        return np.asarray(embedding, dtype="float32")

    def encode_documents(self, documents: list[str]) -> np.ndarray:
        embeddings = self.model.encode(documents, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
        return np.asarray(embeddings, dtype="float32")

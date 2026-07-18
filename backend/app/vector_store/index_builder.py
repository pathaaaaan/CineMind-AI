import json
from pathlib import Path
from uuid import UUID

import numpy as np


def build_index(embeddings: np.ndarray, movie_ids: list[UUID], index_path: Path, metadata_path: Path) -> None:
    if embeddings.ndim != 2:
        raise ValueError("Embeddings must be a 2D array")
    import faiss

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings.astype("float32"))

    index_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(index_path))
    metadata = {str(row): {"movie_id": str(movie_id)} for row, movie_id in enumerate(movie_ids)}
    metadata_path.write_text(json.dumps(metadata, indent=2))

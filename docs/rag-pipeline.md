# RAG Pipeline

Each movie is represented as one semantic document because the dataset rows are compact metadata records. The embedded text combines title, tagline, overview, genres, director, cast, production companies, runtime, and the cleaned tags reused from the notebook.

Retrieval uses normalized `all-MiniLM-L6-v2` embeddings with FAISS `IndexFlatIP`. FAISS stores vectors; PostgreSQL stores source-of-truth movie metadata. A JSON sidecar maps FAISS row IDs to movie UUIDs.

Gemini receives only retrieved candidates. The prompt explicitly forbids recommending movies outside the candidate list, and the backend validates the JSON response with Pydantic before returning it.


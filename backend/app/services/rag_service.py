from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.embedding_model import EmbeddingModel
from app.ai.gemini_client import GeminiClient
from app.ai.prompt_builder import build_recommendation_prompt
from app.models.user import User
from app.repositories.movie_repository import MovieRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.schemas.rag import (
    Explanation,
    RagRecommendationResponse,
    RagSearchRequest,
    RagSearchResponse,
    RagSearchResult,
    RecommendationItem,
)
from app.vector_store.faiss_store import FaissMovieStore


class RagService:
    def __init__(self, db: Session):
        self.movies = MovieRepository(db)
        self.recommendations = RecommendationRepository(db)
        self.embedding_model = EmbeddingModel()
        self.vector_store = FaissMovieStore()
        self.gemini = GeminiClient()

    def search(self, payload: RagSearchRequest, user: User | None = None) -> RagSearchResponse:
        query_embedding = self.embedding_model.encode_query(payload.query)
        retrieve_k = min(payload.top_k * 4, 100)
        hits = self.vector_store.search(query_embedding, top_k=retrieve_k)
        candidate_movies = self.movies.get_many([UUID(hit.movie_id) for hit in hits])
        candidate_movies = self.movies.apply_filters(candidate_movies, payload.filters)
        score_by_id = {hit.movie_id: hit.score for hit in hits}
        results = [
            RagSearchResult(movie=movie, similarity_score=score_by_id[str(movie.id)])
            for movie in candidate_movies[: payload.top_k]
        ]
        self.recommendations.create_search(
            user_id=user.id if user else None,
            query=payload.query,
            search_type="semantic",
            top_k=payload.top_k,
        )
        return RagSearchResponse(query=payload.query, results=results)

    def recommend(self, payload: RagSearchRequest, user: User | None = None) -> RagRecommendationResponse:
        query_embedding = self.embedding_model.encode_query(payload.query)
        hits = self.vector_store.search(query_embedding, top_k=min(payload.top_k * 4, 100))
        candidate_movies = self.movies.get_many([UUID(hit.movie_id) for hit in hits])
        candidate_movies = self.movies.apply_filters(candidate_movies, payload.filters)[: payload.top_k]
        score_by_id = {hit.movie_id: hit.score for hit in hits}

        search = self.recommendations.create_search(
            user_id=user.id if user else None,
            query=payload.query,
            search_type="rag",
            top_k=payload.top_k,
        )
        if not candidate_movies:
            return RagRecommendationResponse(query=payload.query, recommendations=[])

        prompt = build_recommendation_prompt(payload.query, candidate_movies, score_by_id)
        gemini_payload = self.gemini.generate_recommendations(prompt)
        explanation_by_id = {str(item.movie_id): item for item in gemini_payload.recommendations}

        response_items: list[RecommendationItem] = []
        for rank, movie in enumerate(candidate_movies, start=1):
            explanation = explanation_by_id.get(str(movie.id))
            if explanation:
                parsed = Explanation(
                    why_recommended=explanation.why_recommended,
                    similar_themes=explanation.similar_themes,
                    similar_genres=explanation.similar_genres,
                    storytelling_elements=explanation.storytelling_elements,
                )
            else:
                parsed = Explanation(
                    why_recommended=f"{movie.title} matched the semantic meaning of your request based on its overview, themes, genres, and creative metadata.",
                    similar_themes=[],
                    similar_genres=movie.genres or [],
                    storytelling_elements=[],
                )
            score = score_by_id.get(str(movie.id), 0.0)
            self.recommendations.create_recommendation(
                search_history_id=search.id,
                user_id=user.id if user else None,
                movie_id=movie.id,
                rank=rank,
                similarity_score=score,
                ai_explanation=parsed.why_recommended,
                similar_themes=parsed.similar_themes,
                similar_genres=parsed.similar_genres,
                storytelling_elements=parsed.storytelling_elements,
            )
            response_items.append(RecommendationItem(movie=movie, similarity_score=score, explanation=parsed))

        return RagRecommendationResponse(query=payload.query, recommendations=response_items)


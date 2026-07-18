import json

from google import genai
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.rag import GeminiRecommendationPayload


class GeminiClient:
    def __init__(self) -> None:
        self.enabled = bool(settings.gemini_api_key)
        self.client = genai.Client(api_key=settings.gemini_api_key) if self.enabled else None

    def generate_recommendations(self, prompt: str) -> GeminiRecommendationPayload:
        if not self.client:
            return GeminiRecommendationPayload(recommendations=[])

        try:
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            text = response.text or "{}"
            try:
                return GeminiRecommendationPayload.model_validate_json(text)
            except ValidationError:
                repaired = self._extract_json(text)
                return GeminiRecommendationPayload.model_validate(repaired)
        except Exception as e:
            print(f"Gemini generation failed: {e}")
            return GeminiRecommendationPayload(recommendations=[])

    @staticmethod
    def _extract_json(text: str) -> dict:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return {"recommendations": []}
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return {"recommendations": []}


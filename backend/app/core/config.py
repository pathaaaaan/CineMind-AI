from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


MIN_PRODUCTION_JWT_SECRET_LENGTH = 32
WEAK_JWT_SECRETS = {"change-me", "secret", "password", "development"}


class Settings(BaseSettings):
    app_name: str = "CineMind AI"
    environment: str = "development"
    database_url: str = "sqlite:///./cinemind.db"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    frontend_url: str = "http://localhost:5173"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    tmdb_api_key: str = ""
    faiss_index_path: str = "../data/faiss/movies.index"
    faiss_metadata_path: str = "../data/faiss/movie_metadata.json"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_production_configuration(self) -> "Settings":
        if self.environment.lower() != "production":
            return self

        errors: list[str] = []
        if self.database_url.startswith("sqlite"):
            errors.append("DATABASE_URL must use a production database, not SQLite")
        normalized_jwt_secret = self.jwt_secret_key.strip().lower()
        if (
            len(self.jwt_secret_key) < MIN_PRODUCTION_JWT_SECRET_LENGTH
            or normalized_jwt_secret in WEAK_JWT_SECRETS
            or normalized_jwt_secret.startswith(("replace-with-", "your-", "example-"))
        ):
            errors.append(
                "JWT_SECRET_KEY must be at least "
                f"{MIN_PRODUCTION_JWT_SECRET_LENGTH} characters and must not use a weak or example value"
            )
        if not self.frontend_url:
            errors.append("FRONTEND_URL must be configured")
        if not self.gemini_api_key or self.gemini_api_key.startswith("replace-with-"):
            errors.append("GEMINI_API_KEY must be configured")
        if not self.tmdb_api_key or self.tmdb_api_key.startswith("replace-with-"):
            errors.append("TMDB_API_KEY must be configured")

        if errors:
            raise ValueError("Invalid production configuration: " + "; ".join(errors))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

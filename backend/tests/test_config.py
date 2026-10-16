import pytest
from pydantic import ValidationError

from app.core.config import Settings


VALID_TEST_JWT_SECRET = "test-only-production-jwt-secret-2026!"


def build_settings(**overrides: str) -> Settings:
    values = {
        "_env_file": None,
        "database_url": "postgresql://user:password@localhost:5432/cinemind",
        "jwt_secret_key": VALID_TEST_JWT_SECRET,
        "frontend_url": "https://cinemind.example",
        "gemini_api_key": "gemini-test-key",
        "tmdb_api_key": "tmdb-test-key",
    }
    values.update(overrides)
    return Settings(**values)


def test_development_configuration_remains_valid_with_local_defaults() -> None:
    settings = Settings(_env_file=None, environment="development")

    assert settings.environment == "development"
    assert settings.database_url.startswith("sqlite")


def test_production_configuration_rejects_insecure_defaults() -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        build_settings(environment="production", jwt_secret_key="change-me")


@pytest.mark.parametrize(
    "jwt_secret_key",
    [
        "short",
        "a" * 31,
        "replace-with-a-long-random-development-secret",
        "your-production-secret-value",
        "password",
    ],
)
def test_production_configuration_rejects_weak_jwt_secrets(jwt_secret_key: str) -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        build_settings(environment="production", jwt_secret_key=jwt_secret_key)


def test_valid_production_configuration() -> None:
    settings = build_settings(environment="production", jwt_secret_key=VALID_TEST_JWT_SECRET)

    assert settings.environment == "production"
    assert settings.database_url.startswith("postgresql")

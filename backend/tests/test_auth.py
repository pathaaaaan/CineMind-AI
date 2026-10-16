from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from jose import jwt
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, hash_password
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import AuthService


def test_valid_registration_creates_user(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(
        id=uuid4(),
        email="person@example.com",
        username="viewer",
        full_name=None,
        avatar_url=None,
        created_at=datetime.now(UTC),
    )
    repository = Mock()
    repository.get_by_email.return_value = None
    repository.get_by_username.return_value = None
    repository.create.return_value = user
    monkeypatch.setattr("app.services.auth_service.UserRepository", lambda db: repository)

    response = AuthService(Mock()).register(
        RegisterRequest(email="person@example.com", username="viewer", password="StrongPass1")
    )

    assert response.email == "person@example.com"
    repository.create.assert_called_once()


@pytest.mark.parametrize("existing_lookup", ["get_by_email", "get_by_username"])
def test_registration_rejects_duplicate_identity(
    monkeypatch: pytest.MonkeyPatch, existing_lookup: str
) -> None:
    repository = Mock()
    repository.get_by_email.return_value = None
    repository.get_by_username.return_value = None
    getattr(repository, existing_lookup).return_value = SimpleNamespace()
    monkeypatch.setattr("app.services.auth_service.UserRepository", lambda db: repository)

    with pytest.raises(HTTPException) as error:
        AuthService(Mock()).register(
            RegisterRequest(email="person@example.com", username="viewer", password="StrongPass1")
        )

    assert error.value.status_code == 409


def test_registration_rolls_back_integrity_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    database = Mock()
    repository = Mock(db=database)
    repository.get_by_email.return_value = None
    repository.get_by_username.return_value = None
    repository.create.side_effect = IntegrityError("insert", {}, Exception("duplicate"))
    monkeypatch.setattr("app.services.auth_service.UserRepository", lambda db: repository)

    with pytest.raises(HTTPException) as error:
        AuthService(database).register(
            RegisterRequest(email="person@example.com", username="viewer", password="StrongPass1")
        )

    assert error.value.status_code == 409
    database.rollback.assert_called_once()


def test_valid_registration_normalizes_identity() -> None:
    request = RegisterRequest(
        email="Person@Example.com",
        username="Viewer",
        password="StrongPass1",
    )

    assert request.email == "person@example.com"
    assert request.username == "viewer"


def test_registration_rejects_invalid_email() -> None:
    with pytest.raises(ValueError):
        RegisterRequest(email="not-an-email", username="viewer", password="StrongPass1")


def test_registration_rejects_weak_password() -> None:
    with pytest.raises(ValueError):
        RegisterRequest(email="person@example.com", username="viewer", password="weakpassword")


def test_login_accepts_identifier_and_legacy_email_field() -> None:
    assert LoginRequest(identifier=" Viewer ", password="StrongPass1").identifier == "viewer"
    assert LoginRequest(email="Person@Example.com", password="StrongPass1").identifier == "person@example.com"


def test_jwt_contains_required_claims() -> None:
    user_id = uuid4()
    token = create_access_token(user_id)
    claims = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

    assert claims["sub"] == str(user_id)
    assert claims["exp"]
    assert claims["iat"]
    assert claims["jti"]
    assert decode_access_token(token) == str(user_id)


def test_expired_jwt_is_rejected() -> None:
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "exp": datetime.now(UTC) - timedelta(minutes=1),
            "iat": datetime.now(UTC) - timedelta(minutes=2),
            "jti": str(uuid4()),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    assert decode_access_token(token) is None


def test_unknown_and_wrong_password_use_same_login_error(monkeypatch: pytest.MonkeyPatch) -> None:
    repository = Mock()
    repository.get_by_email.return_value = None
    repository.get_by_username.return_value = None
    monkeypatch.setattr("app.services.auth_service.UserRepository", lambda db: repository)
    service = AuthService(Mock())

    with pytest.raises(HTTPException) as unknown_error:
        service.login(LoginRequest(identifier="unknown", password="StrongPass1"))

    user = SimpleNamespace(
        id=uuid4(),
        is_active=True,
        hashed_password=hash_password("DifferentPass1"),
    )
    repository.get_by_email.return_value = user
    with pytest.raises(HTTPException) as wrong_password_error:
        service.login(LoginRequest(identifier="person@example.com", password="StrongPass1"))

    assert unknown_error.value.status_code == 401
    assert wrong_password_error.value.status_code == 401
    assert unknown_error.value.detail == wrong_password_error.value.detail


def test_username_login_succeeds(monkeypatch: pytest.MonkeyPatch) -> None:
    now = datetime.now(UTC)
    user = User(
        id=uuid4(),
        email="person@example.com",
        username="viewer",
        hashed_password=hash_password("StrongPass1"),
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    repository = Mock()
    repository.get_by_email.return_value = None
    repository.get_by_username.return_value = user
    monkeypatch.setattr("app.services.auth_service.UserRepository", lambda db: repository)

    response = AuthService(Mock()).login(LoginRequest(identifier="viewer", password="StrongPass1"))

    assert response.user.username == "viewer"
    assert response.access_token


def test_inactive_user_cannot_login(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(
        id=uuid4(),
        is_active=False,
        hashed_password=hash_password("StrongPass1"),
    )
    repository = Mock()
    repository.get_by_email.return_value = user
    monkeypatch.setattr("app.services.auth_service.UserRepository", lambda db: repository)

    with pytest.raises(HTTPException) as error:
        AuthService(Mock()).login(LoginRequest(identifier="person@example.com", password="StrongPass1"))

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid email or password"


def test_malformed_subject_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.dependencies.decode_access_token", lambda token: "not-a-uuid")

    with pytest.raises(HTTPException) as error:
        get_current_user(
            credentials=SimpleNamespace(credentials="token"),
            db=Mock(),
        )

    assert error.value.status_code == 401


def test_missing_credentials_are_rejected() -> None:
    with pytest.raises(HTTPException) as error:
        get_current_user(credentials=None, db=Mock())

    assert error.value.status_code == 401


def test_active_user_is_returned_by_dependency(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(id=uuid4(), is_active=True)
    repository = Mock()
    repository.get_by_id.return_value = user
    monkeypatch.setattr("app.dependencies.UserRepository", lambda db: repository)
    monkeypatch.setattr("app.dependencies.decode_access_token", lambda token: str(user.id))

    assert get_current_user(
        credentials=SimpleNamespace(credentials="token"),
        db=Mock(),
    ) is user


def test_inactive_user_is_rejected_by_dependency(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(id=uuid4(), is_active=False)
    repository = Mock()
    repository.get_by_id.return_value = user
    monkeypatch.setattr("app.dependencies.UserRepository", lambda db: repository)
    monkeypatch.setattr("app.dependencies.decode_access_token", lambda token: str(user.id))

    with pytest.raises(HTTPException) as error:
        get_current_user(
            credentials=SimpleNamespace(credentials="token"),
            db=Mock(),
        )

    assert error.value.status_code == 401


def test_user_model_has_safe_role_and_active_defaults() -> None:
    assert User.__table__.c.role.default.arg == "user"
    assert User.__table__.c.role.server_default.arg == "user"
    assert User.__table__.c.is_active.default.arg is True

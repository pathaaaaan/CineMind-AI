from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import unauthorized
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise unauthorized()
    subject = decode_access_token(credentials.credentials)
    if not subject:
        raise unauthorized("Invalid or expired token")
    try:
        user = UserRepository(db).get_by_id(UUID(subject))
    except ValueError:
        raise unauthorized("Invalid or expired token") from None
    if not user:
        raise unauthorized("User no longer exists")
    if not user.is_active:
        raise unauthorized("User account is inactive")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    subject = decode_access_token(credentials.credentials)
    if not subject:
        raise unauthorized("Invalid or expired token")
    try:
        user = UserRepository(db).get_by_id(UUID(subject))
    except ValueError:
        raise unauthorized("Invalid or expired token") from None
    if not user:
        raise unauthorized("User no longer exists")
    if not user.is_active:
        raise unauthorized("User account is inactive")
    return user

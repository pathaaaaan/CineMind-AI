from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead


class AuthService:
    def __init__(self, db: Session):
        self.users = UserRepository(db)

    def register(self, payload: RegisterRequest) -> UserRead:
        if self.users.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        if self.users.get_by_username(payload.username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
        try:
            user = self.users.create(
                email=payload.email,
                username=payload.username,
                hashed_password=hash_password(payload.password),
                full_name=payload.full_name,
            )
            return UserRead.model_validate(user)
        except IntegrityError:
            self.users.db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unable to create account") from None

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(payload.identifier)
        if not user:
            user = self.users.get_by_username(payload.identifier)
        if not user or not user.is_active or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        return TokenResponse(access_token=create_access_token(user.id), user=UserRead.model_validate(user))

from pydantic import AliasChoices, BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return str(value).strip().lower()

    @field_validator("username", mode="after")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_policy(cls, value: str) -> str:
        if (
            not any(character.islower() for character in value)
            or not any(character.isupper() for character in value)
            or not any(character.isdigit() for character in value)
        ):
            raise ValueError("Password must contain uppercase, lowercase, and numeric characters")
        return value


class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=3,
        max_length=255,
        validation_alias=AliasChoices("identifier", "email"),
    )
    password: str = Field(min_length=8, max_length=128)

    @field_validator("identifier", mode="after")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main() -> None:
    with SessionLocal() as db:
        admin = User(
            email="admin@cinemind.local",
            username="admin",
            full_name="CineMind Admin",
            hashed_password=hash_password("ChangeMe123"),
        )
        db.add(admin)
        db.commit()


if __name__ == "__main__":
    main()


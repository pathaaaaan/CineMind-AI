import os

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main() -> None:
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_PASSWORD must be set when seeding an admin user")

    with SessionLocal() as db:
        admin = User(
            email="admin@cinemind.local",
            username="admin",
            full_name="CineMind Admin",
            hashed_password=hash_password(password),
            role="admin",
        )
        db.add(admin)
        db.commit()


if __name__ == "__main__":
    main()

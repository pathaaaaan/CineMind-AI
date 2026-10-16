"""add user auth state and case-insensitive identity indexes

Revision ID: 202610160001
Revises: 202607170001
Create Date: 2026-10-16
"""

from alembic import op
import sqlalchemy as sa


revision = "202610160001"
down_revision = "202607170001"
branch_labels = None
depends_on = None


def _assert_case_insensitive_identity_uniqueness() -> None:
    connection = op.get_bind()
    duplicate_email = connection.execute(
        sa.text(
            "SELECT lower(email) FROM users "
            "GROUP BY lower(email) HAVING count(*) > 1 LIMIT 1"
        )
    ).first()
    duplicate_username = connection.execute(
        sa.text(
            "SELECT lower(username) FROM users "
            "GROUP BY lower(username) HAVING count(*) > 1 LIMIT 1"
        )
    ).first()
    if duplicate_email or duplicate_username:
        raise RuntimeError(
            "Cannot add case-insensitive user identity constraints until duplicate "
            "email or username values are resolved"
        )


def upgrade() -> None:
    _assert_case_insensitive_identity_uniqueness()

    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
    )
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_check_constraint("ck_users_role", "users", "role IN ('user', 'admin')")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.create_index(
        "ix_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=True,
    )
    op.create_index(
        "ix_users_username_lower",
        "users",
        [sa.text("lower(username)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_username_lower", table_name="users")
    op.drop_index("ix_users_email_lower", table_name="users")
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_column("users", "is_active")
    op.drop_column("users", "role")

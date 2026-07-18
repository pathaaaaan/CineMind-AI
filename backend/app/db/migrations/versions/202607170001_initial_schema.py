"""initial schema

Revision ID: 202607170001
Revises:
Create Date: 2026-07-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202607170001"
down_revision = None
branch_labels = None
depends_on = None


def get_json_type():
    bind = op.get_bind()
    if bind and bind.dialect.name == "postgresql":
        return postgresql.JSONB()
    return sa.JSON()


def upgrade() -> None:
    json_t = get_json_type()
    bind = op.get_bind()

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "movies",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("tmdb_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("original_title", sa.String(length=255), nullable=True),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("tagline", sa.Text(), nullable=True),
        sa.Column("genres", json_t, nullable=True),
        sa.Column("cast", json_t, nullable=True),
        sa.Column("director", sa.String(length=255), nullable=True),
        sa.Column("production_companies", json_t, nullable=True),
        sa.Column("runtime", sa.Integer(), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("vote_average", sa.Float(), nullable=True),
        sa.Column("poster_url", sa.Text(), nullable=True),
        sa.Column("backdrop_url", sa.Text(), nullable=True),
        sa.Column("processed_tags", sa.Text(), nullable=True),
        sa.Column("embedding_text", sa.Text(), nullable=True),
        sa.Column("faiss_index_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_movies_tmdb_id", "movies", ["tmdb_id"], unique=True)
    op.create_index("ix_movies_title", "movies", ["title"])
    op.create_index("ix_movies_runtime", "movies", ["runtime"])
    op.create_index("ix_movies_release_date", "movies", ["release_date"])
    op.create_index("ix_movies_faiss_index_id", "movies", ["faiss_index_id"], unique=True)
    
    if bind and bind.dialect.name == "postgresql":
        op.create_index("ix_movies_genres_gin", "movies", ["genres"], postgresql_using="gin")

    op.create_table(
        "watchlists",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("movie_id", sa.UUID(as_uuid=True), sa.ForeignKey("movies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "movie_id", name="unique_user_movie"),
    )
    op.create_index("ix_watchlists_user_id", "watchlists", ["user_id"])
    op.create_index("ix_watchlists_movie_id", "watchlists", ["movie_id"])

    op.create_table(
        "search_history",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("search_type", sa.String(length=50), nullable=False),
        sa.Column("top_k", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_search_history_user_id", "search_history", ["user_id"])
    op.create_index("ix_search_history_created_at", "search_history", ["created_at"])

    op.create_table(
        "recommendations",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("search_history_id", sa.UUID(as_uuid=True), sa.ForeignKey("search_history.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("movie_id", sa.UUID(as_uuid=True), sa.ForeignKey("movies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("similarity_score", sa.Float(), nullable=True),
        sa.Column("ai_explanation", sa.Text(), nullable=True),
        sa.Column("similar_themes", json_t, nullable=True),
        sa.Column("similar_genres", json_t, nullable=True),
        sa.Column("storytelling_elements", json_t, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_recommendations_search_history_id", "recommendations", ["search_history_id"])
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_movie_id", "recommendations", ["movie_id"])


def downgrade() -> None:
    op.drop_table("recommendations")
    op.drop_table("search_history")
    op.drop_table("watchlists")
    op.drop_table("movies")
    op.drop_table("users")

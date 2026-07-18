from app.db.session import Base
from app.models.movie import Movie
from app.models.recommendation import Recommendation
from app.models.search_history import SearchHistory
from app.models.user import User
from app.models.watchlist import Watchlist

__all__ = ["Base", "Movie", "Recommendation", "SearchHistory", "User", "Watchlist"]


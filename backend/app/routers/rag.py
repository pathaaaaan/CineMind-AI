from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.db.session import get_db
from app.dependencies import get_optional_user
from app.models.user import User
from app.schemas.rag import RagRecommendationResponse, RagSearchRequest, RagSearchResponse
from app.services.rag_service import RagService


router = APIRouter()


@router.post("/search", response_model=RagSearchResponse)
@limiter.limit("30/minute")
def semantic_search(
    request: Request,
    payload: RagSearchRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> RagSearchResponse:
    return RagService(db).search(payload, current_user)


@router.post("/recommend", response_model=RagRecommendationResponse)
@limiter.limit("15/minute")
def rag_recommend(
    request: Request,
    payload: RagSearchRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> RagRecommendationResponse:
    return RagService(db).recommend(payload, current_user)


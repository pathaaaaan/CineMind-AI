from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardHistory, DashboardSummary
from app.services.dashboard_service import DashboardService


router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    return DashboardService(db).summary(current_user)


@router.get("/history", response_model=DashboardHistory)
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardHistory:
    return DashboardService(db).history(current_user)


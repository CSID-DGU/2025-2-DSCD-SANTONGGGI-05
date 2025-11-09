"""Statistics API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import StatisticsDashboardResponse
from app.services import StatisticsService

router = APIRouter(prefix="/statistics", tags=["statistics"])


def get_statistics_service() -> StatisticsService:
    return StatisticsService()


@router.get(
    "/dashboard",
    response_model=StatisticsDashboardResponse,
    status_code=status.HTTP_200_OK,
)
def get_statistics_dashboard(
    user_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
    service: StatisticsService = Depends(get_statistics_service),
) -> StatisticsDashboardResponse:
    return service.get_dashboard(db=db, user_id=user_id)

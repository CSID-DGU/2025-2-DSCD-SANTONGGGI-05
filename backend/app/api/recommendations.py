"""Recommendation endpoints used by custom recommendation modal."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models import (
    CustomRecommendationRequest,
    CustomRecommendationResponse,
)
from app.services import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def get_recommendation_service() -> RecommendationService:
    return RecommendationService()


@router.post(
    "/custom",
    response_model=CustomRecommendationResponse,
    summary="맞춤 추천 상품 조회",
)
async def create_custom_recommendations(
    payload: CustomRecommendationRequest,
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
) -> CustomRecommendationResponse:
    """Generate mock recommendations that match the requested preference."""

    return recommendation_service.generate_custom_recommendations(payload=payload)

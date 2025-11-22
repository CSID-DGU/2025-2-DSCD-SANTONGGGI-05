"""Recommendation endpoints used by custom recommendation modal."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.ai import AiOrchestrator
from app.models import (
    CustomRecommendationRequest,
    CustomRecommendationResponse,
)
from app.services import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def get_recommendation_service() -> RecommendationService:
    return RecommendationService()


def get_ai_orchestrator() -> AiOrchestrator:
    service = RecommendationService()
    return AiOrchestrator(recommendation_service=service)


@router.post(
    "/custom",
    response_model=CustomRecommendationResponse,
    summary="맞춤 추천 상품 조회",
)
async def create_custom_recommendations(
    payload: CustomRecommendationRequest,
    orchestrator: AiOrchestrator = Depends(get_ai_orchestrator),
) -> CustomRecommendationResponse:
    """Generate purchase-history powered recommendations."""
    items = orchestrator.generate_purchase_recommendations(user_id=payload.user_id, limit=5)
    return CustomRecommendationResponse(
        user_id=payload.user_id,
        recommendations=items,
    )

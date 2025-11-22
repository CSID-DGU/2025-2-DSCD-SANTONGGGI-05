"""Recommendation-related Pydantic models."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    """Single recommended product used by chat/custom APIs."""

    product_id: int
    name: str
    price: float
    platform_name: str
    category: str
    review: int
    image_url: str
    product_url: str


class CustomRecommendationRequest(BaseModel):
    """Payload for generating tailored recommendations."""

    user_id: int = Field(..., ge=1)


class CustomRecommendationResponse(BaseModel):
    """Response body for recommendation API."""

    user_id: int
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    recommendations: list[RecommendationItem]

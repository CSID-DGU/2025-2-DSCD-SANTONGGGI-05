"""Dataclasses describing orchestrated AI responses."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from app.models.recommendation import RecommendationItem


@dataclass
class AiOrchestratorResult:
    """Normalized response consumed by ChatService."""

    ai_message: str
    response_type: int
    recommendation_items: List[RecommendationItem] = field(default_factory=list)

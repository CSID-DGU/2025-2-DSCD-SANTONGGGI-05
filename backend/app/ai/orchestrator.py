"""High level orchestration between OpenAI + MCP tools + legacy fallbacks."""

from __future__ import annotations

import logging
from typing import List

from app.models.recommendation import RecommendationItem
from app.services.recommendation_service import RecommendationService

from .config import AiConfig, get_ai_config
from .mcp_client import build_purchase_toolset, build_search_toolset
from .openai_client import OpenAIChatClient, OpenAIErrorWrapper, safe_run
from .prompt_templates import (
    build_platform_search_prompt,
    build_purchase_prompt,
    build_smalltalk_prompt,
)
from .types import AiOrchestratorResult

logger = logging.getLogger(__name__)


class AiOrchestrator:
    """Entry point used by ChatService."""

    def __init__(
        self,
        *,
        config: AiConfig | None = None,
        openai_client: OpenAIChatClient | None = None,
        recommendation_service: RecommendationService | None = None,
    ) -> None:
        self._config = config or get_ai_config()
        self._client = openai_client or OpenAIChatClient(self._config)
        self._recommendation_service = recommendation_service or RecommendationService()

    def generate(self, *, user_id: int, message: str) -> AiOrchestratorResult:
        """Return orchestrated response. Falls back to mock logic if disabled."""
        if not self._client.is_configured:
            return self._fallback_response(message=message, user_id=user_id)

        if self._should_trigger_platform_search(message):
            try:
                return self._run_platform_search(message)
            except OpenAIErrorWrapper as exc:
                logger.warning("Platform search failed: %s", exc)

        if self._config.has_purchase_mcp:
            try:
                return self._run_purchase_recommendation(user_id=user_id, limit=6)
            except OpenAIErrorWrapper as exc:
                logger.warning("Purchase MCP failed: %s", exc)

        # Fallback to lightweight small talk.
        try:
            text = safe_run(
                self._client,
                prompt=build_smalltalk_prompt(message),
                expect_json=False,
            )
            if isinstance(text, str):
                return AiOrchestratorResult(ai_message=text, response_type=0)
        except OpenAIErrorWrapper as exc:
            logger.warning("Smalltalk prompt failed: %s", exc)

        return self._fallback_response(message=message, user_id=user_id)

    # ------------------------------------------------------------------ helpers

    def _run_purchase_recommendation(self, *, user_id: int, limit: int = 6) -> AiOrchestratorResult:
        prompt = build_purchase_prompt(user_id)
        tools = build_purchase_toolset(self._config)
        data = safe_run(self._client, prompt=prompt, tools=tools, expect_json=True)
        logger.info("Purchase MCP raw data: %s", data)
        items = self._map_purchase_recommendations(data, limit=limit)
        if not items:
            items = self._recommendation_service.generate_chat_recommendations(limit=limit)

        ai_message = data.get("ai_message") if isinstance(data, dict) else None
        if not ai_message:
            ai_message = "구매 이력을 기반으로 상품을 추천해드렸어요."

        return AiOrchestratorResult(
            ai_message=ai_message,
            response_type=1,
            recommendation_items=items[:limit],
        )

    def _run_platform_search(self, message: str) -> AiOrchestratorResult:
        prompt = build_platform_search_prompt(message)
        tools = build_search_toolset(self._config)
        data = safe_run(self._client, prompt=prompt, tools=tools, expect_json=True)

        ai_message = data.get("ai_message", "여러 플랫폼에서 인기 상품을 찾아봤어요.")

        items: list[RecommendationItem] = []
        for platform_key in ("elevenst", "naver"):
            raw_list = data.get(platform_key, []) if isinstance(data, dict) else []
            for idx, entry in enumerate(raw_list):
                mapped = self._map_to_recommendation(entry, platform_key, idx)
                if mapped:
                    items.append(mapped)

        return AiOrchestratorResult(
            ai_message=ai_message,
            response_type=1,
            recommendation_items=items[:6],
        )

    @staticmethod
    def _map_to_recommendation(data: dict, platform_key: str, idx: int) -> RecommendationItem | None:
        if not isinstance(data, dict):
            return None

        platform_name = data.get("platform_name") or ("11번가" if platform_key == "elevenst" else "네이버")
        name = data.get("name") or f"{platform_name} 추천 상품"
        price_raw = data.get("price")
        try:
            price = float(str(price_raw).replace(",", "")) if price_raw is not None else 0.0
        except ValueError:
            price = 0.0

        product_id = hash((platform_key, name, idx)) & 0xFFFFFFFF
        return RecommendationItem(
            product_id=product_id,
            name=name,
            price=price,
            platform_name=platform_name,
            category=data.get("category") or "기타",
            review=int(data.get("review", 0) or 0),
            image_url=data.get("image_url") or "",
            product_url=data.get("product_url") or "",
        )

    def _map_purchase_recommendations(self, payload: object, *, limit: int) -> list[RecommendationItem]:
        raw_items: list[dict] = []
        if isinstance(payload, dict):
            if isinstance(payload.get("recommendations"), list):
                raw_items = payload.get("recommendations", [])  # type: ignore[assignment]
            elif isinstance(payload.get("items"), list):
                raw_items = payload.get("items", [])  # type: ignore[assignment]
            elif isinstance(payload.get("data"), list):
                raw_items = payload.get("data", [])  # type: ignore[assignment]
        elif isinstance(payload, list):
            raw_items = payload

        mapped: list[RecommendationItem] = []
        for idx, item in enumerate(raw_items):
            if not isinstance(item, dict):
                continue
            converted = self._build_purchase_item(item, idx)
            if converted:
                mapped.append(converted)
            if len(mapped) >= limit:
                break
        return mapped

    @staticmethod
    def _build_purchase_item(data: dict, idx: int) -> RecommendationItem | None:
        name = data.get("product_name") or data.get("name") or f"추천 상품 {idx + 1}"
        platform_name = data.get("platform") or data.get("platform_name") or "쇼핑몰"
        category = data.get("category") or data.get("main_category") or "기타"
        product_url = data.get("product_url") or ""
        image_url = data.get("image_url") or ""
        price_raw = data.get("price")
        try:
            price = float(str(price_raw).replace(",", "")) if price_raw is not None else 0.0
        except ValueError:
            price = 0.0

        review_val = data.get("reviews") or data.get("review")
        try:
            review = int(review_val)
        except (TypeError, ValueError):
            review = 0

        product_id_val = data.get("product_id")
        try:
            product_id = int(product_id_val)
        except (TypeError, ValueError):
            product_id = hash((platform_name, name, idx)) & 0xFFFFFFFF

        return RecommendationItem(
            product_id=product_id,
            name=str(name),
            price=price,
            platform_name=str(platform_name),
            category=str(category),
            review=review,
            image_url=str(image_url),
            product_url=str(product_url),
        )

    def generate_purchase_recommendations(self, *, user_id: int, limit: int = 5) -> list[RecommendationItem]:
        """Expose purchase-based recommendations for other APIs."""
        try:
            result = self._run_purchase_recommendation(user_id=user_id, limit=limit)
            return result.recommendation_items[:limit]
        except OpenAIErrorWrapper as exc:
            logger.warning("Purchase recommendation failed: %s", exc)
            return self._recommendation_service.generate_chat_recommendations(limit=limit)

    @staticmethod
    def _should_trigger_platform_search(message: str) -> bool:
        lowered = message.lower()
        trigger_keywords = ("추천", "찾아줘", "어디서", "상품", "사고싶")
        return any(keyword in lowered for keyword in trigger_keywords)

    def _fallback_response(self, *, message: str, user_id: int) -> AiOrchestratorResult:
        """Use legacy heuristics when AI is disabled."""
        items: List[RecommendationItem] = []
        response_type = 0
        ai_message = "<데이터사이언스 캡스톤디자인> 현재 서비스 개발중입니다.."

        if self._should_trigger_platform_search(message):
            response_type = 1
            items = self._recommendation_service.generate_chat_recommendations(limit=6)
            ai_message = "요청하신 조건에 맞는 상품을 추천해드렸어요."
        elif "통계" in message:
            response_type = 2
            ai_message = "최근 결제 통계 이미지를 첨부해드렸어요."

        return AiOrchestratorResult(
            ai_message=ai_message,
            response_type=response_type,
            recommendation_items=items,
        )

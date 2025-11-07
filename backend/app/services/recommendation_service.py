"""Mock recommendation generation service for chat/custom flows."""

from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Final, Iterable

from app.models import (
    CustomRecommendationRequest,
    CustomRecommendationResponse,
    RecommendationItem,
)


class RecommendationService:
    """Generates deterministic yet varied recommendation payloads."""

    _MOCK_PRODUCTS: Final[list[dict]] = [
        {
            "product_id": 1001,
            "name": "제주 삼다수 2L 12입",
            "price": 12800,
            "platform_name": "쿠팡",
            "category": "생수",
            "review": 372,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/300x300ex/image/vendor_inventory/a282/35c1c93aac56ea944008e3db60f1b4a6f4ee9ef7ce8b7b3a8220da10bc94.jpg",
            "product_url": "https://www.coupang.com/vp/products/8157269417?itemId=20271971689&vendorItemId=86469811094&pickType=COU_PICK&q=%EC%82%BC%EB%8B%A4%EC%88%982L&searchId=b62b36781667928&sourceType=search&itemsCount=36&searchRank=1&rank=1&traceId=mhoo329m",
        },
        {
            "product_id": 1002,
            "name": "아이시스 8.0 2L 6입",
            "price": 8900,
            "platform_name": "네이버쇼핑",
            "category": "생수",
            "review": 215,
            "image_url": "https://images.unsplash.com/photo-1514996937319-344454492b37?w=640",
            "product_url": "https://search.shopping.naver.com/catalog/1002",
        },
        {
            "product_id": 1003,
            "name": "코카콜라 제로 355ml 24캔",
            "price": 18900,
            "platform_name": "11번가",
            "category": "음료",
            "review": 512,
            "image_url": "https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=640",
            "product_url": "https://www.11st.co.kr/products/1003",
        },
        {
            "product_id": 1004,
            "name": "트레비 스파클링 350ml 20병",
            "price": 15500,
            "platform_name": "위메프",
            "category": "음료",
            "review": 134,
            "image_url": "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=640",
            "product_url": "https://front.wemakeprice.com/deal/1004",
        },
        {
            "product_id": 1005,
            "name": "크린랩 주방세제 3개입",
            "price": 9200,
            "platform_name": "쿠팡",
            "category": "청소용품",
            "review": 301,
            "image_url": "https://images.unsplash.com/photo-1581574209461-7c6327dbb38a?w=640",
            "product_url": "https://www.coupang.com/vp/products/1005",
        },
        {
            "product_id": 1006,
            "name": "곰표 표백제 2L 2개",
            "price": 7600,
            "platform_name": "네이버쇼핑",
            "category": "청소용품",
            "review": 189,
            "image_url": "https://images.unsplash.com/photo-1600289031461-7f52d5b716a8?w=640",
            "product_url": "https://search.shopping.naver.com/catalog/1006",
        },
        {
            "product_id": 1007,
            "name": "크리넥스 수풀 휴지 30롤",
            "price": 23800,
            "platform_name": "11번가",
            "category": "생활용품",
            "review": 446,
            "image_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=640",
            "product_url": "https://www.11st.co.kr/products/1007",
        },
        {
            "product_id": 1008,
            "name": "레쓰비 카페라떼 175ml 30캔",
            "price": 15800,
            "platform_name": "쿠팡",
            "category": "음료",
            "review": 267,
            "image_url": "https://images.unsplash.com/photo-1459257868276-5e65389e2722?w=640",
            "product_url": "https://www.coupang.com/vp/products/1008",
        },
        {
            "product_id": 1009,
            "name": "CJ 햇반 210g 24개입",
            "price": 23400,
            "platform_name": "네이버쇼핑",
            "category": "식품",
            "review": 502,
            "image_url": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=640",
            "product_url": "https://search.shopping.naver.com/catalog/1009",
        },
        {
            "product_id": 1010,
            "name": "풀무원 두부 300g 4개입",
            "price": 11800,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 168,
            "image_url": "https://images.unsplash.com/photo-1506089617092-2f03e07b5c66?w=640",
            "product_url": "https://www.coupang.com/vp/products/1010",
        },
    ]

    def __init__(self, product_pool: Iterable[dict] | None = None) -> None:
        self._products = list(product_pool) if product_pool is not None else self._MOCK_PRODUCTS

    def generate_custom_recommendations(
        self,
        *,
        payload: CustomRecommendationRequest,
        limit: int = 5,
    ) -> CustomRecommendationResponse:
        """Return a deterministic sized list for the custom recommendation modal."""

        recommendations = self._pick_products(limit=limit)

        return CustomRecommendationResponse(
            user_id=payload.user_id,
            generated_at=datetime.now(timezone.utc),
            recommendations=recommendations,
        )

    def generate_chat_recommendations(self, *, limit: int = 6) -> list[RecommendationItem]:
        """Return items used by chat responses."""

        return self._pick_products(limit=limit)

    def _pick_products(self, *, limit: int) -> list[RecommendationItem]:
        if not self._products:
            return []

        pool = self._products
        if limit <= len(pool):
            selected = random.sample(pool, limit)
        else:  # pragma: no cover - defensive branch
            selected = random.choices(pool, k=limit)

        return [RecommendationItem(**product) for product in selected]

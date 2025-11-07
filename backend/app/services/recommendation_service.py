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
            "product_id": 2001,
            "name": "[다신샵] 당일제조 한스푼샐러드 든든 5팩세트(잠봉+케이준+불고기+쌀+콥)",
            "price": 26900,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 951,
            "image_url": "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTsQGe7ap1kI8P06JfjuSxRAoBOd_qWx8uv12XGbo4xZiu8C9arDqVPYJEhLFLBzxP6WYKxOkD-t_Gqs0udT5kiENVW4FXZXdsVn9zywi4WfoSFlGrpOSO11puHGwQH&usqp=CAc",
            "product_url": "https://www.coupang.com/vp/products/7664736887?itemId=20429463468&vendorItemId=85129516161&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2002,
            "name": "샐러드용 양배추와 적채 믹스, 300g, 1개, 2개",
            "price": 4950,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 24398,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_8xXqUWWCYlxZoFdOjQBmIkYRsZ5EVF3hSg&s",
            "product_url": "https://www.coupang.com/vp/products/1708123012?itemId=19224000687&vendorItemId=86340680470&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2003,
            "name": "팜에이트 무농약 인증 유러피안 샐러드 꾸러미, 450g, 1개입, 1개",
            "price": 8990,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 21294,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3EprZ4K3m6mBAa2ObUzQJYSp1bycjHeZVEg&s",
            "product_url": "https://www.coupang.com/vp/products/7385715280?itemId=23108573984&vendorItemId=90141838312&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2004,
            "name": "[믹스밀] 바로 데워먹는 야채찜 1kg, 1개",
            "price": 13340,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 211,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM7q7wnGy3_7EMkzYB2GtK4ZxKa_MwlKjncg&s",
            "product_url": "https://www.coupang.com/vp/products/6870116207?itemId=21136425021&vendorItemId=91474969084&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2005,
            "name": "눈꽃 양배추컷 샐러드 500g-당일채소 당일제조 낮12시전 당일발송, 1개, 500g",
            "price": 6990,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 152,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/f56d/8385fb2099a44bd54e4eec4c871b10becd83c0e41854cbb2b6b60cacb903.jpg",
            "product_url": "https://www.coupang.com/vp/products/8803118465?itemId=25635238637&vendorItemId=79936125374&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2006,
            "name": "코울슬로용 채소믹스, 250g, 2개, 250g",
            "price": 3860,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 8582,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/320x320ex/image/1025_amir_coupang_oct_80k/1530/ba0062e04536d81b2d38e6e8aa757d7899610f424d91b7e11c85911077d5.jpg",
            "product_url": "https://www.coupang.com/vp/products/7023651307?itemId=19224263445&vendorItemId=86340937453&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2007,
            "name": "팜에이트 스피니치 블렌드 샐러드채소, 300g, 1팩",
            "price": 4890,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 4840,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/320x320ex/image/rs_quotation_api/ldzivo9f/413a38b882e248bd80ef2a767e6a0ad6.jpg",
            "product_url": "https://www.coupang.com/vp/products/7576221257?itemId=19990392821&vendorItemId=87088289295&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2008,
            "name": "팜에이트 무농약 유러피안 샐러드 꾸러미, 800g, 1개입, 1개",
            "price": 12900,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 21294,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/320x320ex/image/retail/images/31520071317792-4ffabf71-8692-42c4-ab16-e04f7e276c3e.jpg",
            "product_url": "https://www.coupang.com/vp/products/7385715280?itemId=19084145509&vendorItemId=86206394187&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2009,
            "name": "전재료 100% 국내산 낮 12시 전 주문 당일발송 대용량 혼합 믹스 샐러드 1kg, 1박스, 혼합 믹스 1kg",
            "price": 12990,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 4132,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/320x320ex/image/vendor_inventory/3c8f/88490f968022964837008ec5a5db63178b357e5b97af10bf3e08a59cb23b.JPG",
            "product_url": "https://www.coupang.com/vp/products/9088778861?itemId=26707403232&vendorItemId=72410786453&sourceType=CATEGORY&categoryId=432384",
        },
        {
            "product_id": 2010,
            "name": "팜에이트 무농약 인증 유러피안 소프트 샐러드, 130g, 2개",
            "price": 8320,
            "platform_name": "쿠팡",
            "category": "식품",
            "review": 9080,
            "image_url": "https://thumbnail.coupangcdn.com/thumbnails/remote/320x320ex/image/retail/images/636587252921616-0aa08d1e-9ca8-4a2e-8c89-0780d811cfae.jpg",
            "product_url": "https://www.coupang.com/vp/products/1583541481?itemId=19272256176&vendorItemId=86387424817&sourceType=CATEGORY&categoryId=432384",
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

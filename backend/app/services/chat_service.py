"""채팅 비즈니스 로직을 임시로 처리하는 서비스 레이어."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from ..models import (
    ChatMessage,
    GetChatHistoryResponse,
    RecommendationItem,
    SendChatMessageRequest,
    SendChatMessageResponse,
)


class ChatService:
    """프론트엔드가 사용할 채팅 관련 기능을 담당한다."""

    def __init__(self) -> None:
        # 실제 구현 전까지는 인메모리 리스트를 사용해 더미 데이터를 관리한다.
        self._messages: List[ChatMessage] = [
            ChatMessage(
                id=1,
                user_id=1123,
                message="나 물 6개 사야 될 것 같아",
                ai_message="물 6개를 찾아드렸습니다...",
                timestamp=datetime(2025, 10, 17, 10, 30, tzinfo=timezone.utc),
            ),
            ChatMessage(
                id=2,
                user_id=1123,
                message="가장 저렴한 거 보여줘",
                ai_message="가장 저렴한 상품을 찾았습니다...",
                timestamp=datetime(2025, 10, 17, 10, 32, tzinfo=timezone.utc),
            ),
        ]
        self._id_counter = len(self._messages) + 1

    def get_history(self, user_id: Optional[int] = None) -> GetChatHistoryResponse:
        """사용자 ID로 필터링한 채팅 기록을 반환한다."""
        if user_id is not None:
            messages = [msg for msg in self._messages if msg.user_id == user_id]
        else:
            messages = list(self._messages)

        return GetChatHistoryResponse(messages=messages)

    def send_message(self, request: SendChatMessageRequest) -> SendChatMessageResponse:
        """들어온 메시지 내용을 바탕으로 간단한 응답과 추천을 생성한다."""
        now = datetime.now(tz=timezone.utc)

        recommendations: List[RecommendationItem] = []
        if "물" in request.message or "추천" in request.message:
            response_type = 1
            recommendations = [
                RecommendationItem(
                    product_id=501,
                    price=12000,
                    platform_name="쿠팡",
                    category="생수",
                    review=250,
                ),
                RecommendationItem(
                    product_id=502,
                    price=15000,
                    platform_name="네이버쇼핑",
                    category="생수",
                    review=180,
                ),
            ]
            ai_message = "요청하신 조건에 맞는 상품을 추천해드렸어요."
        elif "통계" in request.message:
            response_type = 2
            ai_message = "최근 결제 통계 이미지를 첨부해드렸어요."
        else:
            response_type = 0
            ai_message = "요청을 확인했습니다. 추가로 도와드릴 내용이 있을까요?"

        # 새 채팅 기록을 인메모리 리스트에 저장한다.
        chat_entry = ChatMessage(
            id=self._id_counter,
            user_id=request.user_id,
            message=request.message,
            ai_message=ai_message,
            timestamp=now,
        )
        self._id_counter += 1

        self._messages.append(chat_entry)

        return SendChatMessageResponse(
            user_id=request.user_id,
            ai_message=ai_message,
            type=response_type,
            recommendation_items=recommendations,
        )

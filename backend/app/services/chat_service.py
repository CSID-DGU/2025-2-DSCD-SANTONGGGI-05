"""채팅 비즈니스 로직을 처리하는 서비스 레이어."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ChatMessage as ChatMessageORM
from app.models import (
    ChatMessage,
    GetChatHistoryResponse,
    RecommendationItem,
    SendChatMessageRequest,
    SendChatMessageResponse,
)


class ChatService:
    """프론트엔드가 사용할 채팅 관련 기능을 담당한다."""

    def get_history(
        self,
        *,
        db: Session,
        user_id: Optional[int] = None,
    ) -> GetChatHistoryResponse:
        """사용자 ID로 필터링한 채팅 기록을 반환한다."""
        stmt = select(ChatMessageORM).order_by(ChatMessageORM.created_at.asc())
        if user_id is not None:
            stmt = stmt.filter(ChatMessageORM.user_id == user_id)

        results = db.execute(stmt).scalars().all()

        messages = [
            ChatMessage(
                id=record.id,
                user_id=record.user_id,
                message=record.message,
                ai_message=record.ai_message,
                timestamp=record.created_at,
            )
            for record in results
        ]

        return GetChatHistoryResponse(messages=messages)

    def send_message(
        self,
        *,
        db: Session,
        request: SendChatMessageRequest,
    ) -> SendChatMessageResponse:
        """들어온 메시지 내용을 바탕으로 간단한 응답과 추천을 생성한다."""
        now = datetime.now(tz=timezone.utc)

        recommendations: list[RecommendationItem] = []
        response_type = 0
        ai_message = "요청을 확인했습니다. 추가로 도와드릴 내용이 있을까요?"

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

        db_message = ChatMessageORM(
            user_id=request.user_id,
            message=request.message,
            ai_message=ai_message,
            response_type=response_type,
            statistics_image_url=None,
            created_at=now,
            updated_at=now,
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)

        return SendChatMessageResponse(
            user_id=request.user_id,
            ai_message=db_message.ai_message,
            type=db_message.response_type,
            recommendation_items=recommendations,
        )

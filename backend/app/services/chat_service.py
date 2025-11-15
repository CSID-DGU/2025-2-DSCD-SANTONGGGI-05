"""채팅 비즈니스 로직을 처리하는 서비스 레이어."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import AiOrchestrator
from app.ai.types import AiOrchestratorResult
from app.db.models import ChatMessage as ChatMessageORM
from app.models import (
    ChatMessage,
    GetChatHistoryResponse,
    RecommendationItem,
    SendChatMessageRequest,
    SendChatMessageResponse,
)
from app.services.recommendation_service import RecommendationService


class ChatService:
    """프론트엔드가 사용할 채팅 관련 기능을 담당한다."""

    def __init__(
        self,
        recommendation_service: RecommendationService | None = None,
        ai_orchestrator: AiOrchestrator | None = None,
    ) -> None:
        self._recommendation_service = recommendation_service or RecommendationService()
        self._ai_orchestrator = ai_orchestrator or AiOrchestrator(
            recommendation_service=self._recommendation_service
        )

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
        """들어온 메시지 내용을 바탕으로 AI 응답을 생성한다."""
        now = datetime.now(tz=timezone.utc)

        ai_result: AiOrchestratorResult = self._ai_orchestrator.generate(
            user_id=request.user_id,
            message=request.message,
        )

        recommendations: list[RecommendationItem] = ai_result.recommendation_items
        response_type = ai_result.response_type
        ai_message = ai_result.ai_message

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

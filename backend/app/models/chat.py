"""채팅 API에서 사용하는 Pydantic 모델 정의."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.recommendation import RecommendationItem


class SendChatMessageRequest(BaseModel):
    """프론트엔드가 메시지를 전송할 때 사용하는 요청 스키마."""

    user_id: int
    message: str


class SendChatMessageResponse(BaseModel):
    """메시지 처리 후 프론트엔드로 돌려주는 응답 스키마."""

    model_config = ConfigDict(populate_by_name=True)

    user_id: int
    ai_message: str
    type: int
    recommendation_items: list[RecommendationItem] = Field(
        default_factory=list,
        alias="recommendationItems",
    )


class ChatMessage(BaseModel):
    """채팅 기록에 저장되는 단일 메시지 교환 정보."""

    id: int
    user_id: int
    message: str
    ai_message: str
    timestamp: datetime


class GetChatHistoryResponse(BaseModel):
    """채팅 기록 전체를 리스트 형태로 감싸서 반환한다."""

    messages: list[ChatMessage]

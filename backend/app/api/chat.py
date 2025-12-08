"""채팅 관련 FastAPI 라우터 정의."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    GetChatHistoryResponse,
    SendChatMessageRequest,
    SendChatMessageResponse,
)
from app.services import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_service() -> ChatService:
    """ChatService 인스턴스를 FastAPI 의존성으로 주입한다."""
    return ChatService()


@router.get(
    "/history",
    response_model=GetChatHistoryResponse,
    summary="채팅 기록 조회",
)
async def get_chat_history(
    user_id: int | None = Query(None, description="조회할 사용자 ID"),
    db: Session = Depends(get_db),
    chat_service: ChatService = Depends(get_chat_service),
) -> GetChatHistoryResponse:
    """사용자 ID 기준으로 채팅 기록을 반환한다."""
    return chat_service.get_history(db=db, user_id=user_id)


@router.post(
    "/messages",
    response_model=SendChatMessageResponse,
    summary="채팅 메시지 전송",
)
async def send_chat_message(
    payload: SendChatMessageRequest,
    db: Session = Depends(get_db),
    chat_service: ChatService = Depends(get_chat_service),
) -> dict:
    """사용자가 보낸 메시지를 처리하고 AI 응답을 돌려준다."""
    response = chat_service.send_message(db=db, request=payload)
    return response.model_dump(by_alias=True)

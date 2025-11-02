"""채팅 관련 FastAPI 라우터 정의."""

from fastapi import APIRouter, Depends, Query

from ..models import (
    GetChatHistoryResponse,
    SendChatMessageRequest,
    SendChatMessageResponse,
)
from ..services import ChatService

# /api/chat 하위의 엔드포인트를 모아 관리한다.
router = APIRouter(prefix="/chat", tags=["chat"])

# 간단한 목업 서비스 인스턴스를 미리 만들어 두고 재사용한다.
_chat_service = ChatService()


def get_chat_service() -> ChatService:
    """ChatService 인스턴스를 FastAPI 의존성으로 주입한다."""
    # 추후에는 DI 컨테이너나 실제 서비스 객체 생성 로직으로 교체할 수 있다.
    return _chat_service


@router.get(
    "/history",
    response_model=GetChatHistoryResponse,
    summary="채팅 기록 조회",
)
async def get_chat_history(
    user_id: int | None = Query(None, description="조회할 사용자 ID"),
    chat_service: ChatService = Depends(get_chat_service),
) -> GetChatHistoryResponse:
    """사용자 ID 기준으로 채팅 기록을 반환한다."""
    return chat_service.get_history(user_id=user_id)


@router.post(
    "/messages",
    response_model=SendChatMessageResponse,
    summary="채팅 메시지 전송",
)
async def send_chat_message(
    payload: SendChatMessageRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> dict:
    """사용자가 보낸 메시지를 처리하고 AI 응답을 돌려준다."""
    response = chat_service.send_message(payload)
    return response.model_dump(by_alias=True)

"""FastAPI 애플리케이션 초기 설정을 담당하는 모듈."""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.chat import router as chat_router
from .api.auth import router as auth_router
from .api.cart import router as cart_router
from .api.recommendations import router as recommendations_router
from .api.statistics import router as statistics_router
from .api.purchase_history import router as purchase_history_router
from .core.database import init_db


RUN_INIT_DB = os.getenv("RUN_INIT_DB", "").lower() == "true"


def create_app() -> FastAPI:
    """FastAPI 인스턴스를 생성하고 공통 설정을 적용한다."""
    app = FastAPI(
        title="Shopping Assistant Backend",
        version="0.1.0",
        description=(
            "프론트엔드 연동 테스트용 백엔드 뼈대입니다. "
            "현재는 목업 데이터를 반환하며 차후 실제 로직으로 교체할 수 있습니다."
        ),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api")
    app.include_router(chat_router, prefix="/api")
    app.include_router(cart_router, prefix="/api")
    app.include_router(recommendations_router, prefix="/api")
    app.include_router(statistics_router, prefix="/api")
    app.include_router(purchase_history_router, prefix="/api")

    if RUN_INIT_DB:
        init_db()

    return app


app = create_app()


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """배포/모니터링 도구가 서버 상태를 확인할 때 사용하는 헬스 체크."""
    return {"status": "ok"}

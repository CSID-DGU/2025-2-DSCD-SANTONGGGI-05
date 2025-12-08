"""Authentication related API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserOut,
    default_tokens,
)
from app.services import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service() -> AuthService:
    return AuthService()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> RegisterResponse:
    try:
        user = auth_service.create_user(
            db=db,
            phone_number=payload.phone_number,
            password=payload.password,
            name=payload.name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    tokens = default_tokens()
    return RegisterResponse(user=UserOut.model_validate(user), tokens=tokens)


@router.post("/login", response_model=LoginResponse)
def login_user(
    payload: LoginRequest,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    user = auth_service.authenticate_user(
        db=db,
        phone_number=payload.phone_number,
        password=payload.password,
    )

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="전화번호 또는 비밀번호가 올바르지 않습니다.")

    tokens = default_tokens()
    return LoginResponse(user=UserOut.model_validate(user), tokens=tokens)

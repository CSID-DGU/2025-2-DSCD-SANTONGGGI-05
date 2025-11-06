"""Cart related API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    AddCartItemRequest,
    CartListResponse,
    CartOperationResult,
)
from app.services import CartService

router = APIRouter(prefix="/cart", tags=["cart"])


def get_cart_service() -> CartService:
    return CartService()


@router.get("", response_model=CartListResponse)
async def list_cart_items(
    user_id: int = Query(..., description="장바구니를 조회할 사용자 ID"),
    db: Session = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
) -> CartListResponse:
    try:
        return cart_service.list_items(db=db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/items", response_model=CartOperationResult, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    payload: AddCartItemRequest,
    db: Session = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
) -> CartOperationResult:
    try:
        return cart_service.add_item(db=db, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/items/{product_id}", response_model=CartOperationResult)
async def remove_cart_item(
    product_id: int,
    user_id: int = Query(..., description="장바구니를 소유한 사용자 ID"),
    db: Session = Depends(get_db),
    cart_service: CartService = Depends(get_cart_service),
) -> CartOperationResult:
    try:
        return cart_service.remove_item(db=db, user_id=user_id, product_id=product_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


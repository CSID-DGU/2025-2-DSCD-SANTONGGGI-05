"""Purchase history API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    CheckoutRequest,
    CheckoutResponse,
    PurchaseHistoryResponse,
)
from app.services import PurchaseHistoryService

router = APIRouter(prefix="/purchase-history", tags=["purchase-history"])


def get_service() -> PurchaseHistoryService:
    return PurchaseHistoryService()


@router.get("", response_model=PurchaseHistoryResponse)
def list_purchase_history(
    user_id: int = Query(..., ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db),
    service: PurchaseHistoryService = Depends(get_service),
) -> PurchaseHistoryResponse:
    try:
        offset = (page - 1) * page_size
        return service.list_history(
            db=db,
            user_id=user_id,
            limit=page_size,
            offset=offset,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    service: PurchaseHistoryService = Depends(get_service),
) -> CheckoutResponse:
    try:
        return service.checkout(db=db, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

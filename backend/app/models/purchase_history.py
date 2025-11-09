"""Pydantic models for purchase history APIs."""

from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class PurchaseItemOut(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int] = None
    date: date
    name: Optional[str] = None
    platform_name: str
    price: float
    category: Optional[str] = None
    image_url: Optional[str] = None
    product_url: Optional[str] = None

    model_config = {"from_attributes": True}


class PurchaseHistorySummary(BaseModel):
    total_orders: int
    total_spent: float
    total_items: int
    average_order_value: float


class PurchaseHistoryResponse(BaseModel):
    user_id: int
    purchases: list[PurchaseItemOut]
    summary: PurchaseHistorySummary


class CheckoutRequest(BaseModel):
    user_id: int
    product_ids: list[int] = Field(default_factory=list)


class CheckoutResponse(BaseModel):
    success: bool
    purchased: list[PurchaseItemOut]

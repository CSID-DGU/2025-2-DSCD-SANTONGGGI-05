"""Pydantic schemas for cart API responses and requests."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CartItemOut(BaseModel):
    """Single cart item as exposed via the API."""

    product_id: int
    user_id: int
    name: str | None = None
    platform_name: str
    price: float
    image_url: str = Field(alias="imageUrl")
    product_url: str = Field(alias="productUrl")
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
    }


class CartListResponse(BaseModel):
    """Wraps cart items list for API responses."""

    items: list[CartItemOut]


class AddCartItemRequest(BaseModel):
    """Incoming payload for creating or updating a cart item."""

    user_id: int
    product_id: int
    name: str | None = None
    platform_name: str
    price: float
    image_url: str = Field(alias="imageUrl")
    product_url: str = Field(alias="productUrl")


class CartOperationResult(BaseModel):
    """Standard response body for cart mutations."""

    success: bool
    message: str
    item: CartItemOut | None = None

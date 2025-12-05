"""Service layer for purchase history operations."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Iterable, Sequence

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.db.models import CartItem, PurchaseHistory, Product, User
from app.models import (
    CheckoutRequest,
    CheckoutResponse,
    PurchaseHistoryResponse,
    PurchaseHistorySummary,
    PurchaseItemOut,
)


class PurchaseHistoryService:

    def list_history(
        self,
        *,
        db: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> PurchaseHistoryResponse:
        self._ensure_user(db, user_id)

        stmt: Select[PurchaseHistory] = (
            select(PurchaseHistory)
            .where(PurchaseHistory.user_id == user_id)
            .order_by(PurchaseHistory.date.desc(), PurchaseHistory.id.desc())
            .offset(offset)
            .limit(limit)
        )
        purchases: Sequence[PurchaseHistory] = db.scalars(stmt).all()

        total_orders = db.scalar(
            select(func.count()).where(PurchaseHistory.user_id == user_id)
        ) or 0
        total_spent = db.scalar(
            select(func.coalesce(func.sum(PurchaseHistory.price), 0)).where(
                PurchaseHistory.user_id == user_id
            )
        ) or 0

        total_items = len(purchases)
        avg_order = float(total_spent / total_orders) if total_orders else 0.0

        return PurchaseHistoryResponse(
            user_id=user_id,
            purchases=[PurchaseItemOut.model_validate(record) for record in purchases],
            summary=PurchaseHistorySummary(
                total_orders=total_orders,
                total_spent=float(total_spent),
                total_items=total_items,
                average_order_value=avg_order,
            ),
        )

    def checkout(self, *, db: Session, payload: CheckoutRequest) -> CheckoutResponse:
        self._ensure_user(db, payload.user_id)

        cart_stmt = select(CartItem).where(CartItem.user_id == payload.user_id)
        if payload.product_ids:
            cart_stmt = cart_stmt.where(CartItem.product_id.in_(payload.product_ids))

        cart_items: list[CartItem] = db.scalars(cart_stmt).all()
        if not cart_items:
            raise ValueError("장바구니에서 구매할 상품을 찾을 수 없습니다.")

        purchased_rows: list[PurchaseHistory] = []
        now = datetime.now(timezone.utc)

        for item in cart_items:
            category = item.category
            unit_volume = None
            unit_price = None
            small_category = None
            review = 0
            rating = None

            if item.product_id:
                product = db.get(Product, item.product_id)
                if product:
                    if not category:
                        category = getattr(product, "category", None)
                    unit_volume = getattr(product, "unit_volume", None)
                    unit_price = getattr(product, "unit_price", None)
                    small_category = getattr(product, "small_category", None)
                    review = getattr(product, "review", 0)
                    rating = getattr(product, "rating", None)

            history = PurchaseHistory(
                user_id=item.user_id,
                product_id=item.product_id,
                date=now,
                name=item.name,
                platform_name=item.platform_name,
                price=item.price,
                category=category,
                image_url=item.image_url,
                product_url=item.product_url,
                unit_volume=unit_volume,
                unit_price=unit_price,
                small_category=small_category,
                review=review,
                rating=rating,
                quantity=item.quantity,
                created_at=now,
            )
            db.add(history)
            purchased_rows.append(history)
            db.delete(item)

        db.commit()

        purchases = [PurchaseItemOut.model_validate(row) for row in purchased_rows]
        return CheckoutResponse(success=True, purchased=purchases)

    @staticmethod
    def _ensure_user(db: Session, user_id: int) -> None:
        exists = db.scalar(select(User.id).where(User.id == user_id))
        if exists is None:
            raise ValueError("사용자를 찾을 수 없습니다.")

"""Service layer for cart operations."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import CartItem as CartItemORM
from app.db.models import User
from app.models import (
    AddCartItemRequest,
    CartItemOut,
    CartListResponse,
    CartOperationResult,
)


class CartService:
    """Encapsulates cart business rules."""

    def list_items(self, *, db: Session, user_id: int) -> CartListResponse:
        """Return all cart items for a user ordered by creation time."""

        stmt = (
            select(CartItemORM)
            .where(CartItemORM.user_id == user_id)
            .order_by(CartItemORM.created_at.asc())
        )
        results = db.execute(stmt).scalars().all()

        items = [CartItemOut.model_validate(row) for row in results]
        return CartListResponse(items=items)

    def add_item(self, *, db: Session, payload: AddCartItemRequest) -> CartOperationResult:
        """Insert or update a cart item for a user."""

        self._ensure_user_exists(db=db, user_id=payload.user_id)

        image_url = payload.image_url.strip()
        product_url = payload.product_url.strip()
        if not image_url:
            raise ValueError("상품 이미지 URL이 필요합니다.")
        if not product_url:
            raise ValueError("상품 상세 URL이 필요합니다.")

        cart_key = (payload.product_id, payload.user_id)
        instance = db.get(CartItemORM, cart_key)
        is_new = False

        if instance is None:
            instance = CartItemORM(
                product_id=payload.product_id,
                user_id=payload.user_id,
                name=payload.name,
                platform_name=payload.platform_name,
                category=payload.category,
                price=payload.price,
                image_url=image_url,
                product_url=product_url,
            )
            db.add(instance)
            is_new = True
        else:
            if payload.name is not None:
                instance.name = payload.name
            instance.platform_name = payload.platform_name
            if payload.category is not None:
                instance.category = payload.category
            instance.price = payload.price
            instance.image_url = image_url
            instance.product_url = product_url

        try:
            db.commit()
        except IntegrityError as exc:  # pragma: no cover - defensive
            db.rollback()
            raise ValueError("장바구니 항목을 저장할 수 없습니다.") from exc

        db.refresh(instance)
        item = CartItemOut.model_validate(instance)
        message = "장바구니에 항목이 추가되었습니다." if is_new else "장바구니 항목이 업데이트되었습니다."
        return CartOperationResult(success=True, message=message, item=item)

    def remove_item(self, *, db: Session, user_id: int, product_id: int) -> CartOperationResult:
        """Delete cart item for a user. Raises if not found."""

        instance = db.get(CartItemORM, (product_id, user_id))
        if instance is None:
            raise ValueError("장바구니에서 해당 상품을 찾을 수 없습니다.")

        db.delete(instance)
        db.commit()

        return CartOperationResult(success=True, message="장바구니에서 삭제되었습니다.")

    @staticmethod
    def _ensure_user_exists(*, db: Session, user_id: int) -> None:
        exists = db.execute(select(User.id).where(User.id == user_id)).scalar_one_or_none()
        if exists is None:
            raise ValueError("사용자를 찾을 수 없습니다.")

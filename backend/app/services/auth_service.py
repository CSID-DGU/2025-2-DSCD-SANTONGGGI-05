"""Service layer for authentication operations."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User


class AuthService:
    """Provides basic user registration and authentication without JWT."""

    def create_user(
        self,
        *,
        db: Session,
        phone_number: str,
        password: str,
        name: str,
    ) -> User:
        existing = db.execute(
            select(User).where(User.number == phone_number)
        ).scalar_one_or_none()
        if existing is not None:
            raise ValueError("이미 등록된 전화번호입니다.")

        user = User(number=phone_number, password=password, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def authenticate_user(
        self,
        *,
        db: Session,
        phone_number: str,
        password: str,
    ) -> Optional[User]:
        user = db.execute(
            select(User).where(User.number == phone_number)
        ).scalar_one_or_none()

        if user is None:
            return None

        if user.password != password:
            return None

        return user

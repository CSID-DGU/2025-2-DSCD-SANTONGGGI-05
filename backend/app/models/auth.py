"""Pydantic models for authentication endpoints."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
    id: int
    phone_number: str = Field(..., alias="number")
    name: str


class RegisterRequest(BaseModel):
    phone_number: str
    password: str
    name: str


class RegisterResponse(BaseModel):
    user: UserOut
    tokens: "AuthTokens"


class LoginRequest(BaseModel):
    phone_number: str
    password: str


class LoginResponse(BaseModel):
    user: UserOut
    tokens: "AuthTokens"


class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: str
    expiresAt: datetime


def default_tokens() -> AuthTokens:
    """Generate placeholder tokens without real JWT logic."""
    expires = datetime.now(timezone.utc)
    return AuthTokens(
        accessToken="mock-access-token",
        refreshToken="mock-refresh-token",
        expiresAt=expires,
    )

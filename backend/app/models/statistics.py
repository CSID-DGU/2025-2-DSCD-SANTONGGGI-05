"""Pydantic schemas for statistics API responses."""

from __future__ import annotations

from pydantic import BaseModel


class PieDatum(BaseModel):
    id: str
    label: str
    value: float


class LinePoint(BaseModel):
    x: str
    y: float


class LineSeries(BaseModel):
    id: str
    data: list[LinePoint]


class StatisticsSummary(BaseModel):
    total_spent: float
    total_orders: int
    average_order_value: float
    most_purchased_category: str | None = None
    most_used_platform: str | None = None


class CategoryStatistics(BaseModel):
    share: list[PieDatum]
    monthly_trend: list[LineSeries]


class PlatformStatistics(BaseModel):
    ratio: list[PieDatum]
    monthly_trend: list[LineSeries]


class PatternStatistics(BaseModel):
    hourly_trend: list[LineSeries]
    monthly_total: list[LineSeries]


class StatisticsDashboardResponse(BaseModel):
    user_id: int
    summary: StatisticsSummary
    category: CategoryStatistics
    platform: PlatformStatistics
    pattern: PatternStatistics

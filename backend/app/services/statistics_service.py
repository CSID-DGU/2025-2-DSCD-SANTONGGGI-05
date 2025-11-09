"""Service layer that aggregates purchase history into statistics charts."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import PurchaseHistory
from app.models import (
    CategoryStatistics,
    LinePoint,
    LineSeries,
    PatternStatistics,
    PieDatum,
    PlatformStatistics,
    StatisticsDashboardResponse,
    StatisticsSummary,
)


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _month_key(value: str | date | datetime | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
    elif isinstance(value, datetime):
        parsed = value
    else:  # date
        parsed = datetime.combine(value, datetime.min.time())
    return parsed.strftime("%Y-%m")


def _hour_key(value: str | date | datetime | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
    elif isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.combine(value, datetime.min.time())
    return f"{parsed.hour}시"


class StatisticsService:
    """Aggregates purchase history into dashboard friendly structures."""

    def get_dashboard(self, *, db: Session, user_id: int) -> StatisticsDashboardResponse:
        records = self._fetch_records(db=db, user_id=user_id)

        summary = self._build_summary(records)
        category_stats = self._build_category_stats(records)
        platform_stats = self._build_platform_stats(records)
        pattern_stats = self._build_pattern_stats(records)

        return StatisticsDashboardResponse(
            user_id=user_id,
            summary=summary,
            category=category_stats,
            platform=platform_stats,
            pattern=pattern_stats,
        )

    def _fetch_records(self, *, db: Session, user_id: int) -> list[dict]:
        stmt = (
            select(PurchaseHistory)
            .where(PurchaseHistory.user_id == user_id)
            .order_by(PurchaseHistory.date.asc(), PurchaseHistory.id.asc())
        )
        rows: Iterable[PurchaseHistory] = db.scalars(stmt)
        records: list[dict] = []
        for row in rows:
            price = _safe_float(row.price)
            purchase_date = row.date.isoformat() if isinstance(row.date, date) else str(row.date)
            records.append(
                {
                    "category": row.category or "기타",
                    "platform": row.platform_name or "기타",
                    "price": price,
                    "quantity": 1,
                    "total_price": price,
                    "purchase_date": purchase_date,
                }
            )
        return records

    def _build_summary(self, records: list[dict]) -> StatisticsSummary:
        total_spent = sum(_safe_float(r.get("total_price")) for r in records)
        total_orders = len(records)
        average_order_value = total_spent / total_orders if total_orders else 0.0

        category_counter = Counter()
        platform_counter = Counter()
        for r in records:
            category_counter[r.get("category") or "기타"] += _safe_float(r.get("total_price"))
            platform_counter[r.get("platform") or "기타"] += _safe_float(r.get("total_price"))

        most_category = category_counter.most_common(1)
        most_platform = platform_counter.most_common(1)

        return StatisticsSummary(
            total_spent=round(total_spent, 2),
            total_orders=total_orders,
            average_order_value=round(average_order_value, 2),
            most_purchased_category=most_category[0][0] if most_category else None,
            most_used_platform=most_platform[0][0] if most_platform else None,
        )

    def _build_category_stats(self, records: list[dict], top_n: int = 5) -> CategoryStatistics:
        share_map: dict[str, float] = defaultdict(float)
        for r in records:
            share_map[r.get("category") or "기타"] += _safe_float(r.get("total_price"))

        share = [
            PieDatum(id=cat, label=cat, value=round(total, 2))
            for cat, total in share_map.items()
        ]
        share.sort(key=lambda item: item.value, reverse=True)

        # Monthly trend
        cat_totals = sorted(share, key=lambda item: item.value, reverse=True)
        top_categories = {item.id for item in cat_totals[:top_n]}
        include_others = len(cat_totals) > top_n

        series_map: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        months_set: set[str] = set()
        for r in records:
            month_key = _month_key(r.get("purchase_date"))
            if not month_key:
                continue
            months_set.add(month_key)
            raw_cat = r.get("category") or "기타"
            cat = raw_cat if raw_cat in top_categories else ("기타" if include_others else raw_cat)
            series_map[cat][month_key] += _safe_float(r.get("total_price"))

        month_domain = sorted(months_set)
        monthly_trend = [
            LineSeries(
                id=cat,
                data=[
                    LinePoint(x=month, y=round(month_map.get(month, 0.0), 2))
                    for month in month_domain
                ],
            )
            for cat, month_map in series_map.items()
        ]

        # keep top categories first, 기타 last
        monthly_trend.sort(
            key=lambda series: (
                1 if series.id == "기타" else 0,
                next((idx for idx, item in enumerate(cat_totals) if item.id == series.id), top_n),
            )
        )

        return CategoryStatistics(share=share, monthly_trend=monthly_trend)

    def _build_platform_stats(self, records: list[dict]) -> PlatformStatistics:
        ratio_map: dict[str, float] = defaultdict(float)
        series_map: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        months_set: set[str] = set()

        for r in records:
            platform = r.get("platform") or "기타"
            amount = _safe_float(r.get("total_price"))
            ratio_map[platform] += amount
            month_key = _month_key(r.get("purchase_date"))
            if month_key:
                months_set.add(month_key)
                series_map[platform][month_key] += amount

        ratio = [
            PieDatum(id=platform, label=platform, value=round(total, 2))
            for platform, total in ratio_map.items()
        ]
        ratio.sort(key=lambda item: item.value, reverse=True)

        month_domain = sorted(months_set)
        monthly_trend = [
            LineSeries(
                id=platform,
                data=[
                    LinePoint(x=month, y=round(month_map.get(month, 0.0), 2))
                    for month in month_domain
                ],
            )
            for platform, month_map in series_map.items()
        ]

        return PlatformStatistics(ratio=ratio, monthly_trend=monthly_trend)

    def _build_pattern_stats(self, records: list[dict]) -> PatternStatistics:
        hourly_totals: dict[str, float] = defaultdict(float)
        monthly_totals: dict[str, float] = defaultdict(float)

        for r in records:
            amount = _safe_float(r.get("total_price"))
            hour_key = _hour_key(r.get("purchase_date"))
            month_key = _month_key(r.get("purchase_date"))
            if hour_key:
                hourly_totals[hour_key] += amount
            if month_key:
                monthly_totals[month_key] += amount

        hourly_points = []
        for hour in range(24):
            key = f"{hour}시"
            hourly_points.append(LinePoint(x=key, y=round(hourly_totals.get(key, 0.0), 2)))
        hourly_trend = [LineSeries(id="시간대별", data=hourly_points)]

        monthly_points = [
            LinePoint(x=month, y=round(monthly_totals[month], 2))
            for month in sorted(monthly_totals.keys())
        ]
        monthly_total = [LineSeries(id="월별 총액", data=monthly_points)]

        return PatternStatistics(hourly_trend=hourly_trend, monthly_total=monthly_total)

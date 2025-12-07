"""FastMCP server exposing purchase history statistics analysis."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
import logging
import os
from typing import Any

from dotenv import load_dotenv
from fastmcp import FastMCP
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
mcp = FastMCP("purchase_statistics")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set for statistics MCP server.")

engine = create_engine(DATABASE_URL, future=True)

# Query to get purchase history with column mapping
PURCHASE_HISTORY_QUERY = """
SELECT
    ph.date AS purchase_date,
    ph.name AS product_name,
    ph.platform_name AS platform,
    ph.category,
    ph.price,
    ph.quantity
FROM purchase_history ph
ORDER BY ph.date DESC
"""

# ============================================================================
# Utility Functions
# ============================================================================

Number = int | float


def _to_float(x: Any) -> float:
    """Convert value to float, defaulting to 0.0 on error."""
    try:
        if x is None or (isinstance(x, float) and (x != x)):  # NaN check
            return 0.0
        return float(x)
    except Exception:
        return 0.0


def _to_int(x: Any) -> int:
    """Convert value to int, defaulting to 0 on error."""
    try:
        if x is None or (isinstance(x, float) and (x != x)):  # NaN check
            return 0
        return int(x)
    except Exception:
        return 0


def _parse_dt(s: Any) -> datetime | None:
    """
    Parse purchase_date string utility.
    Supports both "YYYY-MM-DD HH:MM:SS" and "YYYY-MM-DDTHH:MM:SS" formats.
    """
    if not s:
        return None
    if isinstance(s, datetime):
        return s
    try:
        return datetime.fromisoformat(str(s))
    except Exception:
        return None


def get_total_price(record: dict[str, Any]) -> float:
    """
    Calculate total price from a record.
    - If "total_price" exists, use it first
    - Otherwise calculate as price * quantity

    Expected columns:
      - total_price (optional)
      - price
      - quantity
    """
    total = record.get("total_price")
    if total is not None and total != "":
        return _to_float(total)

    price = _to_float(record.get("price"))
    qty = _to_int(record.get("quantity"))
    return price * qty


def filter_records_by_date(
    records: list[dict[str, Any]],
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """
    Filter records by date range.

    Args:
        records: Purchase history records
        start_date: Start date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
        end_date: End date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)

    Returns:
        Filtered list of records within the date range

    Expected columns:
      - purchase_date (datetime or ISO string)
    """
    if not start_date and not end_date:
        return records

    filtered: list[dict[str, Any]] = []

    for r in records:
        purchase_date = r.get("purchase_date")
        if not purchase_date:
            continue

        # Parse purchase_date if it's a string
        if isinstance(purchase_date, str):
            try:
                dt = datetime.fromisoformat(purchase_date)
            except Exception:
                continue
        elif isinstance(purchase_date, datetime):
            dt = purchase_date
        else:
            continue

        # Convert to date only for comparison (ignore time and timezone)
        dt_date = dt.date()

        # Apply start_date filter
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                start_date_only = start_dt.date()
                if dt_date < start_date_only:
                    continue
            except Exception:
                continue

        # Apply end_date filter
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                end_date_only = end_dt.date()
                if dt_date > end_date_only:
                    continue
            except Exception:
                continue

        filtered.append(r)

    return filtered


# ============================================================================
# Analysis Functions
# ============================================================================


def get_category_share(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Calculate total spending and ratio by category.

    Return format: [{"category": "...", "amount": 000, "ratio": 0.0}, ...]

    Expected columns:
      - category
      - price / quantity / total_price
    """
    by_cat: dict[str, float] = defaultdict(float)
    total_sum = 0.0

    for r in records:
        cat = r.get("category") or "기타"
        amt = get_total_price(r)
        by_cat[cat] += amt
        total_sum += amt

    result: list[dict[str, Any]] = []
    for cat, amt in by_cat.items():
        ratio = (amt / total_sum) * 100 if total_sum > 0 else 0.0
        result.append(
            {
                "category": cat,
                "amount": round(amt, 2),
                "ratio": round(ratio, 2),
            }
        )

    # Sort by amount descending
    result.sort(key=lambda x: x["amount"], reverse=True)
    return result


def get_platform_ratio(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Calculate total spending and ratio by platform.

    Return format: [{"platform": "...", "amount": 000, "ratio": 0.0}, ...]

    Expected columns:
      - platform
      - price / quantity / total_price
    """
    by_plat: dict[str, float] = defaultdict(float)
    total_sum = 0.0

    for r in records:
        plat = r.get("platform") or "기타"
        amt = get_total_price(r)
        by_plat[plat] += amt
        total_sum += amt

    result: list[dict[str, Any]] = []
    for plat, amt in by_plat.items():
        ratio = (amt / total_sum) * 100 if total_sum > 0 else 0.0
        result.append(
            {
                "platform": plat,
                "amount": round(amt, 2),
                "ratio": round(ratio, 2),
            }
        )

    result.sort(key=lambda x: x["amount"], reverse=True)
    return result


def get_monthly_category_trend(
    records: list[dict[str, Any]],
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """
    Calculate monthly spending trend by category.

    Return format: [{"year_month": "2025-01", "category": "...", "amount": 000}, ...]

    Expected columns:
      - purchase_date
      - category
      - price / quantity / total_price
    """
    by_key: dict[tuple[str, str], float] = defaultdict(float)

    for r in records:
        dt = _parse_dt(r.get("purchase_date"))
        if not dt:
            continue
        ym = dt.strftime("%Y-%m")
        cat = r.get("category") or "기타"
        amt = get_total_price(r)
        by_key[(ym, cat)] += amt

    # Calculate total per category and keep only top N
    cat_total: dict[str, float] = defaultdict(float)
    for (ym, cat), amt in by_key.items():
        cat_total[cat] += amt

    top_cats = sorted(cat_total.items(), key=lambda x: x[1], reverse=True)
    top_cats = [c for c, _ in top_cats[:top_n]]

    result: list[dict[str, Any]] = []
    for (ym, cat), amt in by_key.items():
        if cat not in top_cats:
            continue
        result.append(
            {
                "year_month": ym,
                "category": cat,
                "amount": round(amt, 2),
            }
        )

    # Sort by year_month, category
    result.sort(key=lambda x: (x["year_month"], x["category"]))
    return result


def get_monthly_platform_trend(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Calculate monthly spending trend by platform.

    Return format: [{"year_month": "2025-01", "platform": "...", "amount": 000}, ...]

    Expected columns:
      - purchase_date
      - platform
    """
    by_key: dict[tuple[str, str], float] = defaultdict(float)

    for r in records:
        dt = _parse_dt(r.get("purchase_date"))
        if not dt:
            continue
        ym = dt.strftime("%Y-%m")
        plat = r.get("platform") or "기타"
        amt = get_total_price(r)
        by_key[(ym, plat)] += amt

    result: list[dict[str, Any]] = []
    for (ym, plat), amt in by_key.items():
        result.append(
            {
                "year_month": ym,
                "platform": plat,
                "amount": round(amt, 2),
            }
        )

    result.sort(key=lambda x: (x["year_month"], x["platform"]))
    return result


def get_monthly_total_trend(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Calculate monthly total spending trend.

    Return format: [{"year_month": "2025-01", "amount": 000}, ...]

    Expected columns:
      - purchase_date
    """
    by_ym: dict[str, float] = defaultdict(float)

    for r in records:
        dt = _parse_dt(r.get("purchase_date"))
        if not dt:
            continue
        ym = dt.strftime("%Y-%m")
        amt = get_total_price(r)
        by_ym[ym] += amt

    result: list[dict[str, Any]] = []
    for ym, amt in by_ym.items():
        result.append(
            {
                "year_month": ym,
                "amount": round(amt, 2),
            }
        )

    result.sort(key=lambda x: x["year_month"])
    return result


def get_hourly_trend(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Calculate spending distribution by hour (0-23).

    Return format: [{"hour": 0, "amount": 000}, ...]

    Expected columns:
      - purchase_date
    """
    by_hour: dict[int, float] = defaultdict(float)

    for r in records:
        dt = _parse_dt(r.get("purchase_date"))
        if not dt:
            continue
        hour = dt.hour
        amt = get_total_price(r)
        by_hour[hour] += amt

    result: list[dict[str, Any]] = []
    for h in range(24):
        amt = by_hour.get(h, 0.0)
        result.append({"hour": h, "amount": round(amt, 2)})

    return result


def get_top_product(
    records: list[dict[str, Any]],
    top_k: int = 5,
    metric: str = "quantity",
) -> list[dict[str, Any]]:
    """
    Calculate most purchased products.

    Args:
        records: Purchase history records
        top_k: Number of top products to return
        metric: "quantity" or "total_price"

    Return format:
        [
            {
                "product_name": "...",
                "category": "...",
                "total_quantity": 0,
                "total_price": 0.0,
                "platforms": {"platform1": count1, ...}
            },
            ...
        ]

    Expected columns:
      - product_name
      - category
      - platform
      - quantity
      - price / total_price
    """
    agg: dict[tuple[str, str], dict[str, Any]] = {}

    for r in records:
        name = r.get("product_name") or "이름 없는 상품"
        cat = r.get("category") or "기타"
        platform = r.get("platform") or "기타"

        qty = r.get("quantity") or 0
        try:
            qty = int(qty)
        except Exception:
            qty = 0

        total = get_total_price(r)

        key = (name, cat)

        if key not in agg:
            agg[key] = {
                "product_name": name,
                "category": cat,
                "total_quantity": 0,
                "total_price": 0.0,
                "platforms": defaultdict(int),
            }

        agg[key]["total_quantity"] += qty
        agg[key]["total_price"] += total
        agg[key]["platforms"][platform] += qty

    results: list[dict[str, Any]] = []
    for item in agg.values():
        item["total_price"] = round(item["total_price"], 2)
        item["platforms"] = dict(item["platforms"])
        results.append(item)

    sort_key = "total_quantity" if metric == "quantity" else "total_price"
    results.sort(key=lambda x: x[sort_key], reverse=True)

    return results[:top_k]


# ============================================================================
# Database and MCP Tools
# ============================================================================


def _load_purchase_records(
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Load purchase history from database and apply date filtering."""
    with engine.connect() as conn:
        result = conn.execute(text(PURCHASE_HISTORY_QUERY))
        records = [dict(row._mapping) for row in result]

    logger.info("Loaded %d purchase history records from database", len(records))

    # Apply date filtering if provided
    if start_date or end_date:
        records = filter_records_by_date(records, start_date, end_date)
        logger.info("Filtered to %d records (start=%s, end=%s)", len(records), start_date, end_date)

    return records


@mcp.tool()
def analyze_category_share(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """
    특정 기간 동안 카테고리별 지출 금액과 비중을 계산한다.

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)

    Returns:
        카테고리별 총 지출 금액과 비중
        [{"category": "...", "amount": 000, "ratio": 0.0}, ...]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_category_share(records)}


@mcp.tool()
def analyze_platform_ratio(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """
    특정 기간 동안 플랫폼별 지출 금액과 비중을 계산한다.

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)

    Returns:
        플랫폼별 총 지출 금액과 비중
        [{"platform": "...", "amount": 000, "ratio": 0.0}, ...]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_platform_ratio(records)}


@mcp.tool()
def analyze_monthly_category_trend(
    start_date: str | None = None,
    end_date: str | None = None,
    top_n: int = 5,
) -> dict[str, Any]:
    """
    월별·카테고리별 소비 추이를 계산한다 (상위 N개 카테고리만).

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)
        top_n: 상위 몇 개 카테고리를 포함할지 (기본값: 5)

    Returns:
        월별 카테고리별 소비 금액
        [{"year_month": "2025-01", "category": "...", "amount": 000}, ...]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_monthly_category_trend(records, top_n=top_n)}


@mcp.tool()
def analyze_monthly_platform_trend(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """
    월별·플랫폼별 소비 추이를 계산한다.

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)

    Returns:
        월별 플랫폼별 소비 금액
        [{"year_month": "2025-01", "platform": "...", "amount": 000}, ...]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_monthly_platform_trend(records)}


@mcp.tool()
def analyze_monthly_total_trend(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """
    월별 총 소비 금액 추이를 계산한다.

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)

    Returns:
        월별 총 소비 금액
        [{"year_month": "2025-01", "amount": 000}, ...]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_monthly_total_trend(records)}


@mcp.tool()
def analyze_hourly_trend(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, Any]:
    """
    시간대별(0~23시) 소비 금액 분포를 계산한다.

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)

    Returns:
        시간대별 소비 금액
        [{"hour": 0, "amount": 000}, ...]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_hourly_trend(records)}


@mcp.tool()
def analyze_top_product(
    start_date: str | None = None,
    end_date: str | None = None,
    top_k: int = 5,
    metric: str = "quantity",
) -> dict[str, Any]:
    """
    특정 기간 동안 가장 많이 구매한 상품을 계산한다.

    Args:
        start_date: 시작 날짜 (YYYY-MM-DD or ISO format)
        end_date: 종료 날짜 (YYYY-MM-DD or ISO format)
        top_k: 상위 몇 개 상품을 반환할지 (기본값: 5)
        metric: 정렬 기준 ("quantity" 또는 "total_price")

    Returns:
        최다 구매 상품 목록
        [
            {
                "product_name": "...",
                "category": "...",
                "total_quantity": 0,
                "total_price": 0.0,
                "platforms": {"platform1": count1, ...}
            },
            ...
        ]
    """
    records = _load_purchase_records(start_date, end_date)
    return {"data": get_top_product(records, top_k=top_k, metric=metric)}


def run_server():
    """Run the FastMCP statistics server."""
    logger.info("🚀 Starting statistics MCP server on port 8003")
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8003,
        path="/mcp",
        stateless_http=True,
    )


if __name__ == "__main__":
    run_server()

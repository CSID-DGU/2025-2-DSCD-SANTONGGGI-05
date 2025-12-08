"""Purchase history statistics analysis functions."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

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

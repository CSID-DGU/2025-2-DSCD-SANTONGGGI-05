"""Utility functions for statistics analysis."""

from __future__ import annotations

from datetime import datetime
from typing import Any


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

        # Apply start_date filter
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                if dt < start_dt:
                    continue
            except Exception:
                continue

        # Apply end_date filter
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                if dt > end_dt:
                    continue
            except Exception:
                continue

        filtered.append(r)

    return filtered

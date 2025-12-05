# purchase_mcp_server.py

import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict

from fastmcp import FastMCP

from analysis import (
    get_category_share as _get_category_share,
    get_platform_ratio as _get_platform_ratio,
    get_monthly_category_trend as _get_monthly_category_trend,
    get_monthly_platform_trend as _get_monthly_platform_trend,
    get_monthly_total_trend as _get_monthly_total_trend,
    get_hourly_trend as _get_hourly_trend,
    get_total_price,
)

# --------- 1. 데이터 로드 및 컬럼 매핑 ---------

# ✅ 실제 전달한 최종 CSV 파일명으로 맞춤
DATA_PATH = "final_purchase_data.csv"

df = pd.read_csv(DATA_PATH)

# ✅ 한글 컬럼명을 분석 함수에서 사용하는 공통 컬럼명으로 변환
# final_purchase_data.csv 컬럼 예:
# ['구매일자', '수량', '총가격', '대분류', '소분류', '상품명', '리뷰수', '평점', '가격', '단위용량', '개당가격', '플랫폼']
COLUMN_MAP = {
    "플랫폼": "platform",
    "구매일자": "purchase_date",
    "상품명": "product_name",
    "대분류": "category",      # 대분류를 category로 사용
    "가격": "price",
    "수량": "quantity",
    "총가격": "total_price",
}

df = df.rename(columns=COLUMN_MAP)

# 혹시 구매일자가 datetime 타입으로 읽혔다면 문자열 ISO 형식으로 변환
if "purchase_date" in df.columns:
    if not pd.api.types.is_string_dtype(df["purchase_date"]):
        df["purchase_date"] = pd.to_datetime(
            df["purchase_date"], errors="coerce"
        ).dt.strftime("%Y-%m-%d %H:%M:%S")

ALL_RECORDS: List[Dict[str, Any]] = df.to_dict(orient="records")


# --------- 2. 날짜 필터링 유틸 ---------

def filter_records_by_date(
    records: List[Dict[str, Any]],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """start_date, end_date(YYYY-MM-DD) 기준으로 레코드를 필터링"""
    if not start_date and not end_date:
        return records

    def to_dt(s: str) -> Optional[datetime]:
        try:
            return datetime.fromisoformat(str(s))
        except Exception:
            return None

    sd = to_dt(start_date) if start_date else None
    ed = to_dt(end_date) if end_date else None

    filtered: List[Dict[str, Any]] = []
    for r in records:
        d_str = r.get("purchase_date")
        if not d_str:
            continue
        d = to_dt(d_str)
        if not d:
            continue

        if sd and d < sd:
            continue
        if ed and d > ed:
            continue
        filtered.append(r)
    return filtered


# --------- 3. 최다 구매 상품 계산 유틸 ---------

def compute_top_product(
    records: List[Dict[str, Any]],
    top_k: int = 5,
    metric: str = "quantity",  # "quantity" 또는 "total_price"
) -> Dict[str, Any]:
    agg: Dict[tuple, Dict[str, Any]] = {}

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

    results: List[Dict[str, Any]] = []
    for item in agg.values():
        item["total_price"] = round(item["total_price"], 2)
        item["platforms"] = dict(item["platforms"])
        results.append(item)

    sort_key = "total_quantity" if metric == "quantity" else "total_price"
    results.sort(key=lambda x: x[sort_key], reverse=True)

    return {
        "metric": metric,
        "top_k": top_k,
        "results": results[:top_k],
        "total_products": len(results),
    }


# --------- 4. MCP 서버 정의 및 툴 등록 ---------

mcp = FastMCP("PurchaseAnalytics")


@mcp.tool()
def get_category_share(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """특정 기간 동안 카테고리별 지출 금액을 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return {"data": _get_category_share(records)}


@mcp.tool()
def get_platform_ratio(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """특정 기간 동안 플랫폼별 지출 금액을 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return {"data": _get_platform_ratio(records)}


@mcp.tool()
def get_monthly_category_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    top_n: int = 5,
) -> Dict[str, Any]:
    """월별·카테고리별 소비 추이를 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return {"data": _get_monthly_category_trend(records, top_n=top_n)}


@mcp.tool()
def get_monthly_platform_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """월별·플랫폼별 소비 추이를 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return {"data": _get_monthly_platform_trend(records)}


@mcp.tool()
def get_monthly_total_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """월별 총 소비 금액 추이를 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return {"data": _get_monthly_total_trend(records)}


@mcp.tool()
def get_hourly_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """시간대별 소비 금액을 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return {"data": _get_hourly_trend(records)}


@mcp.tool()
def get_top_product(
    start_date: str,
    end_date: str,
    top_k: int = 5,
    metric: str = "quantity",
) -> Dict[str, Any]:
    """특정 기간 동안 가장 많이 구매한 상품을 계산한다."""
    records = filter_records_by_date(ALL_RECORDS, start_date, end_date)
    return compute_top_product(records, top_k=top_k, metric=metric)


if __name__ == "__main__":
    # 로컬에서 서버 실행
    # 예: python purchase_mcp_server.py
    print("🚀 MCP server started (HTTP mode)")
    print("Listening on http://0.0.0.0:8000/mcp")
    mcp.run(
        transport="http",
        host="0.0.0.0",
        port=8000,
        path="/mcp",
    )
"""FastMCP server for 11번가 + 네이버 쇼핑 API."""

from __future__ import annotations

from html import unescape
import os
import xml.etree.ElementTree as ET

import requests
from fastmcp import FastMCP


ELEVENST_API_KEY = os.getenv("ELEVENST_API_KEY", "")
ELEVENST_BASE_URL = os.getenv("ELEVENST_BASE_URL", "http://openapi.11st.co.kr/openapi/OpenApiService.tmall")

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")
NAVER_SHOP_API_URL = os.getenv("NAVER_SHOP_API_URL", "https://openapi.naver.com/v1/search/shop.json")


mcp = FastMCP("shopping_combined")


def _safe_text(elem: ET.Element, tag: str) -> str:
    raw = elem.findtext(tag)
    if raw is None:
        return ""
    return raw.strip()


@mcp.tool()
def search_11st_products(keyword: str, limit: int = 3) -> list[dict]:
    params = {
        "key": ELEVENST_API_KEY,
        "apiCode": "ProductSearch",
        "keyword": keyword,
        "pageSize": 10,
        "pageNum": 1,
        "sortCd": "A",
    }
    resp = requests.get(ELEVENST_BASE_URL, params=params, timeout=15)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    product_nodes = root.findall(".//Product")

    results = []
    for idx, product in enumerate(product_nodes[:limit]):
        name = _safe_text(product, "ProductName")
        price_candidates = [
            _safe_text(product, "SalePrice"),
            _safe_text(product, "ProductPrice"),
            _safe_text(product, "Price"),
            _safe_text(product, "LowestPrice"),
        ]
        final_price = next((val for val in price_candidates if val != ""), "")

        code = _safe_text(product, "ProductCode")
        detail_url = _safe_text(product, "DetailPageUrl")
        if not detail_url and code:
            detail_url = (
                "http://www.11st.co.kr/product/SellerProductDetail.tmall"
                f"?method=getSellerProductDetail&prdNo={code}"
            )

        image_candidates = [
            _safe_text(product, "ProductImage300"),
            _safe_text(product, "ProductImage250"),
            _safe_text(product, "ProductImage200"),
            _safe_text(product, "ProductImage170"),
            _safe_text(product, "ProductImage150"),
            _safe_text(product, "ProductImage110"),
            _safe_text(product, "ProductImage100"),
            _safe_text(product, "ProductImage"),
        ]
        image_url = next((val for val in image_candidates if val != ""), "")

        results.append(
            {
                "name": name or None,
                "price": final_price or None,
                "platform_name": "11번가",
                "category": None,
                "product_url": detail_url or None,
                "image_url": image_url or None,
            }
        )
    return results


@mcp.tool()
def search_naver_products(query: str, page_size: int = 3) -> list[dict]:
    params = {
        "query": query,
        "display": max(page_size, 10),
        "start": 1,
        "sort": "sim",
    }
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    resp = requests.get(NAVER_SHOP_API_URL, headers=headers, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for item in data.get("items", [])[:page_size]:
        raw_name = item.get("title", "")
        clean_name = unescape(raw_name).replace("<b>", "").replace("</b>", "")
        price = item.get("lprice", "")
        detail_url = item.get("link", "")
        image_url = unescape(item.get("image", ""))
        category = item.get("category1", "")

        results.append(
            {
                "name": clean_name or None,
                "price": price or None,
                "platform_name": "네이버",
                "category": category or None,
                "product_url": detail_url or None,
                "image_url": image_url or None,
            }
        )
    return results


def run_server():
    mcp.run(
        transport="http",
        host="0.0.0.0",
        path="/mcp",
        port=8002,
    )


if __name__ == "__main__":
    run_server()

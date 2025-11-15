"""Prompt templates used for OpenAI Responses API calls."""

from __future__ import annotations


def build_smalltalk_prompt(user_message: str) -> str:
    """Return a lightweight prompt for casual Q&A."""
    return (
        "You are a shopping assistant that answers in Korean.\n"
        "Respond to the customer message in a friendly tone with 2-3 concise sentences.\n"
        "Customer message:\n"
        f"{user_message}"
    )


def build_purchase_prompt(user_id: int) -> str:
    """Prompt for purchase-history based recommendation."""
    return (
        "사용자의 구매 이력을 분석하여 새로운 상품을 추천해 주세요.\n"
        f"- user_id: {user_id}\n"
        "- MCP recommend_products_final_v4 툴을 호출하여 추천 목록을 받아야 합니다.\n"
        "- 응답은 JSON으로 반환하며 recommendationItems 배열에 포함된 제품을 기반으로 메시지를 작성하세요."
    )


def build_platform_search_prompt(user_message: str) -> str:
    """Prompt instructing the model to call both 11번가 & 네이버 MCP tools."""
    return (
        "사용자 질의를 참고하여 쇼핑 키워드를 추출한 뒤 두 개의 MCP 검색 툴을 모두 호출하세요.\n"
        "결과는 아래 JSON 구조로만 응답합니다 (코드블럭 사용 금지).\n"
        "{\n"
        '  "ai_message": "짧고 친근한 추천 멘트",\n'
        '  "elevenst": [ ... ],\n'
        '  "naver": [ ... ]\n'
        "}\n"
        "각 배열의 항목에는 name, price, category, product_url, image_url 필드를 유지하세요.\n"
        "사용자 질의:\n"
        f"{user_message}"
    )

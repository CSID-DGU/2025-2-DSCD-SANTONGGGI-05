"""Prompt templates used for OpenAI Responses API calls."""

from __future__ import annotations

from typing import Iterable


def build_common_prompt() -> str:
    """Return baseline guidance shared across all prompts."""
    return (
        "당신은 한국어로 응답하는 쇼핑 도우미입니다.\n"
        "- 모든 답변은 정중하고 자연스러운 톤을 유지하세요.\n"
        "- MCP 도구가 제공되면 최신 정보를 위해 적극적으로 호출하세요.\n"
        "- 사실과 추측을 명확히 구분하고, 모르는 내용은 솔직히 모른다고 답하세요.\n"
        "- 출력 형식/JSON 스키마 등 추가 지침이 제시되면 반드시 준수하세요."
    )


def build_tool_selection_prompt(user_message: str, *, available_tools: Iterable[str]) -> str:
    """Prompt asking the LLM to choose exactly one MCP workflow."""
    descriptions: list[str] = []
    for tool in available_tools:
        if tool == "platform_search":
            descriptions.append(
                '- "platform_search": 11번가/네이버 MCP를 호출해 명시적인 상품명/브랜드/카테고리를 실시간 검색'
            )
        elif tool == "purchase_recommendation":
            descriptions.append(
                '- "purchase_recommendation": 구매 이력 MCP로 모호한 요구나 잡담을 자연스럽게 추천 답변으로 전환'
            )

    options = "\n".join(descriptions) if descriptions else "- (사용 가능한 MCP 없음)"
    return (
        "아래 사용자 메시지를 분석해 현재 상황에 가장 적합한 단 하나의 MCP 워크플로를 선택하세요.\n"
        "응답은 반드시 JSON 한 줄로만 출력하고, 예시는 다음과 같습니다.\n"
        '{ "selected_tool": "platform_search", "reason": "실시간 쇼핑 검색이 필요" }\n'
        "필드 설명:\n"
        '- selected_tool: "platform_search", "purchase_recommendation", "none" 중 하나\n'
        "- reason: 선택 근거를 1문장으로 요약 (한국어)\n"
        "선택 기준:\n"
        "- platform_search: 메시지에 특정 상품명/브랜드/카테고리가 명시되어 있거나, 바로 쇼핑 검색이 필요한 경우.\n"
        "- purchase_recommendation: 상품명이 모호하거나, 사용자가 분위기/취향/상황만 설명하는 경우.\n"
        "- none: 쇼핑과 전혀 무관한 요청일 때.\n"
        "사용 가능한 MCP 옵션:\n"
        f"{options}\n"
        '어떤 MCP도 적합하지 않으면 selected_tool 값을 "none"으로 설정하세요.\n'
        "사용자 메시지:\n"
        f"{user_message}"
    )


def build_smalltalk_prompt(user_message: str) -> str:
    """Return a lightweight prompt for casual Q&A."""
    return (
        f"{build_common_prompt()}\n"
        "You are a shopping assistant that answers in Korean.\n"
        "Respond to the customer message in a friendly tone with 2-3 concise sentences.\n"
        "Customer message:\n"
        f"{user_message}"
    )


def build_purchase_prompt(user_id: int) -> str:
    """Prompt for purchase-history based recommendation."""
    return (
        f"{build_common_prompt()}\n"
        "사용자의 구매 이력을 분석하여 새로운 상품을 추천해 주세요.\n"
        f"- user_id: {user_id}\n"
        "- MCP recommend_products_final_v4 툴을 호출하여 추천 목록을 받아야 합니다.\n"
        "- 응답은 JSON으로 반환하며 recommendationItems 배열에 포함된 제품을 기반으로 메시지를 작성하세요."
    )


def build_platform_search_prompt(user_message: str) -> str:
    """Prompt instructing the model to call both 11번가 & 네이버 MCP tools."""
    return (
        f"{build_common_prompt()}\n"
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

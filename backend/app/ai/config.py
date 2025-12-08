"""Centralised configuration for AI/OpenAI/MCP integration."""

from __future__ import annotations

from functools import lru_cache
import os
from typing import Optional

from pydantic import BaseModel, Field


class AiConfig(BaseModel):
    """Holds runtime configuration for OpenAI + MCP usage."""

    openai_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    openai_model: str = Field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4.1-mini"))

    purchase_mcp_url: Optional[str] = Field(default_factory=lambda: os.getenv("MCP_PURCHASE_URL"))
    search_mcp_url: Optional[str] = Field(default_factory=lambda: os.getenv("MCP_SEARCH_URL"))
    statistics_mcp_url: Optional[str] = Field(default_factory=lambda: os.getenv("MCP_STATISTICS_URL"))

    recommend_tool_name: str = Field(default_factory=lambda: os.getenv("MCP_RECOMMEND_TOOL", "recommend_products_final_v4"))
    search_11st_tool: str = Field(default_factory=lambda: os.getenv("MCP_SEARCH_11ST_TOOL", "search_11st_products"))
    search_naver_tool: str = Field(default_factory=lambda: os.getenv("MCP_SEARCH_NAVER_TOOL", "search_naver_products"))

    # Statistics MCP tools
    stat_category_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_CATEGORY_TOOL", "analyze_category_share"))
    stat_platform_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_PLATFORM_TOOL", "analyze_platform_ratio"))
    stat_monthly_category_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_MONTHLY_CATEGORY_TOOL", "analyze_monthly_category_trend"))
    stat_monthly_platform_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_MONTHLY_PLATFORM_TOOL", "analyze_monthly_platform_trend"))
    stat_monthly_total_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_MONTHLY_TOTAL_TOOL", "analyze_monthly_total_trend"))
    stat_hourly_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_HOURLY_TOOL", "analyze_hourly_trend"))
    stat_top_product_tool: str = Field(default_factory=lambda: os.getenv("MCP_STAT_TOP_PRODUCT_TOOL", "analyze_top_product"))

    request_timeout: float = Field(default_factory=lambda: float(os.getenv("OPENAI_REQUEST_TIMEOUT", "30")))

    class Config:
        frozen = True

    @property
    def is_openai_enabled(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def has_purchase_mcp(self) -> bool:
        return bool(self.purchase_mcp_url)

    @property
    def has_search_mcp(self) -> bool:
        return bool(self.search_mcp_url)

    @property
    def has_statistics_mcp(self) -> bool:
        return bool(self.statistics_mcp_url)


@lru_cache(maxsize=1)
def get_ai_config() -> AiConfig:
    """Return cached AI configuration."""
    return AiConfig()

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

    recommend_tool_name: str = Field(default_factory=lambda: os.getenv("MCP_RECOMMEND_TOOL", "recommend_products_final_v4"))
    search_11st_tool: str = Field(default_factory=lambda: os.getenv("MCP_SEARCH_11ST_TOOL", "search_11st_products"))
    search_naver_tool: str = Field(default_factory=lambda: os.getenv("MCP_SEARCH_NAVER_TOOL", "search_naver_products"))

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


@lru_cache(maxsize=1)
def get_ai_config() -> AiConfig:
    """Return cached AI configuration."""
    return AiConfig()

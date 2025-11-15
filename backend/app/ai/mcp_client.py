"""Helper utilities for preparing MCP tool declarations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from .config import AiConfig, get_ai_config


@dataclass(frozen=True)
class McpToolDefinition:
    """OpenAI Responses API compatible MCP tool descriptor."""

    server_label: str
    server_url: str
    allowed_tools: List[str]
    require_approval: str = "never"

    def as_openai_tool(self) -> Dict[str, Any]:
        return {
            "type": "mcp",
            "server_label": self.server_label,
            "server_url": self.server_url,
            "allowed_tools": self.allowed_tools,
            "require_approval": self.require_approval,
        }


def build_purchase_toolset(config: AiConfig | None = None) -> List[dict[str, Any]]:
    """Return MCP tool declarations for purchase-history recommendations."""
    cfg = config or get_ai_config()
    if not cfg.purchase_mcp_url or not cfg.recommend_tool_name:
        return []
    definition = McpToolDefinition(
        server_label="purchase_reco",
        server_url=cfg.purchase_mcp_url,
        allowed_tools=[cfg.recommend_tool_name],
    )
    return [definition.as_openai_tool()]


def build_search_toolset(config: AiConfig | None = None) -> List[dict[str, Any]]:
    """Return MCP tool declarations for multi-platform search."""
    cfg = config or get_ai_config()
    if not cfg.search_mcp_url:
        return []

    allowed = []
    if cfg.search_11st_tool:
        allowed.append(cfg.search_11st_tool)
    if cfg.search_naver_tool:
        allowed.append(cfg.search_naver_tool)

    if not allowed:
        return []

    definition = McpToolDefinition(
        server_label="shopping_search",
        server_url=cfg.search_mcp_url,
        allowed_tools=allowed,
    )
    return [definition.as_openai_tool()]

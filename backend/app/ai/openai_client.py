"""Thin wrapper around the OpenAI Responses API."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import httpx
from openai import OpenAI, OpenAIError

from .config import AiConfig, get_ai_config

logger = logging.getLogger(__name__)


class OpenAIChatClient:
    """Encapsulates Responses API calls."""

    def __init__(self, config: AiConfig | None = None) -> None:
        self._config = config or get_ai_config()
        self._client: Optional[OpenAI] = None
        if self._config.openai_api_key:
            # Configure timeout for MCP server connections
            # Default 10min is too long, but 30s is too short for MCP
            self._client = OpenAI(
                api_key=self._config.openai_api_key,
                timeout=httpx.Timeout(
                    timeout=300.0,  # 5 minutes total timeout
                    connect=10.0,   # 10 seconds to establish connection
                    read=240.0,     # 4 minutes to read response
                ),
                max_retries=0,  # Disable retries for faster failure detection
            )

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def run_prompt(
        self,
        *,
        prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Execute a prompt and return plain text output."""
        if not self._client:
            raise RuntimeError("OpenAI client not configured")

        payload: Dict[str, Any] = {
            "model": self._config.openai_model,
            "input": prompt,
        }
        if tools:
            payload["tools"] = tools

        response = self._client.responses.create(**payload)
        return response.output_text

    def run_prompt_as_json(
        self,
        *,
        prompt: str,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Execute a prompt expecting JSON. Raises if parsing fails."""
        output = self.run_prompt(prompt=prompt, tools=tools)
        return json.loads(output)


class OpenAIErrorWrapper(Exception):
    """Standardised error containing context for logging."""

    def __init__(self, message: str, *, original: Optional[Exception] = None) -> None:
        self.original = original
        super().__init__(message)


def safe_run(
    client: OpenAIChatClient,
    *,
    prompt: str,
    tools: Optional[List[Dict[str, Any]]] = None,
    expect_json: bool = False,
) -> Optional[Any]:
    """Utility that executes a prompt returning either text or JSON."""
    try:
        if expect_json:
            return client.run_prompt_as_json(prompt=prompt, tools=tools)
        return client.run_prompt(prompt=prompt, tools=tools)
    except (OpenAIError, json.JSONDecodeError, RuntimeError) as exc:
        logger.exception("OpenAI prompt failed: %s", exc)
        raise OpenAIErrorWrapper("Failed to execute OpenAI prompt", original=exc) from exc

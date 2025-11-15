## MCP Servers

This directory contains FastMCP server implementations that externalize
recommendation/search functionality used by OpenAI Responses API.

### Modules

1. `recommendation_server.py`
   - Exposes `recommend_products_final_v4` tool.
   - Requires access to a SQLite database containing `purchases` and `catalog` tables.
   - Start command:
     ```bash
     python -m app.mcp_servers.recommendation_server
     ```
   - Environment variables:
     - `PURCHASE_DB_PATH`: path to SQLite DB (if not defined, CLI argument is required).

2. `shopping_server.py`
   - Exposes `search_11st_products` and `search_naver_products`.
   - Relies on external API credentials:
     - `ELEVENST_API_KEY`
     - `ELEVENST_BASE_URL` (optional override)
     - `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
   - Start command:
     ```bash
     python -m app.mcp_servers.shopping_server
     ```

Each server listens on port `8001` or `8000` respectively (configurable).
Expose them via ngrok or deploy to a reachable host, then set
`MCP_PURCHASE_URL` and `MCP_SEARCH_URL` to those endpoints in `.env`.

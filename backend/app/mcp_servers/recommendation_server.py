"""FastMCP server exposing purchase-history recommendations."""

from __future__ import annotations

import os

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastmcp import FastMCP
from sqlalchemy import create_engine, text


load_dotenv()
mcp = FastMCP("recommendation_system")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set for recommendation MCP server.")

engine = create_engine(DATABASE_URL, future=True)

PURCHASES_QUERY = """
SELECT
    ph.user_id,
    ph.product_id,
    ph.name AS product_name,
    ph.platform_name AS platform,
    ph.category,
    ph.price
FROM purchase_history ph
"""

CATALOG_QUERY = """
SELECT
    p.id AS product_id,
    p.title AS product_name,
    p.platform_name AS platform,
    p.category,
    p.price,
    p.review AS reviews,
    p.url AS product_url
FROM products p
"""


def _load_dataframe(sql: str) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql_query(text(sql), conn)


@mcp.tool()
def recommend_products_final_v4(
    top_k: int = 30,
    exclude_bought: bool = True,
) -> list[dict]:
    """Return purchase-based product recommendations."""
    purchases = _load_dataframe(PURCHASES_QUERY)
    catalog = _load_dataframe(CATALOG_QUERY)

    if "rating" not in catalog.columns:
        catalog["rating"] = 4.0
    if "reviews" not in catalog.columns:
        catalog["reviews"] = 0

    cat_ratio = purchases["category"].value_counts(normalize=True).to_dict()
    plat_ratio = purchases["platform"].value_counts(normalize=True).to_dict()
    user_avg_price = purchases.groupby("category")["price"].mean().to_dict()
    g = catalog.groupby("category")["price"]
    cat_stats = pd.DataFrame({"cat_mean": g.mean(), "cat_std": g.std(ddof=1).fillna(1)}).reset_index().set_index("category")

    reviews_log = np.log1p(catalog["reviews"].fillna(0))
    review_norm = (reviews_log - reviews_log.min()) / (reviews_log.max() - reviews_log.min() + 1e-9)
    rating_norm = (
        (catalog["rating"].fillna(catalog["rating"].median()) - catalog["rating"].min())
        / (catalog["rating"].max() - catalog["rating"].min() + 1e-9)
    )
    attr_score = (review_norm + rating_norm) / 2

    cat_score = catalog["category"].map(lambda c: cat_ratio.get(c, 0.05))
    plat_score = catalog["platform"].map(lambda p: plat_ratio.get(p, 0.05))

    def price_kernel(row):
        cat = row["category"]
        if cat not in user_avg_price or cat not in cat_stats.index:
            return 0.5
        mu = float(user_avg_price[cat])
        sigma = max(1.0, float(cat_stats.loc[cat, "cat_std"]))
        return np.exp(-((row["price"] - mu) ** 2) / (2 * sigma**2))

    price_score = catalog.apply(price_kernel, axis=1)
    base = (cat_score + plat_score + price_score + attr_score) / 4

    mu, sd = base.mean(), base.std(ddof=1)
    sim01 = 1 / (1 + np.exp(-(base - mu) / (sd * 1.0)))
    similarity = (sim01 * 100).clip(0, 99.5)

    df = catalog.copy()
    df["similarity"] = similarity
    if "similarity" not in df.columns:
        df["similarity"] = 0.0
    if exclude_bought:
        bought = purchases["product_name"].dropna().unique().tolist()
        df = df[~df["product_name"].isin(bought)]

    lam = 0.6
    selected_idx, selected_cats, selected_plats = [], [], []
    pool_idx = df.index.tolist()
    pool_idx.sort(key=lambda i: df.at[i, "similarity"], reverse=True)

    while len(selected_idx) < min(top_k, len(pool_idx)):
        best_i, best_score = None, -1e9
        for i in pool_idx:
            if i in selected_idx:
                continue
            cat_i, plat_i = df.at[i, "category"], df.at[i, "platform"]
            cat_cov = (selected_cats.count(cat_i) / len(selected_idx)) if selected_idx else 0
            plat_cov = (selected_plats.count(plat_i) / len(selected_idx)) if selected_idx else 0
            rerank = (1 - lam) * df.at[i, "similarity"] - lam * (cat_cov + plat_cov)
            if rerank > best_score:
                best_score, best_i = rerank, i
        selected_idx.append(best_i)
        selected_cats.append(df.at[best_i, "category"])
        selected_plats.append(df.at[best_i, "platform"])

    recs = df.loc[selected_idx].sort_values("similarity", ascending=False).head(top_k)
    limit = int(top_k * 0.4)
    balanced = []
    cat_counts = {}
    for _, row in recs.iterrows():
        cat = row["category"]
        if cat_counts.get(cat, 0) < limit:
            balanced.append(row)
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
    recs = pd.DataFrame(balanced).head(top_k).reset_index(drop=True)
    recs["similarity(%)"] = recs["similarity"].round(2)

    columns = [
        "main_category",
        "category",
        "product_name",
        "platform",
        "price",
        "reviews",
        "rating",
        "similarity(%)",
    ]
    existing_cols = [col for col in columns if col in recs.columns]
    return recs[existing_cols].to_dict(orient="records")


def run_server():
    """Run the FastMCP server."""
    mcp.run(
        transport="http",
        host="0.0.0.0",
        port=8001,
        path="/mcp",
    )


if __name__ == "__main__":
    run_server()

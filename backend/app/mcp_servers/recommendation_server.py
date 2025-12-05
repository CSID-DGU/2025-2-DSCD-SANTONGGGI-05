"""FastMCP server exposing purchase-history recommendations."""

from __future__ import annotations

import os
import re

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastmcp import FastMCP
from sqlalchemy import create_engine, text

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    ph.price,
    ph.unit_volume,
    ph.unit_price,
    ph.small_category,
    ph.review AS reviews,
    ph.rating,
    ph.quantity
FROM purchase_history ph
"""

CATALOG_QUERY = """
SELECT
    p.id AS product_id,
    p.title AS product_name,
    p.platform_name AS platform,
    p.category,
    p.small_category,
    p.price,
    p.review AS reviews,
    p.rating,
    p.url AS product_url,
    p.image_url,
    p.unit_volume,
    p.unit_price
FROM products p
"""


def _load_dataframe(sql: str) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql_query(text(sql), conn)


def extract_unit_base(x):
    """Extract numeric base from unit strings like '100ml당', '10g당', '1개당'."""
    x = str(x)
    nums = re.findall(r"\d+", x)
    if len(nums) == 0:
        return 1.0
    return float(nums[0])


def build_feature_df(df: pd.DataFrame):
    """Build feature dataframe with normalized price calculations."""
    df = df.copy()

    df["small_category"] = df["small_category"].fillna("기타")

    # Price cleanup
    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce")

    # Extract unit base numeric value
    df["unit_base"] = df["unit_volume"].apply(extract_unit_base)
    df["unit_base"] = df["unit_base"].replace(0, 1)

    # Calculate normalized price
    df["normalized_price"] = df["unit_price"]
    missing_norm = ~np.isfinite(df["normalized_price"]) | (df["normalized_price"] <= 1)
    df.loc[missing_norm, "normalized_price"] = df.loc[missing_norm, "price"] / df.loc[missing_norm, "unit_base"]
    df["normalized_price"] = df["normalized_price"].replace([np.inf, -np.inf], np.nan)
    df["normalized_price"] = df["normalized_price"].fillna(df["normalized_price"].median())

    # Review and rating
    df["reviews"] = pd.to_numeric(df["reviews"], errors="coerce").fillna(0)
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0)

    # Log features
    df["log_price"] = np.log1p(df["price"])
    df["log_unit_price"] = np.log1p(df["unit_price"])
    df["log_unit_base"] = np.log1p(df["unit_base"])
    df["log_norm_price"] = np.log1p(df["normalized_price"])
    df["log_review"] = np.log1p(df["reviews"])

    # One-hot encoding for small_category
    cat = pd.get_dummies(df["small_category"], prefix="small_cat").astype(int)
    df = pd.concat([df, cat], axis=1)

    feature_cols = [
        "log_price",
        "log_unit_price",
        "log_unit_base",
        "log_norm_price",
        "log_review",
        "rating"
    ] + list(cat.columns)

    # Fill NaN in features
    df[feature_cols] = df[feature_cols].fillna(0)

    return df, feature_cols


def normalize_features(X):
    """Z-score normalization."""
    mean = X.mean(axis=0, keepdims=True)
    std = X.std(axis=0, keepdims=True)
    std[std == 0] = 1
    return (X - mean) / std


def compute_user_profiles_by_subcategory(df, feature_cols):
    """Compute user profile vectors grouped by small_category."""
    profiles = {}
    for sub, g in df.groupby("small_category"):
        profiles[sub] = g[feature_cols].values.mean(axis=0)
    return profiles


def compute_baseline_normalized_price(df):
    """Compute baseline normalized price per subcategory."""
    df = df.copy()
    df["normalized_price"] = pd.to_numeric(df["normalized_price"], errors="coerce").fillna(0)
    df["quantity"] = pd.to_numeric(df.get("quantity", 1), errors="coerce").fillna(1)

    # Weighted average
    return df.groupby("small_category").apply(
        lambda g: (g["normalized_price"] * g["quantity"]).sum() / max(g["quantity"].sum(), 1)
    )


def compute_avg_quantity(df):
    """Compute average quantity per subcategory."""
    df = df.copy()
    df["quantity"] = pd.to_numeric(df.get("quantity", 1), errors="coerce").fillna(1)
    return df.groupby("small_category")["quantity"].mean()


@mcp.tool()
def recommend_products_final_v4(
    top_k: int = 30,
    exclude_bought: bool = True,
    alpha: float = 0.7,
    beta: float = 0.3,
) -> list[dict]:
    """Return purchase-based product recommendations using normalized price and feature similarity."""
    purchases = _load_dataframe(PURCHASES_QUERY)
    catalog = _load_dataframe(CATALOG_QUERY)
    logger.info("Loaded purchases rows: %s, catalog rows: %s", len(purchases), len(catalog))

    # Build features
    purchase_feat, feat_cols_p = build_feature_df(purchases)
    product_feat, feat_cols_c = build_feature_df(catalog)

    # Log feature column differences for debugging
    only_in_purchases = set(feat_cols_p) - set(feat_cols_c)
    only_in_catalog = set(feat_cols_c) - set(feat_cols_p)
    logger.info("Features only in purchases: %s", sorted(only_in_purchases))
    logger.info("Features only in catalog: %s", sorted(only_in_catalog))

    # Align feature columns (combine all unique columns from both)
    all_feat_cols = sorted(set(feat_cols_p) | set(feat_cols_c))

    # Add missing columns with zeros
    for col in all_feat_cols:
        if col not in purchase_feat.columns:
            purchase_feat[col] = 0
        if col not in product_feat.columns:
            product_feat[col] = 0

    # Normalize features with aligned columns
    Xp = normalize_features(purchase_feat[all_feat_cols].values)
    Xq = normalize_features(product_feat[all_feat_cols].values)

    purchase_feat["_vec"] = list(Xp)
    product_feat["_vec"] = list(Xq)

    # Compute user profiles (카테고리별 + 전체)
    user_profiles = compute_user_profiles_by_subcategory(purchase_feat, all_feat_cols)
    # 전체 구매 이력의 평균 프로필 (fallback용)
    user_profile_overall = purchase_feat[all_feat_cols].values.mean(axis=0)
    base_norm_price = compute_baseline_normalized_price(purchase_feat)
    avg_qty = compute_avg_quantity(purchases)

    # 카테고리 매칭 로깅
    user_categories = set(user_profiles.keys())
    catalog_categories = set(product_feat["small_category"].unique())
    logger.info(f"사용자 구매 카테고리: {sorted(user_categories)}")
    logger.info(f"카탈로그 카테고리 수: {len(catalog_categories)}")
    logger.info(f"매칭되는 카테고리: {sorted(user_categories & catalog_categories)}")

    records = []

    for _, row in product_feat.iterrows():
        sub = row["small_category"]

        # 하이브리드 방식: 카테고리 매칭 우선, 안 되면 전체 프로필 사용
        if sub in user_profiles:
            # 1순위: 카테고리 매칭 (정확한 개인화)
            user_vec = user_profiles[sub]
            base = float(base_norm_price.get(sub, 0))
            qty = float(avg_qty.get(sub, 1))
        else:
            # 2순위: 전체 프로필 사용 (일반 개인화)
            user_vec = user_profile_overall
            # 전체 평균 가격과 수량 사용
            base = float(base_norm_price.mean()) if len(base_norm_price) > 0 else 0
            qty = float(avg_qty.mean()) if len(avg_qty) > 0 else 1

        item_vec = row["_vec"]

        # Similarity calculation
        sim = float(np.dot(user_vec, item_vec) /
                   (np.linalg.norm(user_vec) * np.linalg.norm(item_vec) + 1e-8))

        # Savings calculation (normalized price based)
        norm_price = float(row["normalized_price"])

        if base > 0:
            save = max(0, base - norm_price)
            save_ratio = save / base
            # dampen excessive ratios
            save_ratio = save_ratio / (1 + save_ratio)
            save_ratio = min(save_ratio, 0.5)
        else:
            save = 0
            save_ratio = 0

        total_save = save * qty

        # Purchase frequency weight (number of purchases in this subcategory)
        freq_weight = max(1.0, float(len(purchase_feat[purchase_feat["small_category"] == sub])))

        # Final score with frequency weight
        score = (alpha * sim + beta * save_ratio) * np.log1p(freq_weight)

        records.append({
            "product_id": row["product_id"],
            "small_category": sub,
            "category": row["category"],
            "product_name": row["product_name"],
            "platform": row.get("platform", None),
            "price": row["price"],
            "unit_volume": row["unit_volume"],
            "unit_base": row["unit_base"],
            "unit_price": row["unit_price"],
            "normalized_price": norm_price,
            "user_avg_normalized_price": base,
            "savings_normalized": save,
            "savings_ratio_pct": save_ratio * 100,
            "expected_total_savings": total_save,
            "similarity": sim,
            "final_score": score,
            "reviews": row["reviews"],
            "rating": row["rating"],
            "image_url": row.get("image_url", ""),
            "product_url": row.get("product_url", ""),
        })

    # 매칭되는 카테고리가 없으면 인기 상품 추천으로 fallback
    if not records:
        logger.warning("No matching products found - falling back to popular products")
        # 인기 상품 추천: 리뷰 수와 평점 기반
        popular = product_feat.copy()
        popular["popularity_score"] = (
            np.log1p(popular["reviews"]) * 0.7 + popular["rating"] * 0.3
        )
        popular = popular.sort_values("popularity_score", ascending=False).head(top_k)

        output_cols = [
            "product_id", "small_category", "category", "product_name", "platform",
            "price", "unit_volume", "unit_price", "normalized_price",
            "reviews", "rating", "image_url", "product_url"
        ]
        existing_cols = [col for col in output_cols if col in popular.columns]
        result = popular[existing_cols].to_dict(orient="records")

        # rank 추가
        for i, item in enumerate(result):
            item["rank"] = i + 1
            item["similarity"] = 0.0
            item["final_score"] = float(item.get("popularity_score", 0))
            item["savings_ratio_pct"] = 0.0

        return result

    df = pd.DataFrame(records).sort_values("final_score", ascending=False)

    # Exclude already bought products if requested
    if exclude_bought and len(purchases) > 0:
        bought = purchases["product_name"].dropna().unique().tolist()
        df = df[~df["product_name"].isin(bought)]

    # Diversity selection: one per subcategory
    selected = []
    seen = set()

    for _, row in df.iterrows():
        if row["small_category"] not in seen:
            selected.append(row)
            seen.add(row["small_category"])
        if len(selected) == top_k:
            break

    final = pd.DataFrame(selected).reset_index(drop=True)
    final.insert(0, "rank", final.index + 1)

    # Select columns for output
    output_cols = [
        "rank",
        "product_id",
        "small_category",
        "category",
        "product_name",
        "platform",
        "price",
        "unit_volume",
        "unit_price",
        "normalized_price",
        "savings_ratio_pct",
        "similarity",
        "final_score",
        "reviews",
        "rating",
        "image_url",
        "product_url",
    ]
    existing_cols = [col for col in output_cols if col in final.columns]

    return final[existing_cols].to_dict(orient="records")


def run_server():
    """Run the FastMCP server."""
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8001,
        path="/mcp",
        stateless_http=True,
    )


if __name__ == "__main__":
    run_server()

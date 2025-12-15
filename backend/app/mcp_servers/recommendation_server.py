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
mcp = FastMCP("recommendation_system", stateless_http=True)

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

    # 🔥 Calculate normalized price (근본 수정)
    # unit_volume이 "1"이면 unit_price가 1.0으로 잘못 저장되어 있음
    # 이 경우 price/unit_base를 사용 (개당 가격)

    # unit_price가 유효한 경우 (100원 이상)만 사용
    valid_unit_price = (
        np.isfinite(df["unit_price"]) &
        (df["unit_price"] >= 100)
    )

    df["normalized_price"] = np.where(
        valid_unit_price,
        df["unit_price"],  # 유효하면 unit_price 사용
        df["price"] / df["unit_base"]  # 무효하면 price/unit_base 사용
    )

    # Inf/-Inf 처리
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


def compute_dual_baseline(df):
    """카테고리별로 용량형/단품형 baseline을 각각 계산.

    Returns:
        dict: {
            "카테고리명": {
                "unit_based": 용량당 가격 baseline,
                "item_based": 개당 가격 baseline,
                "avg_quantity": 평균 구매 수량
            }
        }
    """
    df = df.copy()
    df["normalized_price"] = pd.to_numeric(df["normalized_price"], errors="coerce").fillna(0)
    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)
    df["quantity"] = pd.to_numeric(df.get("quantity", 1), errors="coerce").fillna(1)
    df["unit_volume"] = df["unit_volume"].astype(str)

    baselines = {}

    for category, group in df.groupby("small_category"):
        # 용량형 상품 (unit_volume != "1")
        unit_based_items = group[group["unit_volume"] != "1"]
        # 단품형 상품 (unit_volume == "1")
        item_based_items = group[group["unit_volume"] == "1"]

        # 용량당 baseline 계산
        if len(unit_based_items) > 0:
            unit_baseline = (
                (unit_based_items["normalized_price"] * unit_based_items["quantity"]).sum()
                / max(unit_based_items["quantity"].sum(), 1)
            )
        else:
            unit_baseline = 0

        # 개당 baseline 계산
        if len(item_based_items) > 0:
            item_baseline = (
                (item_based_items["price"] * item_based_items["quantity"]).sum()
                / max(item_based_items["quantity"].sum(), 1)
            )
        else:
            item_baseline = 0

        # 평균 구매 수량
        avg_qty = group["quantity"].mean()

        baselines[category] = {
            "unit_based": float(unit_baseline),
            "item_based": float(item_baseline),
            "avg_quantity": float(avg_qty),
            "unit_count": len(unit_based_items),
            "item_count": len(item_based_items)
        }

    return baselines


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

    # 🆕 이중 baseline 계산 (용량형/단품형 분리)
    dual_baselines = compute_dual_baseline(purchase_feat)

    # 🔍 Debug: 이중 baseline prices
    logger.info("🔍 사용자 카테고리별 이중 baseline:")
    for cat, baselines in dual_baselines.items():
        logger.info(f"  {cat}:")
        logger.info(f"    - 용량당 baseline: {baselines['unit_based']:,.2f}원 (용량형 {baselines['unit_count']}개)")
        logger.info(f"    - 개당 baseline: {baselines['item_based']:,.2f}원 (단품형 {baselines['item_count']}개)")
        logger.info(f"    - 평균 수량: {baselines['avg_quantity']:.2f}개")

    # 카테고리 매칭 로깅
    user_categories = set(user_profiles.keys())
    catalog_categories = set(product_feat["small_category"].unique())
    logger.info(f"사용자 구매 카테고리: {sorted(user_categories)}")
    logger.info(f"카탈로그 카테고리 수: {len(catalog_categories)}")
    logger.info(f"매칭되는 카테고리: {sorted(user_categories & catalog_categories)}")

    records = []

    for _, row in product_feat.iterrows():
        sub = row["small_category"]

        # 카테고리 baseline 정보 가져오기
        if sub not in dual_baselines:
            # 구매 이력 없는 카테고리는 전체 프로필 사용
            if sub in user_profiles:
                user_vec = user_profiles[sub]
            else:
                user_vec = user_profile_overall
            base = 0
            qty = 1
            comparison_price = float(row["normalized_price"])
        else:
            baseline_info = dual_baselines[sub]

            # 🆕 상품 타입 감지 (용량형 vs 단품형)
            product_type = "item_based" if str(row["unit_volume"]) == "1" else "unit_based"

            # 타입에 맞는 baseline 선택
            if product_type == "unit_based":
                # 용량형 상품: 용량당 가격으로 비교
                base = baseline_info["unit_based"]
                comparison_price = float(row["normalized_price"])
            else:
                # 단품형 상품: 개당 가격으로 비교
                base = baseline_info["item_based"]
                comparison_price = float(row["price"])

            qty = baseline_info["avg_quantity"]

            # 🔥 필터링: baseline의 3배 이상 비싼 상품 제외
            if base > 0 and comparison_price > base * 3:
                continue  # 너무 비싼 상품은 건너뛰기

            # User vector 설정
            if sub in user_profiles:
                user_vec = user_profiles[sub]
            else:
                user_vec = user_profile_overall

        item_vec = row["_vec"]

        # Similarity calculation
        sim = float(np.dot(user_vec, item_vec) /
                   (np.linalg.norm(user_vec) * np.linalg.norm(item_vec) + 1e-8))

        # 🆕 Savings calculation (타입별 가격 비교)
        if base > 0:
            save = max(0, base - comparison_price)
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

        # 🆕 추가 정보 계산
        product_type = "item_based" if str(row["unit_volume"]) == "1" else "unit_based"
        norm_price = float(row["normalized_price"])

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
            "product_type": product_type,  # 🆕 상품 타입 추가
            "comparison_price": comparison_price,  # 🆕 실제 비교 가격
            "user_avg_baseline": base,  # 🆕 타입에 맞는 baseline
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
        "product_type",  # 🆕 상품 타입 (unit_based/item_based)
        "comparison_price",  # 🆕 실제 비교한 가격
        "user_avg_baseline",  # 🆕 사용자 평균 baseline
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
        path="/mcp/",
        stateless_http=True,
    )


if __name__ == "__main__":
    run_server()

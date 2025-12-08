import React, { useEffect, useState } from "react";
import { useCart, useAuth } from "../../../contexts/AppProvider";
import { useModal } from "../../../contexts/ModalContext";
import { purchaseHistoryApi } from "../../../services/api/purchaseHistory";
import styles from "./ProductDetailModal.module.css";

export const ProductDetailModal: React.FC = () => {
  const { items: cartItems, refreshCart } = useCart();
  const { user } = useAuth();
  const { isOpen, product, closeModal, openProductModal } = useModal();
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Handle body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeModal]);

  const derivedCartIndex = product
    ? typeof product.cartIndex === "number"
      ? product.cartIndex
      : cartItems.findIndex((item) => item.id === product.id)
    : -1;

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isOpen || !product) {
    return null;
  }
  const currentCartItem =
    derivedCartIndex >= 0 ? cartItems[derivedCartIndex] : undefined;
  const displayName = currentCartItem?.name ?? product.name;
  const displayPrice = currentCartItem?.price ?? product.price;
  const displayOriginalPrice =
    typeof product.originalPrice === "number"
      ? product.originalPrice
      : undefined;
  const displayImage = currentCartItem?.image ?? product.image;
  const displayCategory = currentCartItem?.category ?? product.category;
  const displayRating = product.rating;
  const displayReviewCount = product.reviewCount;
  const displayDescription = product.description;
  const displayUrl = currentCartItem?.url ?? product.url;
  const displayPlatform = currentCartItem?.platformName ?? product.platformName;


  const formattedPrice =
    typeof displayPrice === "number"
      ? `₩${displayPrice.toLocaleString()}`
      : null;

  const formattedOriginalPrice =
    typeof displayOriginalPrice === "number"
      ? `₩${displayOriginalPrice.toLocaleString()}`
      : null;

  const detailRows: { label: string; value: string }[] = [];
  if (displayCategory) {
    detailRows.push({ label: "카테고리", value: displayCategory });
  }
  if (displayPlatform) {
    detailRows.push({ label: "플랫폼", value: displayPlatform });
  }
  if (displayRating) {
    detailRows.push({ label: "평점", value: `${displayRating} / 5` });
  }
  if (typeof displayReviewCount === "number") {
    detailRows.push({
      label: "리뷰 수",
      value: `${displayReviewCount.toLocaleString()}개`,
    });
  }

  const linkHost = (() => {
    if (!displayUrl) return null;
    try {
      const url = new URL(displayUrl);
      return url.hostname.replace("www.", "");
    } catch {
      return displayUrl;
    }
  })();

  const handleNavigate = (direction: "prev" | "next") => {
    if (!cartItems.length) return;
    const total = cartItems.length;
    const baseIndex = derivedCartIndex >= 0 ? derivedCartIndex : 0;
    const nextIndex =
      direction === "next"
        ? (baseIndex + 1) % total
        : (baseIndex - 1 + total) % total;
    const nextItem = cartItems[nextIndex];
    openProductModal({
      id: nextItem.id,
      name: nextItem.name,
      price: nextItem.price,
      ...(nextItem.image && { image: nextItem.image }),
      ...(nextItem.url && { url: nextItem.url }),
      ...(nextItem.category && { category: nextItem.category }),
      ...(nextItem.platformName && { platformName: nextItem.platformName }),
      cartIndex: nextIndex,
    });
  };

  const hasCartNavigation = derivedCartIndex >= 0 && cartItems.length > 1;
  const canPurchase = !!currentCartItem && !!user;

  const handleCompletePurchase = async () => {
    if (!canPurchase || !currentCartItem) {
      alert("로그인 상태에서 장바구니 상품만 구매할 수 있습니다.");
      return;
    }
    const productId = Number(currentCartItem.productId ?? currentCartItem.id);
    if (!productId) {
      alert("구매할 상품 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsPurchasing(true);
      await purchaseHistoryApi.checkout({
        user_id: user!.id,
        product_ids: [productId],
      });
      await refreshCart();
      alert("구매가 완료되었습니다.");
      closeModal();
    } catch (error: any) {
      alert(error?.message || "구매 처리에 실패했습니다.");
      console.error("checkout failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className={styles.modalContainer}>
        {/* Close Button */}
        <button
          onClick={closeModal}
          className={styles.closeButton}
          aria-label="모달 닫기"
          type="button"
        >
          ✕
        </button>

        {/* Left Side - Product Image */}
        <div className={styles.previewSection}>
          <div className={styles.previewCard}>
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className={styles.previewImage}
                loading="lazy"
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                <span role="img" aria-label="상품 이미지 없음">
                  🛍️
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Product Summary Panel */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryContent}>
            <div className={styles.summaryHeader}>
              <div>
                <p className={styles.summaryEyebrow}>선택한 상품</p>
                <h2 className={styles.summaryTitle}>{displayName}</h2>
              </div>
            </div>

            <div className={styles.priceBlock}>
              {formattedOriginalPrice && (
                <span className={styles.originalPrice}>
                  {formattedOriginalPrice}
                </span>
              )}
              {formattedPrice && (
                <span className={styles.currentPrice}>{formattedPrice}</span>
              )}
            </div>

            {detailRows.length > 0 && (
              <div className={styles.metaGrid}>
                {detailRows.map((meta) => (
                  <div
                    key={`${meta.label}-${meta.value}`}
                    className={styles.metaItem}
                  >
                    <span className={styles.metaLabel}>{meta.label}</span>
                    <strong className={styles.metaValue}>{meta.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {displayDescription && (
              <div className={styles.descriptionBox}>
                <p>{displayDescription}</p>
              </div>
            )}

            {displayUrl && (
              <button
                type="button"
                className={styles.productLinkCard}
                onClick={() => window.open(displayUrl, "_blank", "noopener,noreferrer")}
              >
                <div className={styles.cardIcon}>🛒</div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>상품으로 이동하기</span>
                  <span className={styles.cardSubtitle}>{linkHost || "쇼핑몰에서 확인"}</span>
                </div>
                <div className={styles.cardArrow}>→</div>
              </button>
            )}

            {displayRating && (
              <div className={styles.reviewSection}>
                <h4 className={styles.sectionTitle}>
                  <span className={styles.reviewIcon}>⭐</span> 고객 리뷰
                </h4>
                <div className={styles.ratingRow}>
                  <span className={styles.rating}>{displayRating}</span>
                  <span className={styles.reviewCount}>
                    {displayReviewCount
                      ? `(${displayReviewCount.toLocaleString()})`
                      : ""}
                  </span>
                </div>
                <p className={styles.reviewSnippet}>
                  쇼핑몰에서 자세한 후기를 확인해보세요.
                </p>
              </div>
            )}

            {hasCartNavigation && (
              <div className={styles.navActions}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => handleNavigate("prev")}
                >
                  ← 이전 상품
                </button>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => handleNavigate("next")}
                >
                  다음 상품 →
                </button>
              </div>
            )}
            {canPurchase && (
              <button
                type="button"
                className={styles.purchaseActionButton}
                onClick={handleCompletePurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? "구매 처리중..." : "구매 완료"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

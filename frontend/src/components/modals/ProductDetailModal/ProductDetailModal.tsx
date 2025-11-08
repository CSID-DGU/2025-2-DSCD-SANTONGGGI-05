import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../../contexts/AppProvider";
import { useModal } from "../../../contexts/ModalContext";
import styles from "./ProductDetailModal.module.css";

export const ProductDetailModal: React.FC = () => {
  const { items: cartItems } = useCart();
  const { isOpen, product, closeModal, openProductModal } = useModal();
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Reset iframe state when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsIframeLoading(true);
      setIframeError(false);
    } else {
      document.body.style.overflow = "unset";
      setIsIframeLoading(false);
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

  const derivedCartIndex = useMemo(() => {
    if (!product) {
      return -1;
    }
    if (typeof product.cartIndex === "number") {
      return product.cartIndex;
    }
    return cartItems.findIndex((item) => item.id === product.id);
  }, [product, cartItems]);

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

  const handleDirectPurchase = () => {
    if (displayUrl) {
      window.open(displayUrl, "_blank", "noopener,noreferrer");
    }
  };

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

        {/* Left Side - preview */}
        <div className={styles.previewSection}>
          <div className={styles.previewCard}>
            {displayUrl && !iframeError ? (
              <iframe
                src={displayUrl}
                title={`${displayName} 미리보기`}
                className={styles.previewIframe}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                onLoad={() => setIsIframeLoading(false)}
                onError={() => {
                  setIsIframeLoading(false);
                  setIframeError(true);
                }}
              />
            ) : iframeError ? (
              <div className={styles.previewFallback}>
                <p className={styles.fallbackTitle}>외부 사이트를 표시할 수 없습니다.</p>
                <p className={styles.helperText}>
                  쇼핑몰이 프레임 내 표시를 제한하고 있어 새 탭에서 확인해주세요.
                </p>
              </div>
            ) : displayImage ? (
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

            <div className={styles.previewActions}>
              {displayUrl ? (
                <button
                  type="button"
                  className={styles.openExternalButton}
                  onClick={handleDirectPurchase}
                >
                  새 탭에서 보기
                </button>
              ) : (
                <p className={styles.helperText}>연결할 상품 URL이 없습니다.</p>
              )}
              {displayUrl && isIframeLoading && !iframeError && (
                <p className={styles.helperText}>페이지 불러오는 중...</p>
              )}
            </div>
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
              <div className={styles.linkRow}>
                <span className={styles.linkLabel}>상품 페이지</span>
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkValue}
                >
                  {linkHost || "새 탭에서 열기"}
                </a>
              </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

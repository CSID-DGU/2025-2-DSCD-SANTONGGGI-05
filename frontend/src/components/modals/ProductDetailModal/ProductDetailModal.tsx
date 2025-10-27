import React, { useState, useEffect } from 'react';
import { useModal } from '../../../contexts/ModalContext';
import styles from './ProductDetailModal.module.css';

export const ProductDetailModal: React.FC = () => {
  const { isOpen, product, closeModal } = useModal();
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Reset iframe state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsIframeLoading(true);
      setIframeError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeModal]);

  if (!isOpen || !product) {
    return null;
  }

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  const handleIframeError = () => {
    setIsIframeLoading(false);
    setIframeError(true);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleDirectPurchase = () => {
    if (product.url) {
      window.open(product.url, '_blank', 'noopener,noreferrer');
    }
  };

  const shippingFee = 0; // 무료 배송
  const totalAmount = (product.price || 0) + shippingFee;

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

        {/* Left Side - iframe */}
        <div className={styles.iframeSection}>
          {isIframeLoading && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>상품 페이지를 불러오는 중...</p>
            </div>
          )}

          {iframeError ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3 className={styles.errorTitle}>페이지를 불러올 수 없습니다</h3>
              <p className={styles.errorMessage}>
                일부 쇼핑몰은 보안 정책상 외부 사이트에서 표시할 수 없습니다.
              </p>
              <button
                onClick={handleDirectPurchase}
                className={styles.openExternalButton}
                type="button"
              >
                새 탭에서 열기 →
              </button>
            </div>
          ) : (
            product.url && (
              <iframe
                src={product.url}
                className={styles.productIframe}
                title={`${product.name} 상세 정보`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                allow="payment"
              />
            )
          )}
        </div>

        {/* Right Side - Order Summary Panel */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryContent}>
            {/* Header */}
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>주문 요약</h2>
            </div>

            {/* Product Info */}
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>{product.price?.toLocaleString()}원</span>
                {product.discount && (
                  <span className={styles.quantityBadge}>{product.discount}%</span>
                )}
              </div>
            </div>

            {/* Add to Cart Button */}
            <button className={styles.addToCartButton} type="button">
              추가
            </button>

            {/* Divider */}
            <div className={styles.divider}></div>

            {/* Payment Summary */}
            <div className={styles.paymentSection}>
              <h4 className={styles.sectionTitle}>결제 금액</h4>

              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>상품금액</span>
                <span className={styles.paymentValue}>{(product.price || 0).toLocaleString()}원</span>
              </div>

              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>배송비</span>
                <span className={styles.paymentValue}>무료</span>
              </div>

              <div className={`${styles.paymentRow} ${styles.totalRow}`}>
                <span className={styles.totalLabel}>총 결제금액</span>
                <span className={styles.totalValue}>{totalAmount.toLocaleString()}원</span>
              </div>
            </div>

            {/* Divider */}
            <div className={styles.divider}></div>

            {/* Delivery Info */}
            <div className={styles.deliverySection}>
              <h4 className={styles.sectionTitle}>
                <span className={styles.deliveryIcon}>📦</span> 배송 정보
              </h4>
              <p className={styles.deliveryText}>로켓 배송 · 내일 도착 예정</p>
            </div>

            {/* Benefits */}
            <div className={styles.benefitsSection}>
              <h4 className={styles.sectionTitle}>
                <span className={styles.benefitIcon}>🎁</span> 적용 가능 혜택
              </h4>
              <ul className={styles.benefitsList}>
                <li className={styles.benefitItem}>첫 구매 5% 할인</li>
                <li className={styles.benefitItem}>적립금 15원</li>
              </ul>
            </div>

            {/* Reviews */}
            {product.rating && (
              <div className={styles.reviewSection}>
                <h4 className={styles.sectionTitle}>
                  <span className={styles.reviewIcon}>⭐</span> 고객 리뷰
                </h4>
                <div className={styles.ratingRow}>
                  <span className={styles.rating}>{product.rating}</span>
                  <span className={styles.reviewCount}>
                    {product.reviewCount ? `(${product.reviewCount.toLocaleString()})` : ''}
                  </span>
                </div>
                <p className={styles.reviewSnippet}>*배송도 빠르고 품질도 만족입니다!*</p>
              </div>
            )}

            {/* Direct Purchase Button */}
            <button
              className={styles.purchaseButton}
              onClick={handleDirectPurchase}
              type="button"
            >
              바로 구매
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

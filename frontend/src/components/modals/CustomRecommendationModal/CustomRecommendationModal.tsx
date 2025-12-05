import React from 'react';
import { useCart } from '@/contexts/AppProvider';
import { DEFAULT_CART_IMAGE_URL, DEFAULT_CART_PRODUCT_URL } from '@/constants/cart';
import styles from './CustomRecommendationModal.module.css';

interface Product {
  product_id: number;
  name?: string;
  price: number;
  platform_name: string;
  category: string;
  review: number;
  image_url?: string;
  product_url?: string;
  savings_ratio_pct?: number | string;  // snake_case 응답
  savingsRatio?: number;                // camelCase 응답 대응
  unit_volume?: string;
  unit_price?: number;
  similarity?: number | string;
}

// 추천 등급 타입
type RecommendationGrade = 'best-deal' | 'saver' | 'perfect-match' | 'normal';

interface RecommendationBadge {
  grade: RecommendationGrade;
  label: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
}

const FALLBACK_SAVINGS = 12; // % range used when backend data missing
const FALLBACK_SIMILARITY = 0.65;

// 추천 등급 판정 함수
function parseNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRecommendationGrade(product: Product): RecommendationBadge {
  const savingsRaw = parseNumber(product.savings_ratio_pct ?? product.savingsRatio);
  const savings = savingsRaw > 0 ? savingsRaw : FALLBACK_SAVINGS;
  const similarityRaw = parseNumber(product.similarity);
  const similarity = similarityRaw > 0 ? similarityRaw : FALLBACK_SIMILARITY;

  // 구매이력이 없어서 savings_ratio_pct가 100%인 경우는 제외
  const hasSavingsData = savings > 0 && savings < 100;
  const isSaver = hasSavingsData && savings >= 2;
  const isPerfectMatch = similarity >= 0.6;

  if (isSaver && isPerfectMatch) {
    return {
      grade: 'best-deal',
      label: '완벽추천',
      description: `절약률과 유사도 모두 만족하는 상품! ${savings.toFixed(1)}% | 유사도 ${(similarity * 100).toFixed(1)}%`,
      icon: '🏆',
      color: '#9333ea',
      borderColor: '#9333ea',
    };
  }

  if (isSaver) {
    return {
      grade: 'saver',
      label: '절약 가능',
      description: `구매이력 대비 ${savings.toFixed(1)}% 절약!`,
      icon: '💡',
      color: '#16a34a',
      borderColor: '#16a34a',
    };
  }

  if (isPerfectMatch) {
    return {
      grade: 'perfect-match',
      label: '취향저격',
      description: `유사도: ${(similarity * 100).toFixed(1)}% - 딱 맞는 상품!`,
      icon: '🎯',
      color: '#2563eb',
      borderColor: '#2563eb',
    };
  }

  return {
    grade: 'normal',
    label: '',
    description: '',
    icon: '',
    color: '#6b7280',
    borderColor: '#e5e7eb',
  };
}

interface CustomRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

// 카테고리별 이모지 매핑
const categoryEmojis: Record<string, string> = {
  '생수': '💧',
  '음료': '🥤',
  '생활용품': '🧴',
  '청소용품': '🧹',
  '식품': '🍔',
  '기타': '📦'
};

export const CustomRecommendationModal: React.FC<CustomRecommendationModalProps> = ({
  isOpen,
  onClose,
  products
}) => {
  const { addItem } = useCart();

  const handleAddToCart = async (product: Product) => {
    try {
      const fallbackName = `${product.category} - ${product.platform_name}`;
      await addItem({
        productId: product.product_id.toString(),
        name: product.name || fallbackName,
        price: product.price,
        platformName: product.platform_name,
        imageUrl: product.image_url ?? DEFAULT_CART_IMAGE_URL,
        productUrl: product.product_url || DEFAULT_CART_PRODUCT_URL,
        category: product.category,
      });
      alert(`${product.name || fallbackName} 상품이 장바구니에 추가되었습니다.`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>맞춤 추천 상품</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {products.length === 0 ? (
            <div className={styles.emptyState}>
              <p>추천 상품이 없습니다.</p>
            </div>
          ) : (
            <div className={styles.productList}>
              {products.map((product, index) => {
                const emoji = categoryEmojis[product.category] || '📦';
                const imageSrc = product.image_url && product.image_url.length > 0
                  ? product.image_url
                  : undefined;

                // 추천 등급 계산
                const badge = getRecommendationGrade(product);
                const savingsRaw = parseNumber(product.savings_ratio_pct ?? product.savingsRatio);
                const similarityRaw = parseNumber(product.similarity);
                const savingsValue = savingsRaw > 0 ? savingsRaw : FALLBACK_SAVINGS;
                const similarityValue = similarityRaw > 0 ? similarityRaw : FALLBACK_SIMILARITY;
                const cardStyle = badge.grade !== 'normal'
                  ? { borderColor: badge.borderColor, borderWidth: '2px' }
                  : {};

                return (
                  <div
                    key={product.product_id}
                    className={styles.productCard}
                    style={cardStyle}
                  >
                    {/* Rank Badge */}
                    <div className={styles.productRank}>#{index + 1}</div>

                    {/* 추천 등급 배지 */}
                    {badge.grade !== 'normal' && (
                      <div
                        className={styles.gradeBadge}
                        style={{ backgroundColor: badge.color }}
                      >
                        <span className={styles.gradeIcon}>{badge.icon}</span>
                        <span className={styles.gradeLabel}>{badge.label}</span>
                      </div>
                    )}

                    {/* Product Image */}
                    <div className={styles.productImage}>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.name || `${product.category} - ${product.platform_name}`}
                          className={styles.productThumbnail}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.productEmoji}>{emoji}</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className={styles.productInfo}>
                      <div className={styles.productCategory}>{product.category}</div>
                      <h4 className={styles.productName}>
                        {product.name || `${product.category} - ${product.platform_name}`}
                      </h4>

                      {/* Pricing */}
                      <div className={styles.productPricing}>
                        <span className={styles.regularPrice}>
                          ₩{product.price.toLocaleString()}
                        </span>
                      </div>

                      {(savingsValue > 0 || similarityValue > 0) && (
                        <div className={styles.metricRow}>
                          {savingsValue > 0 && (
                            <span className={styles.metricBadge}>
                              💰 약 {savingsValue.toFixed(1)}% 절약
                            </span>
                          )}
                          {similarityValue > 0 && (
                            <span className={styles.metricBadge}>
                              🎯 유사도 {(similarityValue * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* 추천 등급 설명 */}
                      {badge.grade !== 'normal' && badge.description && (
                        <div
                          className={styles.gradeDescription}
                          style={{ borderLeftColor: badge.color }}
                        >
                          {badge.description}
                        </div>
                      )}

                      {/* Platform Badge */}
                      <div className={styles.platformBadge}>
                        {product.platform_name}
                      </div>

                      {/* Actions */}
                      <div className={styles.productActions}>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={styles.addToCartBtn}
                          type="button"
                        >
                          <span className={styles.cartIcon}>🛒</span>
                          장바구니
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

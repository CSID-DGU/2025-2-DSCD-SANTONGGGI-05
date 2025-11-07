import React from 'react';
import { useCart } from '@/contexts/AppProvider';
import { DEFAULT_CART_IMAGE_URL, DEFAULT_CART_PRODUCT_URL } from '@/constants/cart';
import styles from './ChatRecommendationModal.module.css';

// Type 1: 채팅 응답에서 받은 상품 추천 데이터
interface Product {
  product_id: number;
  name: string;
  price: number;
  platform_name: string;
  category: string;
  review: number;
  image_url?: string;
  product_url?: string;
}

interface ChatRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];  // 백엔드에서 받은 recommendationItems
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

export const ChatRecommendationModal: React.FC<ChatRecommendationModalProps> = ({
  isOpen,
  onClose,
  products
}) => {
  const { addItem } = useCart();

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem({
        productId: String(product.product_id),
        name: product.name,
        price: product.price,
        platformName: product.platform_name,
        imageUrl: product.image_url ?? DEFAULT_CART_IMAGE_URL,
        productUrl: product.product_url ?? DEFAULT_CART_PRODUCT_URL,
      });
      alert(`${product.name}을(를) 장바구니에 추가했습니다!`);
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🎯 AI 상품 추천</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
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

                return (
                  <div key={product.product_id} className={styles.productCard}>
                    {/* Rank Badge */}
                    <div className={styles.rankBadge}>#{index + 1}</div>

                    {/* Product Image */}
                    <div className={styles.productImage}>
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className={styles.productThumbnail}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.productEmoji}>{emoji}</span>
                      )}
                    </div>

                    {/* Product Info Container */}
                    <div className={styles.productInfoContainer}>
                      {/* Product Info */}
                      <div className={styles.productInfo}>
                        <div className={styles.productHeader}>
                          <span className={styles.platform}>{product.platform_name}</span>
                          <span className={styles.category}>{product.category}</span>
                        </div>

                        {/* Product Name */}
                        <h3 className={styles.productName}>{product.name}</h3>

                        <div className={styles.productDetails}>
                          <div className={styles.priceSection}>
                            <span className={styles.price}>
                              ₩{product.price.toLocaleString()}
                            </span>
                          </div>

                          <div className={styles.reviewSection}>
                            <span className={styles.reviewIcon}>⭐</span>
                            <span className={styles.reviewCount}>
                              리뷰 {product.review.toLocaleString()}개
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        className={styles.addToCartButton}
                        onClick={() => handleAddToCart(product)}
                      >
                        <span className={styles.cartIcon}>🛒</span>
                        장바구니 추가
                      </button>
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

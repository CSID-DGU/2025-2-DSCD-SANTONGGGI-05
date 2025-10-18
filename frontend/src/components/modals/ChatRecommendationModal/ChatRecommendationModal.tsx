import React from 'react';
import { useCart } from '@/contexts/AppProvider';
import styles from './ChatRecommendationModal.module.css';

// Type 1: 채팅 응답에서 받은 상품 추천 데이터
interface Product {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  review: number;
}

interface ChatRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];  // 백엔드에서 받은 recommendationItems
}

export const ChatRecommendationModal: React.FC<ChatRecommendationModalProps> = ({
  isOpen,
  onClose,
  products
}) => {
  const { addItem } = useCart();

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(String(product.product_id), 1);
      alert(`${product.category} 상품을 장바구니에 추가했습니다!`);
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
              {products.map((product, index) => (
                <div key={product.product_id} className={styles.productCard}>
                  {/* Rank Badge */}
                  <div className={styles.rankBadge}>#{index + 1}</div>

                  {/* Product Info */}
                  <div className={styles.productInfo}>
                    <div className={styles.productHeader}>
                      <span className={styles.platform}>{product.platform_name}</span>
                      <span className={styles.category}>{product.category}</span>
                    </div>

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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

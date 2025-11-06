import React from 'react';
import { useCart } from '@/contexts/AppProvider';
import { DEFAULT_CART_IMAGE_URL, DEFAULT_CART_PRODUCT_URL } from '@/constants/cart';
import styles from './CustomRecommendationModal.module.css';

interface Product {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  url: string;
  image_url?: string;
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

// 카테고리별 추천 이유
const categoryReasons: Record<string, string> = {
  '생수': '자주 구매하시는 생수 카테고리 상품입니다',
  '음료': '음료 카테고리에서 인기 있는 상품입니다',
  '생활용품': '생활에 필요한 필수 아이템입니다',
  '청소용품': '청소에 효과적인 추천 상품입니다',
  '식품': '건강한 식생활을 위한 추천입니다',
  '기타': '고객님께 추천하는 상품입니다'
};

export const CustomRecommendationModal: React.FC<CustomRecommendationModalProps> = ({
  isOpen,
  onClose,
  products
}) => {
  const { addItem } = useCart();

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem({
        productId: product.product_id.toString(),
        name: `${product.category} - ${product.platform_name}`,
        price: product.price,
        platformName: product.platform_name,
        imageUrl: product.image_url ?? DEFAULT_CART_IMAGE_URL,
        productUrl: product.url || DEFAULT_CART_PRODUCT_URL,
      });
      alert(`${product.category} 상품이 장바구니에 추가되었습니다.`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  const handleProductClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
                const reason = categoryReasons[product.category] || '추천 상품입니다';

                // 일부 상품에 할인 적용 (Mock)
                const hasDiscount = index % 3 === 0;
                const discount = hasDiscount ? Math.floor(Math.random() * 20) + 10 : undefined;
                const originalPrice = hasDiscount
                  ? Math.floor(product.price / (1 - discount! / 100))
                  : undefined;

                return (
                  <div key={product.product_id} className={styles.productCard}>
                    {/* Rank Badge */}
                    <div className={styles.productRank}>#{index + 1}</div>

                    {/* Product Image */}
                    <div className={styles.productImage}>
                      <span className={styles.productEmoji}>{emoji}</span>
                      {discount && (
                        <div className={styles.discountBadge}>
                          -{discount}%
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className={styles.productInfo}>
                      <div className={styles.productCategory}>{product.category}</div>
                      <h4 className={styles.productName}>
                        {product.category} - {product.platform_name}
                      </h4>

                      {/* Pricing */}
                      <div className={styles.productPricing}>
                        {discount && originalPrice ? (
                          <>
                            <span className={styles.originalPrice}>
                              ₩{originalPrice.toLocaleString()}
                            </span>
                            <span className={styles.discountPrice}>
                              ₩{product.price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className={styles.regularPrice}>
                            ₩{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Platform Badge */}
                      <div className={styles.platformBadge}>
                        {product.platform_name}
                      </div>

                      {/* Recommendation Reason */}
                      <div className={styles.recommendationReason}>
                        <span className={styles.reasonIcon}>💡</span>
                        <span className={styles.reasonText}>{reason}</span>
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
                        <button
                          onClick={() => handleProductClick(product.url)}
                          className={styles.viewProductBtn}
                          type="button"
                        >
                          상세보기
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

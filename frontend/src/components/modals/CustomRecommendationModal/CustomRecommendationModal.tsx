import React from 'react';
import { useCart } from '@/contexts/AppProvider';
import { DEFAULT_CART_IMAGE_URL, DEFAULT_CART_PRODUCT_URL } from '@/constants/cart';
import styles from './CustomRecommendationModal.module.css';

interface Product {
  product_id: number;
  name: string;
  price: number;
  platform_name: string;
  category: string;
  review: number;
  image_url?: string;
  product_url: string;
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

                return (
                  <div key={product.product_id} className={styles.productCard}>
                    {/* Rank Badge */}
                    <div className={styles.productRank}>#{index + 1}</div>

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

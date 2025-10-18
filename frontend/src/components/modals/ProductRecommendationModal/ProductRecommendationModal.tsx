import React, { useState, useEffect } from 'react';
import styles from './ProductRecommendationModal.module.css';
import { recommendationsApi, UIRecommendedProduct } from '@/services/api/recommendations';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useModal, useAuth } from '@/contexts/AppProvider';

interface ProductRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductRecommendationModal: React.FC<ProductRecommendationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [products, setProducts] = useState<UIRecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openProductModal } = useModal();
  const { user } = useAuth();

  // Load recommendations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = user?.id || 1123;

      const response = await recommendationsApi.getAllRecommendations({
        page: 'chat',
        user_id: userId
      });

      if (response.success && response.data && response.data.products) {
        // 상품 5개만 표시
        setProducts(response.data.products.slice(0, 5));
      } else {
        setError('추천 상품을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
      console.error('Recommendations loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: UIRecommendedProduct) => {
    console.log('Adding to cart:', product.name);
    // TODO: Integrate with cart context
  };

  const handleViewProduct = (product: UIRecommendedProduct) => {
    // Open product detail modal with iframe
    openProductModal({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      discount: product.discount,
      rating: product.rating,
      reviewCount: product.reviewCount,
      url: product.url,
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>상품 추천</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="medium" message="추천 상품을 불러오는 중..." />
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button onClick={loadRecommendations} className={styles.retryButton}>
                다시 시도
              </button>
            </div>
          ) : (
            <div className={styles.productList}>
              {products.map((product, index) => {
                const originalPrice = product.originalPrice || product.price;

                return (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.productRank}>#{index + 1}</div>

                    <div className={styles.productImage}>
                      <span className={styles.productEmoji}>{product.image}</span>
                      {product.discount && (
                        <div className={styles.discountBadge}>
                          -{product.discount}%
                        </div>
                      )}
                    </div>

                    <div className={styles.productInfo}>
                      <div className={styles.productCategory}>{product.category}</div>
                      <h4 className={styles.productName}>{product.name}</h4>

                      <div className={styles.productPricing}>
                        {product.discount ? (
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

                      <div className={styles.recommendationReason}>
                        <span className={styles.reasonIcon}>💡</span>
                        <span className={styles.reasonText}>{product.reason}</span>
                      </div>

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
                          onClick={() => handleViewProduct(product)}
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

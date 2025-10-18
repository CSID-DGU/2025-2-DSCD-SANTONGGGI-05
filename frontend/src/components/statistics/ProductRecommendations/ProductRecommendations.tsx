import React, { useState, useEffect } from 'react';
import styles from './ProductRecommendations.module.css';
import { recommendationsApi, UIRecommendedProduct } from '../../../services/api/recommendations';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useModal, useAuth } from '../../../contexts/AppProvider';

interface ProductRecommendationsProps {
  className?: string;
  page?: string;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  className,
  page = 'statistics'
}) => {
  const [products, setProducts] = useState<UIRecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openProductModal } = useModal();
  const { user } = useAuth();

  const recommendationsClasses = [
    styles.productRecommendations,
    className
  ].filter(Boolean).join(' ');

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadRecommendations is intentionally called only on mount

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // user_id 사용 (없으면 기본값 1123)
      const userId = user?.id || 1123;

      // 통합 API 사용 - UI 형식의 데이터를 한 번에 가져옴
      const response = await recommendationsApi.getAllRecommendations({
        page: page,
        user_id: userId
      });

      if (response.success && response.data && response.data.products) {
        setProducts(response.data.products);
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

  const handleRefresh = () => {
    loadRecommendations();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={recommendationsClasses}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>상품 추천</h3>
          <p className={styles.sectionSubtitle}>추천 상품 불러오는 중...</p>
        </div>
        <LoadingSpinner size="small" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={recommendationsClasses}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>상품 추천</h3>
          <p className={styles.sectionSubtitle}>오류가 발생했습니다</p>
        </div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>{error}</p>
          <button onClick={handleRefresh} style={{ marginTop: '10px' }}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={recommendationsClasses}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>상품 추천</h3>
        <p className={styles.sectionSubtitle}>맞춤 추천 상품 {products.length}개</p>
      </div>

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

    </div>
  );
};
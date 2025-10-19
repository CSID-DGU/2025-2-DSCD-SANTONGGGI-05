import React, { useState } from 'react';
import { useCart, useNavigation, useAuth } from '../../../contexts/AppProvider';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { RecommendationWeightModal } from '../../modals/RecommendationWeightModal';
import { CustomRecommendationModal } from '../../modals/CustomRecommendationModal';
import { recommendationsApi } from '../../../services/api/recommendations';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
  subtotal: number;
  isMinimized?: boolean;
  itemCount: number;
  className?: string;
}

interface CustomRecommendedProduct {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  url: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  isMinimized = false,
  itemCount,
  className
}) => {
  const { isLoading } = useCart();
  const { navigateTo } = useNavigation();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isCustomRecommendationModalOpen, setIsCustomRecommendationModalOpen] = useState(false);
  const [customRecommendations, setCustomRecommendations] = useState<CustomRecommendedProduct[]>([]);

  // Calculate total for minimized view
  const total = subtotal;

  const handleCheckout = async () => {
    if (isLoading || isCheckingOut || itemCount === 0) return;

    setIsCheckingOut(true);
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Checkout completed');
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePurchaseHistory = () => {
    if (isLoading) return;
    console.log('Navigate to purchase history page');
    navigateTo('purchase-history');
  };

  const handleStatistics = () => {
    if (isLoading) return;
    console.log('Navigate to statistics page');
    navigateTo('statistics');
  };

  const handleRecommendations = () => {
    if (isLoading) return;
    console.log('Open weight input modal for custom recommendations');
    setIsWeightModalOpen(true);
  };

  const handleWeightSubmit = async (rating: number, review: number) => {
    try {
      console.log(`Fetching custom recommendations with rating: ${rating}, review: ${review}`);

      // 가중치 모달 닫기
      setIsWeightModalOpen(false);

      // API 호출
      const userId = user?.id || 1123;
      const response = await recommendationsApi.getRecommendations({
        user_id: userId,
        rating,
        review
      });

      if (response.success) {
        // 5개만 선택
        const products = response.data.recommendations.slice(0, 5);
        setCustomRecommendations(products);

        // 추천 결과 모달 열기
        setIsCustomRecommendationModalOpen(true);
      } else {
        alert('추천 상품을 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch custom recommendations:', error);
      alert('추천 상품을 가져오는데 실패했습니다.');
    }
  };

  const summaryClasses = [
    styles.cartSummary,
    className,
    isMinimized && styles.minimized,
    isLoading && styles.loading
  ].filter(Boolean).join(' ');

  return (
    <div className={summaryClasses} role="region" aria-label="Cart Summary">
      {/* Minimized View */}
      {isMinimized ? (
        <div className={styles.minimizedSummary}>
          <div className={styles.minimizedInfo}>
            <span className={styles.itemCountBadge}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className={styles.totalAmount}>
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading || isCheckingOut || itemCount === 0}
            className={styles.checkoutButtonMini}
            type="button"
            aria-label={`Checkout ${itemCount} items for $${total.toFixed(2)}`}
          >
            {isCheckingOut ? (
              <LoadingSpinner size="small" />
            ) : (
              'Checkout'
            )}
          </button>
        </div>
      ) : (
        /* Full View */
        <div className={styles.fullSummary}>
          {/* New Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={handleRecommendations}
              disabled={isLoading}
              className={styles.actionButton}
              type="button"
              aria-label="상품추천 보기"
            >
              <span>상품추천</span>
            </button>

            <button
              onClick={handlePurchaseHistory}
              disabled={isLoading}
              className={styles.actionButton}
              type="button"
              aria-label="구매이력 보기"
            >
              <span>구매이력</span>
            </button>

            <button
              onClick={handleStatistics}
              disabled={isLoading}
              className={styles.actionButton}
              type="button"
              aria-label="통계분석 보기"
            >
              <span>통계분석</span>
            </button>
          </div>
        </div>
      )}

      {/* Weight Input Modal (Type 2 - Custom Recommendation) */}
      <RecommendationWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSubmit={handleWeightSubmit}
      />

      {/* Custom Recommendation Results Modal (Type 2) */}
      <CustomRecommendationModal
        isOpen={isCustomRecommendationModalOpen}
        onClose={() => setIsCustomRecommendationModalOpen(false)}
        products={customRecommendations}
      />
    </div>
  );
};
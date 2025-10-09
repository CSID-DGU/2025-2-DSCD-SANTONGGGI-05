import React, { useState } from 'react';
import { useCart, useNavigation } from '../../../contexts/AppProvider';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
  subtotal: number;
  isMinimized?: boolean;
  itemCount: number;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  isMinimized = false,
  itemCount,
  className
}) => {
  const { isLoading } = useCart();
  const { navigateTo } = useNavigation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
    </div>
  );
};
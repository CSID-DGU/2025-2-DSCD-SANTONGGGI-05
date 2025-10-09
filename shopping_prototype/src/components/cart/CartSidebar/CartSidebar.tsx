import React, { useState } from 'react';
import { useCart } from '../../../contexts/AppProvider';
import { useWindowSize } from '../../../hooks/useWindowSize';
import { CartItem } from '../CartItem';
import { CartSummary } from '../CartSummary';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import styles from './CartSidebar.module.css';

interface CartSidebarProps {
  onToggleMobile?: () => void;
  isCollapsed?: boolean;
  className?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  onToggleMobile,
  isCollapsed = false,
  className
}) => {
  const {
    items,
    total,
    itemCount,
    isLoading,
    error,
    updateQuantity,
    removeItem
  } = useCart();
  const { breakpoint } = useWindowSize();
  const [isMinimized, setIsMinimized] = useState(false);

  const isMobile = breakpoint === 'mobile';
  const isEmpty = items.length === 0;

  const sidebarClasses = [
    styles.cartSidebar,
    className,
    isCollapsed && styles.collapsed,
    isMinimized && styles.minimized,
    isMobile && styles.mobile,
    isEmpty && styles.empty,
    isLoading && styles.loading
  ].filter(Boolean).join(' ');

  const handleToggleMinimize = () => {
    if (!isMobile) {
      setIsMinimized(!isMinimized);
    }
  };

  const handleMobileToggle = () => {
    if (onToggleMobile) {
      onToggleMobile();
    }
  };

  return (
    <aside
      className={sidebarClasses}
      role="complementary"
      aria-label="Shopping Cart"
      aria-expanded={!isCollapsed}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            장바구니
            {itemCount > 0 && (
              <span className={styles.itemCount} aria-label={`${itemCount} items`}>
                {itemCount}개 상품
              </span>
            )}
          </h2>

          {!isEmpty && (
            <span className={styles.totalPreview}>
              ₩{total.toLocaleString()}
            </span>
          )}
        </div>

        <div className={styles.headerActions}>
          {/* Mobile toggle button */}
          {isMobile && onToggleMobile && (
            <button
              onClick={handleMobileToggle}
              className={styles.mobileToggle}
              aria-label={isCollapsed ? 'Show cart' : 'Hide cart'}
              type="button"
            >
              <span className={styles.toggleIcon}>
                {isCollapsed ? '🛒' : '✕'}
              </span>
            </button>
          )}

          {/* Desktop minimize button */}
          {!isMobile && !isEmpty && (
            <button
              onClick={handleToggleMinimize}
              className={styles.minimizeButton}
              aria-label={isMinimized ? 'Expand cart' : 'Minimize cart'}
              type="button"
            >
              <span className={styles.minimizeIcon}>
                {isMinimized ? '▲' : '▼'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="small" message="Updating cart..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorContainer} role="alert">
            <p className={styles.errorMessage}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.retryButton}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && !isLoading && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h3 className={styles.emptyTitle}>Your cart is empty</h3>
            <p className={styles.emptyMessage}>
              Start chatting with our assistant to add items to your cart!
            </p>
          </div>
        )}

        {/* Cart Items */}
        {!isEmpty && !isMinimized && (
          <>
            <div className={styles.itemsList} role="list">
              {items.map((item) => (
                <div key={item.id} role="listitem">
                  <CartItem
                    item={item}
                    onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                    onRemove={() => removeItem(item.id)}
                    isLoading={isLoading}
                  />
                </div>
              ))}
            </div>

          </>
        )}

        {/* Cart Summary */}
        {!isEmpty && (
          <div className={styles.summaryContainer}>
            <CartSummary
              subtotal={total}
              isMinimized={isMinimized}
              itemCount={itemCount}
            />
          </div>
        )}
      </div>

      {/* Mobile Backdrop */}
      {isMobile && !isCollapsed && (
        <div
          className={styles.mobileBackdrop}
          onClick={handleMobileToggle}
          aria-hidden="true"
        />
      )}
    </aside>
  );
};
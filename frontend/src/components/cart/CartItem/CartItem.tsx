import React, { useState } from 'react';
import { CartItemType } from '../../../types';
import styles from './CartItem.module.css';
import { useModal } from '../../../contexts/AppProvider';

interface CartItemProps {
  item: CartItemType;
  onRemove: () => void;
  isLoading?: boolean;
  index?: number;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onRemove,
  isLoading = false,
  index,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { openProductModal } = useModal();

  const handleRemove = async () => {
    if (isLoading) return;

    setIsUpdating(true);
    try {
      await onRemove();
    } finally {
      setIsUpdating(false);
    }
  };

  const isDisabled = isLoading || isUpdating;

  const handleProductClick = () => {
    openProductModal({
      id: item.id,
      name: item.name,
      price: item.price,
      ...(item.image && { image: item.image }),
      ...(item.url && { url: item.url }),
      ...(item.category && { category: item.category }),
      ...(item.platformName && { platformName: item.platformName }),
      ...(typeof index === 'number' ? { cartIndex: index } : {}),
    });
  };

  return (
    <div
      className={`${styles.cartItem} ${isDisabled ? styles.disabled : ''}`}
      role="article"
      aria-label={item.name}
    >
      {/* Product Image */}
      <div
        className={`${styles.imageContainer} ${styles.clickable}`}
        onClick={handleProductClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProductClick();
          }
        }}
        aria-label={`${item.name} 상세보기`}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={styles.productImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true">
            📦
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className={styles.details}>
        <div className={styles.productInfo}>
          <h3
            className={`${styles.productName} ${styles.clickable}`}
            title={item.name}
            onClick={handleProductClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleProductClick();
              }
            }}
          >
            {item.name}
          </h3>

          {item.variant && (
            <p className={styles.variant}>
              {item.variant}
            </p>
          )}

          <div className={styles.priceInfo}>
            <span className={styles.unitPrice}>
              ₩{item.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isDisabled}
          className={styles.removeButton}
          aria-label={`Remove ${item.name} from cart`}
          type="button"
        >
          <span className={styles.removeIcon} aria-hidden="true">🗑️</span>
          <span className={styles.removeText}>제거</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
    </div>
  );
};

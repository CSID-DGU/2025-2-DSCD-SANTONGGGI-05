import React, { useState } from 'react';
import { CartItemType } from '../../../types';
import styles from './CartItem.module.css';
import { useModal } from '../../../contexts/AppProvider';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isLoading?: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isLoading = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { openProductModal } = useModal();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity === item.quantity || isLoading) {
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateQuantity(newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isLoading) return;

    setIsUpdating(true);
    try {
      await onRemove();
    } finally {
      setIsUpdating(false);
    }
  };

  const itemTotal = item.price * item.quantity;
  const isDisabled = isLoading || isUpdating;

  const handleProductClick = () => {
    if (item.url) {
      openProductModal({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        url: item.url,
      });
    }
  };

  return (
    <div
      className={`${styles.cartItem} ${isDisabled ? styles.disabled : ''}`}
      role="article"
      aria-label={`${item.name} - ${item.quantity} items`}
    >
      {/* Product Image */}
      <div
        className={`${styles.imageContainer} ${item.url ? styles.clickable : ''}`}
        onClick={item.url ? handleProductClick : undefined}
        role={item.url ? 'button' : undefined}
        tabIndex={item.url ? 0 : undefined}
        onKeyDown={item.url ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProductClick();
          }
        } : undefined}
        aria-label={item.url ? `${item.name} 상세보기` : undefined}
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
            className={`${styles.productName} ${item.url ? styles.clickable : ''}`}
            title={item.name}
            onClick={item.url ? handleProductClick : undefined}
            role={item.url ? 'button' : undefined}
            tabIndex={item.url ? 0 : undefined}
            onKeyDown={item.url ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleProductClick();
              }
            } : undefined}
          >
            {item.name}
          </h3>

          {item.variant && (
            <p className={styles.variant}>
              {item.variant}
            </p>
          )}

          <div className={styles.priceInfo}>
            <span className={styles.quantityText}>
              수량: {item.quantity}
            </span>
            <span className={styles.unitPrice}>
              ₩{item.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className={styles.quantitySection}>
          <div className={styles.quantityControls} role="group" aria-label="Quantity controls">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isDisabled || item.quantity <= 1}
              className={styles.quantityButton}
              aria-label="Decrease quantity"
              type="button"
            >
              −
            </button>

            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1) {
                  handleQuantityChange(value);
                }
              }}
              disabled={isDisabled}
              className={styles.quantityInput}
              min="1"
              max="99"
              aria-label="Item quantity"
            />

            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isDisabled || item.quantity >= 99}
              className={styles.quantityButton}
              aria-label="Increase quantity"
              type="button"
            >
              +
            </button>
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
            <span className={styles.removeText}>Remove</span>
          </button>
        </div>
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
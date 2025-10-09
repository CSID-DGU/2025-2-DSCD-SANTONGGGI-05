import React from 'react';
import { Product } from '../../../types';
import styles from './ProductDetailPanel.module.css';

interface ProductDetailPanelProps {
  product?: Product;
  relatedProducts?: Product[];
  metadata?: Record<string, any>;
}

export const ProductDetailPanel: React.FC<ProductDetailPanelProps> = ({
  product,
  relatedProducts = [],
  metadata
}) => {
  if (!product) {
    return (
      <div className={styles.emptyState}>
        <h3>Product not found</h3>
        <p>The requested product could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className={styles.productDetailPanel}>
      <div className={styles.productHeader}>
        <h2>{product.name}</h2>
        <p className={styles.price}>${product.price.toFixed(2)}</p>
      </div>
      <div className={styles.productContent}>
        {product.image && (
          <img src={product.image} alt={product.name} className={styles.productImage} />
        )}
        <div className={styles.description}>
          {product.description || 'No description available.'}
        </div>
      </div>
    </div>
  );
};
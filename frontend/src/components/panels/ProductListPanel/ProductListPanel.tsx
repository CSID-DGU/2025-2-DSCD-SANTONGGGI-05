import React, { useState } from 'react';
import { Product } from '../../../types';
import { useCart } from '../../../contexts/AppProvider';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import styles from './ProductListPanel.module.css';

interface ProductListPanelProps {
  products: Product[];
  title?: string;
  metadata?: Record<string, any>;
}

export const ProductListPanel: React.FC<ProductListPanelProps> = ({
  products,
  title = 'Products',
  metadata
}) => {
  const { addToCart, isLoading: cartLoading } = useCart();
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());

  const handleAddToCart = async (product: Product) => {
    if (cartLoading || loadingProducts.has(product.id)) return;

    setLoadingProducts(prev => new Set(prev).add(product.id));
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        ...(product.image && { image: product.image })
      });
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  if (products.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📦</div>
        <h3 className={styles.emptyTitle}>No products found</h3>
        <p className={styles.emptyMessage}>
          Try adjusting your search or browse our categories.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.productListPanel}>
      {/* Panel Info */}
      {metadata?.totalCount && (
        <div className={styles.panelInfo}>
          <p className={styles.resultCount}>
            Showing {products.length} of {metadata.totalCount} products
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className={styles.productsGrid} role="list">
        {products.map((product) => (
          <article
            key={product.id}
            className={styles.productCard}
            role="listitem"
          >
            {/* Product Image */}
            <div className={styles.imageContainer}>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className={styles.productImage}
                  loading="lazy"
                />
              ) : (
                <div className={styles.imagePlaceholder} aria-hidden="true">
                  📦
                </div>
              )}

              {product.badge && (
                <span className={styles.productBadge}>
                  {product.badge}
                </span>
              )}
            </div>

            {/* Product Info */}
            <div className={styles.productInfo}>
              <h3 className={styles.productName} title={product.name}>
                {product.name}
              </h3>

              {product.description && (
                <p className={styles.productDescription}>
                  {product.description}
                </p>
              )}

              <div className={styles.priceSection}>
                <span className={styles.price}>
                  ${product.price.toFixed(2)}
                </span>

                {product.originalPrice && product.originalPrice > product.price && (
                  <span className={styles.originalPrice}>
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {product.rating && (
                <div className={styles.rating}>
                  <span className={styles.stars} aria-label={`${product.rating} stars`}>
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                  </span>
                  <span className={styles.ratingText}>
                    ({product.rating.toFixed(1)})
                  </span>
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className={styles.cardActions}>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={cartLoading || loadingProducts.has(product.id)}
                className={styles.addToCartButton}
                aria-label={`Add ${product.name} to cart`}
                type="button"
              >
                {loadingProducts.has(product.id) ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <span className={styles.cartIcon} aria-hidden="true">🛒</span>
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Load More */}
      {metadata?.hasMore && (
        <div className={styles.loadMoreSection}>
          <button
            className={styles.loadMoreButton}
            type="button"
            disabled={cartLoading}
          >
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
};
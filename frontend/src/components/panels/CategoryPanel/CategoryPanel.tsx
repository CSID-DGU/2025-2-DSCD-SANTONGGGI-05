import React from 'react';
import { Product, Category } from '../../../types';
import styles from './CategoryPanel.module.css';

interface CategoryPanelProps {
  category?: Category;
  products: Product[];
  subcategories: Category[];
  metadata?: Record<string, any>;
}

export const CategoryPanel: React.FC<CategoryPanelProps> = ({
  category,
  products,
  subcategories,
  metadata
}) => {
  return (
    <div className={styles.categoryPanel}>
      {category && (
        <div className={styles.header}>
          <h3>{category.name}</h3>
          {category.description && (
            <p className={styles.description}>{category.description}</p>
          )}
        </div>
      )}
      
      {subcategories.length > 0 && (
        <div className={styles.subcategoriesSection}>
          <h4>Subcategories</h4>
          <div className={styles.subcategories}>
            {subcategories.map((subcat) => (
              <div key={subcat.id} className={styles.subcategoryCard}>
                <span>{subcat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className={styles.productsSection}>
        <h4>Products</h4>
        {products.length === 0 ? (
          <p className={styles.emptyMessage}>No products in this category.</p>
        ) : (
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <h5>{product.name}</h5>
                <p className={styles.price}>${product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
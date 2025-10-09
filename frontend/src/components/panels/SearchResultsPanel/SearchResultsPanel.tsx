import React from 'react';
import { Product } from '../../../types';
import styles from './SearchResultsPanel.module.css';

interface SearchResultsPanelProps {
  results: Product[];
  query?: string;
  filters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
  results,
  query,
  filters,
  metadata
}) => {
  return (
    <div className={styles.searchResultsPanel}>
      <div className={styles.header}>
        <h3>Search Results</h3>
        {query && <p className={styles.query}>Results for: "{query}"</p>}
        <p className={styles.count}>{results.length} products found</p>
      </div>
      {results.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products found for your search.</p>
        </div>
      ) : (
        <div className={styles.results}>
          {results.map((product) => (
            <div key={product.id} className={styles.resultCard}>
              <h4>{product.name}</h4>
              <p className={styles.price}>${product.price.toFixed(2)}</p>
              {product.description && (
                <p className={styles.description}>{product.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
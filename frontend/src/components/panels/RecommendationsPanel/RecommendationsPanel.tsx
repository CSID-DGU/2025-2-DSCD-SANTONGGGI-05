import React from 'react';
import { Product } from '../../../types';
import styles from './RecommendationsPanel.module.css';

interface RecommendationsPanelProps {
  recommendations: Product[];
  title?: string;
  metadata?: Record<string, any>;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  title = 'Recommendations',
  metadata
}) => {
  return (
    <div className={styles.recommendationsPanel}>
      <h3 className={styles.title}>{title}</h3>
      {recommendations.length === 0 ? (
        <p className={styles.emptyMessage}>No recommendations available.</p>
      ) : (
        <div className={styles.grid}>
          {recommendations.map((product) => (
            <div key={product.id} className={styles.card}>
              <h4>{product.name}</h4>
              <p className={styles.price}>${product.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
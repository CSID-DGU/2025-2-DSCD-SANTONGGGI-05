import React, { useEffect, useRef } from 'react';
import { PanelData } from '../../../types';
import { usePanel } from '../../../contexts/AppProvider';
import { ProductListPanel } from '../ProductListPanel';
import { ProductDetailPanel } from '../ProductDetailPanel';
import { RecommendationsPanel } from '../RecommendationsPanel';
import { SearchResultsPanel } from '../SearchResultsPanel';
import { CategoryPanel } from '../CategoryPanel';
import styles from './DynamicPanel.module.css';

interface DynamicPanelProps {
  panelData: PanelData;
  isMobileOverlay?: boolean;
  className?: string;
}

export const DynamicPanel: React.FC<DynamicPanelProps> = ({
  panelData,
  isMobileOverlay = false,
  className
}) => {
  const { closePanel, isAnimating } = usePanel();
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    if (isMobileOverlay) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileOverlay, closePanel]);

  // Auto-focus panel for accessibility
  useEffect(() => {
    if (panelRef.current && !isAnimating) {
      panelRef.current.focus();
    }
  }, [isAnimating]);

  const renderPanelContent = () => {
    switch (panelData.type) {
      case 'product-list':
        return (
          <ProductListPanel
            products={panelData.data?.products || []}
            title={panelData.title}
            metadata={panelData.metadata}
          />
        );

      case 'product-detail':
        return (
          <ProductDetailPanel
            product={panelData.data?.product}
            relatedProducts={panelData.data?.relatedProducts || []}
            metadata={panelData.metadata}
          />
        );

      case 'recommendations':
        return (
          <RecommendationsPanel
            recommendations={panelData.data?.recommendations || []}
            title={panelData.title}
            metadata={panelData.metadata}
          />
        );

      case 'search-results':
        return (
          <SearchResultsPanel
            results={panelData.data?.results || []}
            query={panelData.data?.query}
            filters={panelData.data?.filters}
            metadata={panelData.metadata}
          />
        );

      case 'category':
        return (
          <CategoryPanel
            category={panelData.data?.category}
            products={panelData.data?.products || []}
            subcategories={panelData.data?.subcategories || []}
            metadata={panelData.metadata}
          />
        );

      default:
        return (
          <div className={styles.unknownPanel}>
            <div className={styles.unknownIcon}>❓</div>
            <h3 className={styles.unknownTitle}>Unknown Panel Type</h3>
            <p className={styles.unknownMessage}>
              Panel type "{panelData.type}" is not supported.
            </p>
            <pre className={styles.debugInfo}>
              {JSON.stringify(panelData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const panelClasses = [
    styles.dynamicPanel,
    className,
    isMobileOverlay && styles.mobileOverlay,
    isAnimating && styles.animating,
    panelData.type && styles[panelData.type]
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={panelRef}
      className={panelClasses}
      role="dialog"
      aria-modal={isMobileOverlay}
      aria-label={panelData.title || `${panelData.type} panel`}
      tabIndex={-1}
    >
      {/* Panel Header */}
      <header className={styles.panelHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            {panelData.title && (
              <h2 className={styles.panelTitle}>
                {panelData.title}
              </h2>
            )}

            {panelData.subtitle && (
              <p className={styles.panelSubtitle}>
                {panelData.subtitle}
              </p>
            )}
          </div>

          <div className={styles.headerActions}>
            {/* Panel Type Badge */}
            <span className={styles.typeBadge}>
              {panelData.type.replace('-', ' ')}
            </span>

            {/* Close Button */}
            <button
              onClick={closePanel}
              className={styles.closeButton}
              aria-label="Close panel"
              type="button"
            >
              <span className={styles.closeIcon} aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {panelData.metadata?.progress && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${panelData.metadata.progress}%` }}
                role="progressbar"
                aria-valuenow={panelData.metadata.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Loading progress: ${panelData.metadata.progress}%`}
              />
            </div>
          </div>
        )}
      </header>

      {/* Panel Content */}
      <main className={styles.panelContent}>
        {renderPanelContent()}
      </main>

      {/* Panel Footer */}
      {panelData.metadata?.timestamp && (
        <footer className={styles.panelFooter}>
          <p className={styles.timestamp}>
            Last updated: {new Date(panelData.metadata.timestamp).toLocaleTimeString()}
          </p>
        </footer>
      )}

      {/* Mobile Overlay Backdrop */}
      {isMobileOverlay && (
        <div
          className={styles.backdrop}
          onClick={closePanel}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
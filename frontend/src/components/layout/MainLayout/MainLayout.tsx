import React, { useEffect, useRef, useState } from 'react';
import { useAuth, usePanel, useNavigation } from '../../../contexts/AppProvider';
import { useWindowSize } from '../../../hooks/useWindowSize';
import { ChatInterface } from '../../chat/ChatInterface';
import { CartSidebar } from '../../cart/CartSidebar';
import { DynamicPanel } from '../../panels/DynamicPanel';
import { StatisticsDashboard } from '../../statistics/StatisticsDashboard/StatisticsDashboard';
import { PurchaseHistoryDashboard } from '../../purchaseHistory/PurchaseHistoryDashboard/PurchaseHistoryDashboard';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className }) => {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { currentPanel, isExpanded, height, isAnimating } = usePanel();
  const { currentPage } = useNavigation();
  const { width, breakpoint } = useWindowSize();
  const [cartCollapsed, setCartCollapsed] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Update CSS custom property for panel height
  useEffect(() => {
    if (layoutRef.current) {
      layoutRef.current.style.setProperty('--panel-height', `${height}px`);
    }
  }, [height]);

  // Handle mobile cart collapse
  const toggleMobileCart = () => {
    if (breakpoint === 'mobile') {
      setCartCollapsed(!cartCollapsed);
    }
  };

  // Generate dynamic class names
  const layoutClasses = [
    styles.mainLayout,
    className,
    authLoading && styles.loading,
    authError && styles.error,
  ].filter(Boolean).join(' ');

  const panelClasses = [
    styles.panelArea,
    isExpanded ? styles.expanded : styles.collapsed,
    isAnimating && styles.animating,
    breakpoint === 'mobile' && isExpanded && styles.mobileOverlay,
  ].filter(Boolean).join(' ');

  const cartClasses = [
    styles.cartSidebar,
    breakpoint === 'mobile' && cartCollapsed && styles.mobileCollapsed,
  ].filter(Boolean).join(' ');

  // Show error state
  if (authError) {
    return (
      <div className={layoutClasses} ref={layoutRef}>
        <div className={styles.errorMessage}>
          <h2>Authentication Error</h2>
          <p>{authError}</p>
        </div>
      </div>
    );
  }

  // Render different layouts based on current page
  if (currentPage === 'statistics') {
    return (
      <div
        className={layoutClasses}
        ref={layoutRef}
        data-breakpoint={breakpoint}
        role="main"
        aria-label="Statistics Dashboard"
      >
        <StatisticsDashboard />
      </div>
    );
  }

  if (currentPage === 'purchase-history') {
    return (
      <div
        className={layoutClasses}
        ref={layoutRef}
        data-breakpoint={breakpoint}
        role="main"
        aria-label="Purchase History Dashboard"
      >
        <PurchaseHistoryDashboard />
      </div>
    );
  }

  // Default chat layout
  return (
    <div
      className={layoutClasses}
      ref={layoutRef}
      data-breakpoint={breakpoint}
      role="main"
      aria-label="Shopping Assistant Interface"
    >
      {/* Chat Interface Area */}
      <div
        className={styles.chatArea}
        role="region"
        aria-label="Chat Interface"
      >
        <ChatInterface />
      </div>

      {/* Cart Sidebar */}
      <div
        className={cartClasses}
        role="region"
        aria-label="Shopping Cart"
      >
        <CartSidebar
          {...(breakpoint === 'mobile' && {
            onToggleMobile: toggleMobileCart,
            isCollapsed: cartCollapsed
          })}
        />
      </div>

      {/* Dynamic Panel Area */}
      {currentPanel && (
        <div
          className={panelClasses}
          role="region"
          aria-label={`Dynamic Panel: ${currentPanel.title || currentPanel.type}`}
          aria-expanded={isExpanded}
          style={{
            height: isExpanded ? `${height}px` : '0px',
          }}
        >
          <div className={styles.panelContent}>
            <DynamicPanel
              panelData={currentPanel}
              isMobileOverlay={breakpoint === 'mobile' && isExpanded}
            />
          </div>
        </div>
      )}

      {/* Mobile Panel Backdrop */}
      {breakpoint === 'mobile' && isExpanded && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => {
            // This will be handled by the panel's close functionality
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default MainLayout;
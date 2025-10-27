import React, { useState, useEffect } from 'react';
import styles from './PurchaseHistoryDashboard.module.css';
import { useNavigation, useAuth } from '../../../contexts/AppProvider';
import { purchaseHistoryApi, PurchaseHistoryData } from '../../../services/api/purchaseHistory';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

interface PurchaseHistoryDashboardProps {
  className?: string;
}

export const PurchaseHistoryDashboard: React.FC<PurchaseHistoryDashboardProps> = ({
  className
}) => {
  const [purchaseData, setPurchaseData] = useState<PurchaseHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { navigateTo } = useNavigation();
  const { user } = useAuth();

  const dashboardClasses = [
    styles.purchaseHistoryDashboard,
    className
  ].filter(Boolean).join(' ');

  // Load purchase history on mount
  useEffect(() => {
    loadPurchaseHistory();
  }, [currentPage]);

  const loadPurchaseHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // user_id 사용 (없으면 기본값 1123)
      const userId = user?.id || 1123;

      // 통합 API 사용 - Dashboard 형식의 데이터를 한 번에 가져옴
      const response = await purchaseHistoryApi.getAllPurchaseHistory(userId);

      if (response.success && response.data && response.data.purchaseHistory) {
        setPurchaseData(response.data.purchaseHistory);
      } else {
        setError('구매이력을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
      console.error('Purchase history loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBackToChat = () => {
    navigateTo('chat');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      case 'refunded': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'pending': return '배송중';
      case 'cancelled': return '취소';
      case 'refunded': return '환불';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={dashboardClasses}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" message="구매이력을 불러오는 중..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !purchaseData) {
    return (
      <div className={dashboardClasses}>
        <div className={styles.errorContainer}>
          <h2>오류가 발생했습니다</h2>
          <p>{error || '데이터를 불러올 수 없습니다.'}</p>
          <button onClick={loadPurchaseHistory} className={styles.retryButton}>
            다시 시도
          </button>
          <button onClick={handleGoBackToChat} className={styles.backButton}>
            채팅으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardClasses}>
      <div className={styles.mainContent}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.titleSection}>
            <button onClick={handleGoBackToChat} className={styles.backToChat}>
              ← 채팅으로 돌아가기
            </button>
            <h1 className={styles.title}>구매이력</h1>
            <p className={styles.subtitle}>나의 쇼핑 기록</p>
          </div>
        </div>

        {/* Summary Section */}
        <div className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>총 주문</span>
              <span className={styles.summaryValue}>{purchaseData.summary.totalOrders}회</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>총 구매금액</span>
              <span className={styles.summaryValue}>{formatCurrency(purchaseData.summary.totalSpent)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>총 상품수</span>
              <span className={styles.summaryValue}>{purchaseData.summary.totalItems}개</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>평균 주문금액</span>
              <span className={styles.summaryValue}>{formatCurrency(purchaseData.summary.averageOrderValue)}</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className={styles.ordersSection}>
          <div className={styles.ordersList}>
            {purchaseData.orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <h3 className={styles.orderNumber}>{order.orderNumber}</h3>
                    <p className={styles.orderDate}>{formatDate(order.date)}</p>
                  </div>
                  <div className={styles.orderStatus}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                    <span className={styles.orderAmount}>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <div className={styles.itemImage}>
                        <span className={styles.itemEmoji}>{item.image}</span>
                      </div>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <p className={styles.itemDetails}>
                          {item.brand && <span className={styles.itemBrand}>{item.brand}</span>}
                          <span className={styles.itemCategory}>{item.category}</span>
                        </p>
                      </div>
                      <div className={styles.itemPrice}>
                        <span className={styles.quantity}>수량: {item.quantity}</span>
                        <span className={styles.price}>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

          {/* Pagination */}
          {purchaseData.pagination.total_pages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </button>
              <span className={styles.pageInfo}>
                {currentPage} / {purchaseData.pagination.total_pages}
              </span>
              <button
                className={styles.pageButton}
                disabled={currentPage === purchaseData.pagination.total_pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
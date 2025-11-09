import React, { useState, useEffect } from 'react';
import styles from './StatisticsDashboard.module.css';
import { StatisticsNavigation } from '../StatisticsNavigation/StatisticsNavigation';
import { useNavigation, useAuth } from '../../../contexts/AppProvider';
import { statisticsApi, StatisticsDashboardData } from '../../../services/api/statistics';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { CategoryTab } from '../Tabs/CategoryTab';
import { PlatformTab } from '../Tabs/PlatformTab';
import { PatternTab } from '../Tabs/PatternTab';

export type StatisticsView = 'category' | 'platform' | 'pattern';

interface StatisticsDashboardProps {
  className?: string;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ className }) => {
  const [currentView, setCurrentView] = useState<StatisticsView>('category');
  const [statisticsData, setStatisticsData] = useState<StatisticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigateTo } = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadStatisticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatisticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = user?.id || 1123;
      const response = await statisticsApi.getDashboard(userId);

      if (response.success && response.data?.statistics) {
        setStatisticsData(response.data.statistics);
      } else {
        setError(response.error || '통계 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Statistics loading error:', err);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBackToChat = () => {
    navigateTo('chat');
  };

  const dashboardClasses = [styles.statisticsDashboard, className].filter(Boolean).join(' ');

  if (isLoading) {
    return (
      <div className={dashboardClasses}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" message="통계 데이터를 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error || !statisticsData) {
    return (
      <div className={dashboardClasses}>
        <div className={styles.errorContainer}>
          <h2>오류가 발생했습니다</h2>
          <p>{error || '데이터를 불러올 수 없습니다.'}</p>
          <button onClick={loadStatisticsData} className={styles.retryButton}>
            다시 시도
          </button>
          <button onClick={handleGoBackToChat} className={styles.backButton}>
            채팅으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const summary = statisticsData.summary;
  const summaryCards = [
    { label: '총 지출', value: `₩${Math.round(summary.totalSpent).toLocaleString()}` },
    { label: '총 주문', value: `${summary.totalOrders}건` },
    { label: '평균 주문 금액', value: `₩${Math.round(summary.averageOrderValue).toLocaleString()}` },
    { label: '최다 구매 카테고리', value: summary.mostPurchasedCategory ?? '-' },
    { label: '최다 이용 플랫폼', value: summary.mostUsedPlatform ?? '-' },
  ];

  const renderViewContent = () => {
    switch (currentView) {
      case 'category':
        return (
          <CategoryTab
            share={statisticsData.category.share}
            monthlyTrend={statisticsData.category.monthlyTrend}
          />
        );
      case 'platform':
        return (
          <PlatformTab
            ratio={statisticsData.platform.ratio}
            monthlyTrend={statisticsData.platform.monthlyTrend}
          />
        );
      case 'pattern':
        return (
          <PatternTab
            hourlyTrend={statisticsData.pattern.hourlyTrend}
            monthlyTotal={statisticsData.pattern.monthlyTotal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={dashboardClasses}>
      <div className={styles.mainContent}>
        <div className={styles.headerSection}>
          <div className={styles.titleSection}>
            <button onClick={handleGoBackToChat} className={styles.backToChat}>
              ← 채팅으로 돌아가기
            </button>
            <h1 className={styles.title}>사용자 통계 대시보드</h1>
            <p className={styles.subtitle}>실제 구매 데이터를 기반으로 한 개인화된 분석 리포트</p>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <div key={card.label} className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{card.label}</span>
              <strong className={styles.summaryValue}>{card.value}</strong>
            </div>
          ))}
        </div>

        <div className={styles.viewContent}>{renderViewContent()}</div>
      </div>

      <div className={styles.sidebar}>
        <StatisticsNavigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    </div>
  );
};

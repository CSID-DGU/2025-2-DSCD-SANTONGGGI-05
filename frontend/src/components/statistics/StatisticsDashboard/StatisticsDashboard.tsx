import React, { useState, useEffect } from 'react';
import styles from './StatisticsDashboard.module.css';
import { StatisticsNavigation } from '../StatisticsNavigation/StatisticsNavigation';
import { KPICards } from '../KPICards/KPICards';
import { WeeklyChart } from '../Charts/WeeklyChart';
import { CategoryChart } from '../Charts/CategoryChart';
import { useNavigation, useAuth } from '../../../contexts/AppProvider';
import { statisticsApi, StatisticsData } from '../../../services/api/statistics';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

export type StatisticsView = 'overview' | 'weekly' | 'category';

interface StatisticsDashboardProps {
  className?: string;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  className
}) => {
  const [currentView, setCurrentView] = useState<StatisticsView>('overview');
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigateTo } = useNavigation();
  const { user } = useAuth();

  // Load statistics data on mount
  useEffect(() => {
    loadStatisticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadStatisticsData is intentionally not in deps to avoid re-creation loop

  const loadStatisticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // user_id 사용 (없으면 기본값 1123)
      const userId = user?.id || 1123;

      // 통합 API 사용 - 모든 통계 데이터를 한 번에 가져옴
      const response = await statisticsApi.getAllStatistics(userId);

      if (response.success && response.data && response.data.statistics) {
        setStatisticsData(response.data.statistics);
      } else {
        setError('통계 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
      console.error('Statistics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBackToChat = () => {
    navigateTo('chat');
  };

  const dashboardClasses = [
    styles.statisticsDashboard,
    className
  ].filter(Boolean).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className={dashboardClasses}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" message="통계 데이터를 불러오는 중..." />
        </div>
      </div>
    );
  }

  // Error state
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

  const getViewTitle = () => {
    switch (currentView) {
      case 'overview':
        return {
          title: '사용자 통계 대시보드',
          subtitle: '개인화된 쇼핑 분석 리포트'
        };
      case 'weekly':
        return {
          title: '주간 소비 확인',
          subtitle: '요일별 소비 패턴 분석'
        };
      case 'category':
        return {
          title: '카테고리별 구매 분포',
          subtitle: '구매 카테고리 분석'
        };
      default:
        return {
          title: '통계 분석',
          subtitle: '데이터 분석 결과'
        };
    }
  };

  const renderViewContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className={styles.overviewContent}>
            <KPICards data={statisticsData.kpis} />
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <WeeklyChart data={statisticsData.weeklyData} />
              </div>
              <div className={styles.chartCard}>
                <CategoryChart data={statisticsData.categoryData} />
              </div>
            </div>
          </div>
        );

      case 'weekly':
        return (
          <div className={styles.weeklyContent}>
            <div className={styles.fullChart}>
              <WeeklyChart data={statisticsData.weeklyData} detailed />
            </div>
          </div>
        );

      case 'category':
        return (
          <div className={styles.categoryContent}>
            <div className={styles.fullChart}>
              <CategoryChart data={statisticsData.categoryData} detailed />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const { title, subtitle } = getViewTitle();

  return (
    <div className={dashboardClasses}>
      <div className={styles.mainContent}>
        <div className={styles.headerSection}>
          <div className={styles.titleSection}>
            <button onClick={handleGoBackToChat} className={styles.backToChat}>
              ← 채팅으로 돌아가기
            </button>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </div>

        <div className={styles.viewContent}>
          {renderViewContent()}
        </div>
      </div>

      <div className={styles.sidebar}>
        <StatisticsNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
    </div>
  );
};
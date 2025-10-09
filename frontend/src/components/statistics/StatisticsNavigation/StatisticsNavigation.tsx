import React from 'react';
import { StatisticsView } from '../StatisticsDashboard/StatisticsDashboard';
import styles from './StatisticsNavigation.module.css';

interface NavigationItem {
  id: StatisticsView;
  label: string;
  icon: string;
  description: string;
}

interface StatisticsNavigationProps {
  currentView: StatisticsView;
  onViewChange: (view: StatisticsView) => void;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    label: '전체 통계 분석',
    icon: '📊',
    description: '종합적인 쇼핑 분석'
  },
  {
    id: 'weekly',
    label: '주간 소비 확인',
    icon: '📅',
    description: '요일별 소비 패턴'
  },
  {
    id: 'category',
    label: '카테고리별 구매 분포',
    icon: '🏷️',
    description: '구매 카테고리 분석'
  }
];

export const StatisticsNavigation: React.FC<StatisticsNavigationProps> = ({
  currentView,
  onViewChange,
  className
}) => {
  const navigationClasses = [
    styles.statisticsNavigation,
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={navigationClasses}>
      <div className={styles.navHeader}>
        <h3 className={styles.navTitle}>통계 분석</h3>
        <p className={styles.navSubtitle}>원하는 분석을 선택하세요</p>
      </div>

      <ul className={styles.navList}>
        {navigationItems.map((item) => {
          const isActive = currentView === item.id;
          const itemClasses = [
            styles.navItem,
            isActive && styles.active
          ].filter(Boolean).join(' ');

          return (
            <li key={item.id} className={itemClasses}>
              <button
                onClick={() => onViewChange(item.id)}
                className={styles.navButton}
                aria-current={isActive ? 'page' : undefined}
                type="button"
              >
                <div className={styles.navIcon}>
                  {item.icon}
                </div>
                <div className={styles.navContent}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </div>
                {isActive && (
                  <div className={styles.activeIndicator} aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
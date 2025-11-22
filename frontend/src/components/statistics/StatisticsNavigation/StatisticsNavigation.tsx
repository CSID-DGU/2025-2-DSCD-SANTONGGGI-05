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
    id: 'category',
    label: '카테고리 분석',
    icon: '🏷️',
    description: '카테고리 비율 및 추이'
  },
  {
    id: 'platform',
    label: '플랫폼 분석',
    icon: '🛒',
    description: '플랫폼별 이용 현황'
  },
  {
    id: 'pattern',
    label: '소비 패턴',
    icon: '⏰',
    description: '시간/월별 소비 패턴'
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

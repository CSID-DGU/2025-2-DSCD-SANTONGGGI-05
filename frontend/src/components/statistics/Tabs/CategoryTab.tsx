import React from 'react';
import styles from './StatisticsTabs.module.css';
import { SimplePieChart, SimpleBarChart, SimpleLineChart } from '../Charts/BasicCharts';
import type { PieDatum, LineSeries } from '@/services/api/statistics';

interface CategoryTabProps {
  share: PieDatum[];
  monthlyTrend: LineSeries[];
}

const formatCurrency = (value: number) => `₩${Math.round(value).toLocaleString()}`;

export const CategoryTab: React.FC<CategoryTabProps> = ({ share, monthlyTrend }) => {
  const insight =
    share.length > 0
      ? `가장 많이 구매한 카테고리는 "${share[0].label}"이며 총 ${formatCurrency(share[0].value)} 지출했습니다.`
      : '카테고리 분석을 위한 데이터가 없습니다.';

  return (
    <div className={styles.tabContainer}>
      <div className={styles.insightBanner}>
        <strong>카테고리 인사이트</strong>
        <span>{insight}</span>
      </div>

      {share.length > 0 ? (
        <div className={styles.twoColumn}>
          <div className={styles.chartCard}>
            <SimplePieChart data={share.map((item) => ({ id: item.id, label: item.label, value: item.value }))} />
          </div>
          <div className={`${styles.chartCard} ${styles.chartCardTall}`}>
            <SimpleBarChart data={share.map((item) => ({ label: item.label, value: item.value }))} />
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>카테고리 비율을 표시할 데이터가 없습니다.</div>
      )}

      {monthlyTrend.length > 0 && (
        <div className={styles.fullWidthCard}>
          <SimpleLineChart series={monthlyTrend} />
        </div>
      )}
    </div>
  );
};

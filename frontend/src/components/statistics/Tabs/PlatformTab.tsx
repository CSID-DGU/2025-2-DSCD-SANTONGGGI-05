import React from 'react';
import styles from './StatisticsTabs.module.css';
import { SimplePieChart, SimpleLineChart } from '../Charts/BasicCharts';
import type { PieDatum, LineSeries } from '@/services/api/statistics';

interface PlatformTabProps {
  ratio: PieDatum[];
  monthlyTrend: LineSeries[];
}

const formatCurrency = (value: number) => `₩${Math.round(value).toLocaleString()}`;

export const PlatformTab: React.FC<PlatformTabProps> = ({ ratio, monthlyTrend }) => {
  const insight =
    ratio.length > 0
      ? `플랫폼 중 "${ratio[0].label}"에서 가장 많은 ${formatCurrency(ratio[0].value)}을 지출했습니다.`
      : '플랫폼 분석을 위한 데이터가 없습니다.';

  return (
    <div className={styles.tabContainer}>
      <div className={styles.insightBanner}>
        <strong>플랫폼 인사이트</strong>
        <span>{insight}</span>
      </div>

      {ratio.length > 0 ? (
        <div className={styles.chartCard}>
          <SimplePieChart data={ratio.map((item) => ({ id: item.id, label: item.label, value: item.value }))} />
        </div>
      ) : (
        <div className={styles.emptyState}>플랫폼 비율을 표시할 데이터가 없습니다.</div>
      )}

      {monthlyTrend.length > 0 && (
        <div className={styles.fullWidthCard}>
          <SimpleLineChart series={monthlyTrend} />
        </div>
      )}
    </div>
  );
};

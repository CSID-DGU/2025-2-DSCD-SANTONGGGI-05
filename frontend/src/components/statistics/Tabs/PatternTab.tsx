import React from 'react';
import styles from './StatisticsTabs.module.css';
import { SimpleLineChart } from '../Charts/BasicCharts';
import type { LineSeries } from '@/services/api/statistics';

interface PatternTabProps {
  hourlyTrend: LineSeries[];
  monthlyTotal: LineSeries[];
}

const formatCurrency = (value: number) => `₩${Math.round(value).toLocaleString()}`;

const getTotalAmount = (series: LineSeries[]) =>
  series.reduce((sum, serie) => sum + serie.data.reduce((acc, point) => acc + (point.y || 0), 0), 0);

const getPeakHour = (hourlyTrend: LineSeries[]) => {
  if (!hourlyTrend.length) return null;
  let peakHour: string | null = null;
  let peakValue = -Infinity;
  hourlyTrend[0].data.forEach((point) => {
    const value = point.y || 0;
    if (value > peakValue) {
      peakValue = value;
      peakHour = point.x;
    }
  });
  return peakHour;
};

export const PatternTab: React.FC<PatternTabProps> = ({ hourlyTrend, monthlyTotal }) => {
  const totalAmount = getTotalAmount(monthlyTotal);
  const peakHour = getPeakHour(hourlyTrend);
  const insight =
    peakHour !== null
      ? `총 ${formatCurrency(totalAmount)}을 지출했으며, 가장 소비가 집중된 시간대는 ${peakHour}입니다.`
      : '소비 패턴을 분석할 데이터가 부족합니다.';

  return (
    <div className={styles.tabContainer}>
      <div className={styles.insightBanner}>
        <strong>소비 패턴 인사이트</strong>
        <span>{insight}</span>
      </div>

      {hourlyTrend.length > 0 ? (
        <div className={styles.fullWidthCard}>
          <SimpleLineChart series={hourlyTrend} />
        </div>
      ) : (
        <div className={styles.emptyState}>시간대별 소비 데이터를 찾을 수 없습니다.</div>
      )}

      {monthlyTotal.length > 0 ? (
        <div className={styles.fullWidthCard}>
          <SimpleLineChart series={monthlyTotal} />
        </div>
      ) : (
        <div className={styles.emptyState}>월별 소비 추이를 표시할 데이터가 없습니다.</div>
      )}
    </div>
  );
};

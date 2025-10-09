import React from 'react';
import styles from './WeeklyChart.module.css';
import { WeeklyData } from '../../../services/api/statistics';

interface WeeklyChartProps {
  data?: WeeklyData[];
  detailed?: boolean;
  className?: string;
}

const defaultWeeklyData: WeeklyData[] = [
  { day: 'Mon', dayKor: '월', amount: 15000 },
  { day: 'Tue', dayKor: '화', amount: 23000 },
  { day: 'Wed', dayKor: '수', amount: 18000 },
  { day: 'Thu', dayKor: '목', amount: 31000 },
  { day: 'Fri', dayKor: '금', amount: 28000 },
  { day: 'Sat', dayKor: '토', amount: 42000 },
  { day: 'Sun', dayKor: '일', amount: 35000 }
];

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  data,
  detailed = false,
  className
}) => {
  const chartClasses = [
    styles.weeklyChart,
    detailed && styles.detailed,
    className
  ].filter(Boolean).join(' ');

  const weeklyData = data || defaultWeeklyData;
  const maxAmount = Math.max(...weeklyData.map(d => d.amount));

  return (
    <div className={chartClasses}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>주간 소비 패턴</h3>
        {detailed && (
          <div className={styles.chartActions}>
            <select className={styles.periodSelect}>
              <option value="thisWeek">이번 주</option>
              <option value="lastWeek">지난 주</option>
              <option value="average">평균 패턴</option>
            </select>
          </div>
        )}
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartGrid}>
          {weeklyData.map((data) => {
            const barHeight = (data.amount / maxAmount) * 100;

            return (
              <div key={data.day} className={styles.barContainer}>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{ height: `${barHeight}%` }}
                    aria-label={`${data.dayKor}요일: ${data.amount.toLocaleString()}원`}
                  >
                    <div className={styles.barValue}>
                      {(data.amount / 1000).toFixed(0)}k원
                    </div>
                  </div>
                </div>
                <div className={styles.dayLabel}>{data.dayKor}</div>
              </div>
            );
          })}
        </div>

        {detailed && (
          <div className={styles.chartStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>주간 총 소비:</span>
              <span className={styles.statValue}>
                ₩{weeklyData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>일 평균:</span>
              <span className={styles.statValue}>
                ₩{Math.round(weeklyData.reduce((sum, d) => sum + d.amount, 0) / 7).toLocaleString()}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>최고 소비일:</span>
              <span className={styles.statValue}>토요일 (₩42,000)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
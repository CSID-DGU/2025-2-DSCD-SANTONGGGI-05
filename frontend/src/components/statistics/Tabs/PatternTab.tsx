import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import styles from './StatisticsTabs.module.css';
import type { LineSeries } from '@/services/api/statistics';
import { nivoTheme } from '../Charts/NivoTheme';

interface PatternTabProps {
  hourlyTrend: LineSeries[];
  monthlyTotal: LineSeries[];
}

const currency = (value: number) => `₩${Math.round(value).toLocaleString()}`;

export const PatternTab: React.FC<PatternTabProps> = ({ hourlyTrend, monthlyTotal }) => {
  const totalAmount = useMemo(
    () =>
      monthlyTotal.reduce(
        (sum, serie) => sum + serie.data.reduce((acc, point) => acc + (point.y ?? 0), 0),
        0,
      ),
    [monthlyTotal],
  );

  const peakHour = useMemo(() => {
    if (!hourlyTrend.length) return null;
    let maxVal = -Infinity;
    let maxHour: string | null = null;
    hourlyTrend[0].data.forEach((point) => {
      const value = point.y || 0;
      if (value > maxVal) {
        maxVal = value;
        maxHour = point.x as string;
      }
    });
    return maxHour;
  }, [hourlyTrend]);

  const insight =
    peakHour !== null
      ? `총 ${currency(totalAmount)}을 지출했으며, 가장 활발한 시간대는 ${peakHour}입니다.`
      : '소비 패턴을 분석할 데이터가 부족합니다.';

  return (
    <div className={styles.tabContainer}>
      <div className={styles.insightBanner}>
        <strong>소비 패턴 인사이트</strong>
        <span>{insight}</span>
      </div>

      {hourlyTrend.length > 0 ? (
        <div className={styles.fullWidthCard} style={{ height: 320 }}>
          <ResponsiveLine
            theme={nivoTheme}
            data={hourlyTrend}
            margin={{ top: 24, right: 24, bottom: 48, left: 56 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear' }}
            lineWidth={3}
            pointSize={8}
            pointBorderWidth={2}
            colors={{ scheme: 'paired' }}
            useMesh
            axisBottom={{
              legend: '시간대',
              legendOffset: 44,
              legendPosition: 'middle',
              tickPadding: 8,
            }}
            axisLeft={{
              legend: '지출 금액',
              legendOffset: -40,
              legendPosition: 'middle',
              tickPadding: 8,
            }}
            tooltip={({ point }) => (
              <div style={{ background: 'white', padding: '6px 8px', borderRadius: 6, fontSize: 12 }}>
                <div>{point.serieId}</div>
                <strong>
                  {point.data.xFormatted}: {currency(point.data.y as number)}
                </strong>
              </div>
            )}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 32,
                itemWidth: 120,
                itemHeight: 18,
                symbolSize: 12,
              },
            ]}
          />
        </div>
      ) : (
        <div className={styles.emptyState}>시간대별 소비 데이터를 찾을 수 없습니다.</div>
      )}

      {monthlyTotal.length > 0 ? (
        <div className={styles.fullWidthCard} style={{ height: 340 }}>
          <ResponsiveLine
            theme={nivoTheme}
            data={monthlyTotal}
            margin={{ top: 24, right: 24, bottom: 48, left: 56 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear' }}
            lineWidth={3}
            pointSize={8}
            pointBorderWidth={2}
            colors={{ scheme: 'category10' }}
            useMesh
            axisBottom={{
              legend: '기간',
              legendOffset: 44,
              legendPosition: 'middle',
              tickRotation: -30,
              tickPadding: 8,
            }}
            axisLeft={{
              legend: '지출 금액',
              legendOffset: -40,
              legendPosition: 'middle',
              tickPadding: 8,
            }}
            tooltip={({ point }) => (
              <div style={{ background: 'white', padding: '6px 8px', borderRadius: 6, fontSize: 12 }}>
                <div>{point.serieId}</div>
                <strong>
                  {point.data.xFormatted}: {currency(point.data.y as number)}
                </strong>
              </div>
            )}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 32,
                itemWidth: 120,
                itemHeight: 18,
                symbolSize: 12,
              },
            ]}
          />
        </div>
      ) : (
        <div className={styles.emptyState}>월별 소비 추세를 표시할 데이터가 없습니다.</div>
      )}
    </div>
  );
};

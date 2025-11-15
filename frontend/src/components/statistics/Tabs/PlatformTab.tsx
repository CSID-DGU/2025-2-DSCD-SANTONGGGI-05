import React, { useMemo } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import styles from './StatisticsTabs.module.css';
import type { PieDatum, LineSeries } from '@/services/api/statistics';
import { nivoTheme } from '../Charts/NivoTheme';

interface PlatformTabProps {
  ratio: PieDatum[];
  monthlyTrend: LineSeries[];
}

const currency = (value: number) => `₩${Math.round(value).toLocaleString()}`;

export const PlatformTab: React.FC<PlatformTabProps> = ({ ratio, monthlyTrend }) => {
  const insight = useMemo(() => {
    if (!ratio.length) return '플랫폼 분석을 위한 데이터가 없습니다.';
    return `가장 많이 이용한 플랫폼은 "${ratio[0].label}"이며 총 ${currency(ratio[0].value)} 지출했습니다.`;
  }, [ratio]);

  return (
    <div className={styles.tabContainer}>
      <div className={styles.insightBanner}>
        <strong>플랫폼 인사이트</strong>
        <span>{insight}</span>
      </div>

      {ratio.length > 0 ? (
        <div className={styles.chartCard}>
          <div className={styles.chartInner}>
            <ResponsivePie
              theme={nivoTheme}
              data={ratio.map((item) => ({ id: item.id, label: item.label, value: Math.round(item.value) }))}
              margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
            innerRadius={0.55}
            padAngle={1.2}
            cornerRadius={4}
            colors={{ scheme: 'set2' }}
            valueFormat={currency}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 24,
                itemWidth: 120,
                itemHeight: 18,
                symbolSize: 12,
              },
            ]}
            />
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>플랫폼 비율을 표시할 데이터가 없습니다.</div>
      )}

      {monthlyTrend.length > 0 && (
        <div className={styles.fullWidthCard} style={{ height: 360 }}>
          <ResponsiveLine
            theme={nivoTheme}
            data={monthlyTrend}
            margin={{ top: 30, right: 24, bottom: 48, left: 56 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear' }}
            useMesh
            colors={{ scheme: 'category10' }}
            axisBottom={{
              legend: '기간',
              legendOffset: 48,
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
            lineWidth={3}
            pointSize={8}
            pointBorderWidth={2}
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
      )}
    </div>
  );
};

import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import styles from './StatisticsTabs.module.css';
import type { PieDatum, LineSeries } from '@/services/api/statistics';
import { nivoTheme } from '../Charts/NivoTheme';

interface CategoryTabProps {
  share: PieDatum[];
  monthlyTrend: LineSeries[];
}

const currency = (value: number) => `₩${Math.round(value).toLocaleString()}`;

export const CategoryTab: React.FC<CategoryTabProps> = ({ share, monthlyTrend }) => {
  const insight =
    share.length > 0
      ? `가장 많이 구매한 카테고리는 "${share[0].label}"이며 총 ${currency(share[0].value)} 지출했습니다.`
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
            <div className={styles.chartInner}>
              <ResponsivePie
                theme={nivoTheme}
                data={share.map((item) => ({ id: item.id, label: item.label, value: Math.round(item.value) }))}
                margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
                innerRadius={0.6}
                padAngle={1.5}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'pastel1' }}
              valueFormat={currency}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  translateY: 24,
                  itemWidth: 100,
                  itemHeight: 16,
                  symbolSize: 12,
                },
              ]}
              />
            </div>
          </div>
          <div className={`${styles.chartCard} ${styles.chartCardTall}`}>
            <div className={styles.chartInner}>
              <ResponsiveBar
                theme={nivoTheme}
                data={share.map((item) => ({ category: item.label, total: Math.round(item.value) }))}
                keys={['total']}
                indexBy="category"
                layout="horizontal"
              margin={{ top: 30, right: 24, bottom: 40, left: 120 }}
              padding={0.3}
              colors={{ scheme: 'set2' }}
              valueFormat={currency}
              axisBottom={{ legend: '총 지출', legendOffset: 32, legendPosition: 'middle' }}
              axisLeft={{ legend: '카테고리', legendOffset: -110, legendPosition: 'middle' }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>카테고리 비율을 표시할 데이터가 없습니다.</div>
      )}

      {monthlyTrend.length > 0 && (
        <div className={styles.fullWidthCard} style={{ height: 360 }}>
          <ResponsiveLine
            theme={nivoTheme}
            data={monthlyTrend}
            margin={{ top: 30, right: 24, bottom: 48, left: 56 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', stacked: false }}
            colors={{ scheme: 'category10' }}
            lineWidth={3}
            pointSize={8}
            pointBorderWidth={2}
            useMesh
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
                itemWidth: 110,
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

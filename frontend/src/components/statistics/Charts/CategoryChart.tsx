import React, { useState } from 'react';
import styles from './CategoryChart.module.css';
import { CategoryData } from '../../../services/api/statistics';

interface CategoryChartProps {
  data?: CategoryData[];
  detailed?: boolean;
  className?: string;
}

const defaultCategoryData: CategoryData[] = [
  { id: 'lifestyle', name: '생활용품', percentage: 45, amount: 125000, color: '#10b981' },
  { id: 'cleaning', name: '청소용품', percentage: 28, amount: 78000, color: '#3b82f6' },
  { id: 'beverage', name: '음료', percentage: 15, amount: 42000, color: '#f59e0b' },
  { id: 'others', name: '기타', percentage: 12, amount: 33500, color: '#8b5cf6' }
];

export const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  detailed = false,
  className
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const chartClasses = [
    styles.categoryChart,
    detailed && styles.detailed,
    className
  ].filter(Boolean).join(' ');

  const categoryData = data || defaultCategoryData;
  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.amount, 0);

  // SVG 도넛 차트 생성
  const center = 120;
  const radius = 80;
  const strokeWidth = detailed ? 40 : 30;

  let cumulativePercentage = 0;
  const segments = categoryData.map((category) => {
    const startAngle = (cumulativePercentage / 100) * 360 - 90;
    const endAngle = ((cumulativePercentage + category.percentage) / 100) * 360 - 90;

    const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = category.percentage > 50 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');

    cumulativePercentage += category.percentage;

    return {
      ...category,
      pathData,
      startAngle,
      endAngle
    };
  });

  return (
    <div className={chartClasses}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>카테고리별 구매 분포</h3>
        {detailed && (
          <div className={styles.chartActions}>
            <select className={styles.viewSelect}>
              <option value="percentage">비율별</option>
              <option value="amount">금액별</option>
              <option value="count">수량별</option>
            </select>
          </div>
        )}
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartWrapper}>
          <svg
            width={center * 2}
            height={center * 2}
            className={styles.chartSvg}
            aria-label="카테고리별 구매 분포 차트"
          >
            {segments.map((segment) => {
              const isHovered = hoveredCategory === segment.id;

              return (
                <path
                  key={segment.id}
                  d={segment.pathData}
                  fill={segment.color}
                  className={styles.chartSegment}
                  style={{
                    opacity: hoveredCategory && !isHovered ? 0.6 : 1,
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: `${center}px ${center}px`
                  }}
                  onMouseEnter={() => setHoveredCategory(segment.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  aria-label={`${segment.name}: ${segment.percentage}%`}
                />
              );
            })}

            {/* Center circle for donut effect */}
            <circle
              cx={center}
              cy={center}
              r={radius - strokeWidth}
              fill="white"
              className={styles.centerCircle}
            />

            {/* Center text */}
            <text
              x={center}
              y={center - 10}
              textAnchor="middle"
              className={styles.centerTitle}
            >
              총 구매
            </text>
            <text
              x={center}
              y={center + 15}
              textAnchor="middle"
              className={styles.centerValue}
            >
              ₩{totalAmount.toLocaleString()}
            </text>
          </svg>

          <div className={styles.legend}>
            {categoryData.map((category) => {
              const isHovered = hoveredCategory === category.id;
              const legendItemClasses = [
                styles.legendItem,
                isHovered && styles.hovered
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={category.id}
                  className={legendItemClasses}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div
                    className={styles.legendColor}
                    style={{ backgroundColor: category.color }}
                  />
                  <div className={styles.legendContent}>
                    <span className={styles.legendName}>{category.name}</span>
                    <div className={styles.legendStats}>
                      <span className={styles.legendPercentage}>{category.percentage}%</span>
                      {detailed && (
                        <span className={styles.legendAmount}>
                          ₩{category.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {detailed && (
          <div className={styles.categoryDetails}>
            <h4 className={styles.detailsTitle}>카테고리 상세 분석</h4>
            <div className={styles.detailsList}>
              {categoryData.map((category) => (
                <div key={category.id} className={styles.detailItem}>
                  <div className={styles.detailHeader}>
                    <span className={styles.detailName}>{category.name}</span>
                    <span className={styles.detailAmount}>₩{category.amount.toLocaleString()}</span>
                  </div>
                  <div className={styles.detailBar}>
                    <div
                      className={styles.detailBarFill}
                      style={{
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
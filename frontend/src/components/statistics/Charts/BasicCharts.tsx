import React, { useMemo } from 'react';
import styles from './BasicCharts.module.css';

const COLORS = [
  '#2563eb',
  '#ea580c',
  '#16a34a',
  '#ca8a04',
  '#db2777',
  '#0891b2',
  '#7c3aed',
  '#dc2626',
];

const getColor = (index: number) => COLORS[index % COLORS.length];

interface PieDatum {
  id: string;
  label: string;
  value: number;
}

interface PieProps {
  data: PieDatum[];
}

export const SimplePieChart: React.FC<PieProps> = ({ data }) => {
  const total = Math.max(
    data.reduce((sum, item) => sum + (item.value || 0), 0),
    1,
  );
  let offset = 0;

  return (
    <div className={styles.pieWrapper}>
      <svg viewBox="0 0 200 200" className={styles.pieSvg}>
        <g transform="translate(100,100)">
          {data.map((item, idx) => {
            const value = Math.max(item.value, 0) / total;
            const circumference = Math.PI * 2 * 80;
            const dashArray = `${value * circumference} ${circumference}`;
            const dashOffset = -(offset * circumference);
            offset += value;
            return (
              <circle
                key={item.id}
                r={80}
                fill="transparent"
                stroke={getColor(idx)}
                strokeWidth={20}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            );
          })}
          <circle r={50} fill="#fff" />
        </g>
      </svg>
      <ul className={styles.legend}>
        {data.map((item, idx) => (
          <li key={item.id}>
            <span className={styles.legendColor} style={{ background: getColor(idx) }} />
            <span className={styles.legendLabel}>{item.label}</span>
            <span className={styles.legendValue}>{Math.round(item.value).toLocaleString()}원</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface BarDatum {
  label: string;
  value: number;
}

interface BarProps {
  data: BarDatum[];
}

export const SimpleBarChart: React.FC<BarProps> = ({ data }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className={styles.barWrapper}>
      {data.map((item, idx) => {
        const width = Math.max((item.value / maxValue) * 100, 2);
        return (
          <div key={item.label} className={styles.barRow}>
            <span className={styles.barLabel}>{item.label}</span>
            <div className={styles.barTrack}>
              <div className={styles.barValue} style={{ width: `${width}%`, background: getColor(idx) }} />
            </div>
            <span className={styles.barAmount}>{Math.round(item.value).toLocaleString()}원</span>
          </div>
        );
      })}
    </div>
  );
};

interface LinePoint {
  x: string;
  y: number;
}

interface LineSeries {
  id: string;
  data: LinePoint[];
}

interface LineProps {
  series: LineSeries[];
  height?: number;
}

export const SimpleLineChart: React.FC<LineProps> = ({ series, height = 260 }) => {
  const { points, xDomain, minY, maxY } = useMemo(() => {
    const xValues = Array.from(new Set(series.flatMap((s) => s.data.map((p) => p.x))));
    const yValues = series.flatMap((s) => s.data.map((p) => p.y));
    const min = Math.min(...yValues, 0);
    const max = Math.max(...yValues, 1);
    const normalized = series.map((s, idx) => ({
      color: getColor(idx),
      points: s.data.map((point) => ({
        x: xValues.indexOf(point.x),
        y: point.y,
        label: point.x,
      })),
      id: s.id,
    }));
    return { points: normalized, xDomain: xValues, minY: min, maxY: max };
  }, [series]);

  const width = Math.max(xDomain.length - 1, 1);
  const getX = (x: number) => (xDomain.length > 1 ? (x / width) * 100 : 50);
  const getY = (y: number) => {
    if (maxY === minY) return 50;
    return 100 - ((y - minY) / (maxY - minY)) * 100;
  };

  return (
    <div className={styles.lineWrapper} style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {points.map((serie) => (
          <g key={serie.id}>
            <polyline
              fill="none"
              stroke={serie.color}
              strokeWidth={1.5}
              points={serie.points.map((pt) => `${getX(pt.x)},${getY(pt.y)}`).join(' ')}
            />
            {serie.points.map((pt, idx) => (
              <circle
                key={`${serie.id}-${idx}`}
                cx={getX(pt.x)}
                cy={getY(pt.y)}
                r={1.5}
                fill={serie.color}
              />
            ))}
          </g>
        ))}
      </svg>
      <div className={styles.xAxis}>
        {xDomain.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={styles.legend}>
        {points.map((serie) => (
          <span key={serie.id}>
            <span className={styles.legendColor} style={{ background: serie.color }} />
            {serie.id}
          </span>
        ))}
      </div>
    </div>
  );
};

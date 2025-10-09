import React from 'react';
import styles from './KPICards.module.css';

interface KPIData {
  id: string;
  title: string;
  value: string;
  change: number;
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'red';
}

interface KPICardsProps {
  className?: string;
}

const kpiData: KPIData[] = [
  {
    id: 'total-spending',
    title: '총 구매 금액',
    value: '₩248,500',
    change: 12.5,
    icon: '💰',
    color: 'green'
  },
  {
    id: 'product-count',
    title: '구매한 상품 수',
    value: '34개',
    change: 8.2,
    icon: '🛒',
    color: 'green'
  },
  {
    id: 'savings',
    title: '절약한 금액',
    value: '₩52,300',
    change: 15.3,
    icon: '💎',
    color: 'green'
  },
  {
    id: 'delivery-time',
    title: '평균 배송시간',
    value: '1.2일',
    change: -0.3,
    icon: '🚚',
    color: 'red'
  }
];

export const KPICards: React.FC<KPICardsProps> = ({
  className
}) => {
  const cardsClasses = [
    styles.kpiCards,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardsClasses}>
      {kpiData.map((kpi) => {
        const isPositive = kpi.change > 0;
        const cardClasses = [
          styles.kpiCard,
          styles[`color-${kpi.color}`]
        ].filter(Boolean).join(' ');

        const changeClasses = [
          styles.kpiChange,
          isPositive ? styles.positive : styles.negative
        ].filter(Boolean).join(' ');

        return (
          <div key={kpi.id} className={cardClasses}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <span className={styles.icon} aria-hidden="true">
                  {kpi.icon}
                </span>
              </div>
              <div className={changeClasses}>
                <span className={styles.changeIcon}>
                  {isPositive ? '↗️' : '↘️'}
                </span>
                <span className={styles.changeValue}>
                  {isPositive ? '+' : ''}{kpi.change}
                  {kpi.id === 'delivery-time' ? '일' : '%'}
                </span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{kpi.title}</h3>
              <div className={styles.cardValue}>{kpi.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
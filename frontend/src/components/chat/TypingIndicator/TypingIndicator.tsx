import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  userName = '쇼핑 비서'
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.typingIndicatorWrapper} role="status" aria-live="polite">
      <div className={styles.avatarPulse}>
        <div className={styles.avatar}>🛒</div>
      </div>
      <div className={styles.bubble}>
        <span className={styles.typingText}>{userName}가 입력 중</span>
        <div className={styles.dots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

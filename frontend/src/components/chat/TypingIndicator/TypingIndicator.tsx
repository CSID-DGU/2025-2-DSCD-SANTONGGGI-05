import React from 'react';

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
    <div className="typing-indicator-container">
      <div className="typing-indicator">
        <span className="typing-text">{userName}가 입력 중</span>
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};
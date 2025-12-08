import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChat, useAuth } from '../../../contexts/AppProvider';
import { ChatMessages } from '../ChatMessages/ChatMessages';
import { TypingIndicator } from '../TypingIndicator/TypingIndicator';
import { CustomRecommendationModal } from '@/components/modals/CustomRecommendationModal';
import { StatisticsImageModal } from '@/components/modals/StatisticsImageModal';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Find me wireless headphones under $100",
  "What are the best laptops for students?",
  "Show me trending fashion items",
  "Help me plan a gift for my mom",
];

// 개발용 디버그 버튼은 디폴트로 숨긴다.
const SHOW_DEV_BUTTONS = false;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const {
    currentSession,
    isLoading,
    isTyping,
    error,
    connectionStatus,
    sendMessage,
  } = useChat();
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 모달 상태 관리
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false);
  const [recommendationProducts, setRecommendationProducts] = useState<any[]>([]);
  const [statisticsModalOpen, setStatisticsModalOpen] = useState(false);
  const [statisticsImageUrl, setStatisticsImageUrl] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (isLoading || isTyping) return;

    try {
      await sendMessage(inputValue.trim(), (products) => {
        // 추천 상품이 오면 모달 열기
        setRecommendationProducts(products);
        setRecommendationModalOpen(true);
      });
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle key press in textarea
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-send the suggestion
    try {
      await sendMessage(suggestion, (products) => {
        // 추천 상품이 오면 모달 열기
        setRecommendationProducts(products);
        setRecommendationModalOpen(true);
      });
      setInputValue('');
    } catch (error) {
      console.error('Failed to send suggestion:', error);
    }
  };

  // 개발용: Type 1 모달 테스트 (상품 추천 - 채팅 응답용 6개)
  const handleTestRecommendationModal = () => {
    const mockProducts = [
      {
        product_id: 501,
        name: '제주 삼다수 2L 12병',
        price: 12000,
        platform_name: '쿠팡',
        category: '생수',
        review: 250,
        product_url: 'https://example.com/product1'
      },
      {
        product_id: 505,
        price: 18000,
        name: '코카콜라 제로 355ml 24캔',
        platform_name: '11번가',
        category: '음료',
        review: 320,
        product_url: 'https://example.com/product2'
      },
      {
        product_id: 502,
        name: '아이시스 8.0 2L 6병',
        price: 15000,
        platform_name: '네이버쇼핑',
        category: '생수',
        review: 180,
        product_url: 'https://example.com/product3'
      },
      {
        product_id: 506,
        name: '크린랩 주방세제 3개입',
        price: 22000,
        platform_name: '쿠팡',
        category: '청소용품',
        review: 410,
        product_url: 'https://example.com/product4'
      },
      {
        product_id: 507,
        name: '테크 물티슈 10팩',
        price: 9500,
        platform_name: '네이버쇼핑',
        category: '생활용품',
        review: 150,
        product_url: 'https://example.com/product5'
      },
      {
        product_id: 508,
        name: '레쓰비 카페라떼 175ml 30캔',
        price: 14500,
        platform_name: '11번가',
        category: '음료',
        review: 290,
        product_url: 'https://example.com/product6'
      }
    ];
    setRecommendationProducts(mockProducts);
    setRecommendationModalOpen(true);
  };

  // 개발용: Type 2 모달 테스트 (통계 이미지)
  const handleTestStatisticsModal = () => {
    // Mock 통계 이미지 URL (실제로는 백엔드에서 받음)
    const mockImageUrl = 'https://via.placeholder.com/600x400/3b82f6/ffffff?text=Payment+Statistics';
    setStatisticsImageUrl(mockImageUrl);
    setStatisticsModalOpen(true);
  };




  const interfaceClasses = [
    styles.chatInterface,
    className,
  ].filter(Boolean).join(' ');

  const messages = currentSession?.messages || [];
  const hasMessages = messages.length > 0;
  const canSend = inputValue.trim().length > 0;

  return (
    <div className={interfaceClasses} role="region" aria-label="Chat Interface">
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className={`${styles.connectionStatus} ${styles[connectionStatus]}`}>
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'disconnected' && 'Disconnected - Attempting to reconnect'}
          {connectionStatus === 'error' && 'Connection error - Please check your internet'}
        </div>
      )}

      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div>
          <h1 className={styles.headerTitle}>
            {user?.name ? `안녕하세요 ${user.name}님` : '쇼비자 맞춤형 쇼핑 비서 서비스'}
          </h1>
          <p className={styles.headerSubtitle}>실시간 상품 추천 채팅</p>
        </div>

        {SHOW_DEV_BUTTONS && (
          <div className={styles.devButtons}>
            <button
              className={styles.devButton}
              onClick={handleTestRecommendationModal}
              title="상품 추천 모달 테스트 (Type 1)"
            >
              🧪 상품추천
            </button>
            <button
              className={styles.devButton}
              onClick={handleTestStatisticsModal}
              title="통계 이미지 모달 테스트 (Type 2)"
            >
              🧪 통계이미지
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer} role="log" aria-live="polite">
        {hasMessages ? (
          <>
            <ChatMessages messages={messages} />
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              💬
            </div>
            <h2 className={styles.emptyStateTitle}>Welcome to Shopping Assistant</h2>
            <p className={styles.emptyStateDescription}>
              I'm here to help you find products, compare prices, and make informed shopping decisions.
              Ask me anything about products you're looking for!
            </p>
            <div className={styles.emptyStateSuggestions}>
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  className={styles.suggestionButton}
                  onClick={() => handleSuggestionClick(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator isVisible={isTyping} />}
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading || isTyping}
            rows={1}
            aria-label="Message input"
          />

          <div className={styles.inputActions}>
            <button
              className={styles.sendButton}
              onClick={handleSendMessage}
              disabled={!canSend || isLoading || isTyping}
              aria-label="Send message"
              title="Send message"
            >
              {isLoading || isTyping ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </div>


      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}

      {/* Type 1 모달: 상품 추천 */}
      <CustomRecommendationModal
        isOpen={recommendationModalOpen}
        onClose={() => setRecommendationModalOpen(false)}
        products={recommendationProducts}
      />

      {/* Type 2 모달: 통계 이미지 */}
      <StatisticsImageModal
        isOpen={statisticsModalOpen}
        onClose={() => setStatisticsModalOpen(false)}
        imageUrl={statisticsImageUrl}
      />

    </div>
  );
};

export default ChatInterface;

import { BaseEntity } from './index';

// ERD 기반 채팅 메시지 타입
export interface ChatMessage extends BaseEntity {
  content: string;
  role: 'user' | 'assistant';
  type: 'text' | 'product' | 'statistics';  // ERD type: 0(일반), 1(상품추천), 2(결제통계)
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

// 프론트엔드 UI용 세션 (단순화)
export interface ChatSession extends BaseEntity {
  title: string;
  messages: ChatMessage[];
}

// Recommendation product from API
export interface RecommendationProduct {
  product_id: number;
  name: string;
  price: number;
  platform_name: string;
  category: string;
  review: number;
}

export interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  // Recommendation modal state
  isRecommendationModalOpen: boolean;
  recommendationProducts: RecommendationProduct[];
}

export interface ChatContextValue extends ChatState {
  sendMessage: (message: string) => Promise<void>;
  clearCurrentSession: () => void;
  loadHistory: () => Promise<void>;
  openRecommendationModal: (products: RecommendationProduct[]) => void;
  closeRecommendationModal: () => void;
}
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
  image_url?: string;
  product_url?: string;
  // New fields from updated recommendation system
  unit_volume?: string;
  unit_price?: number;
  savings_ratio_pct?: number;
  similarity?: number;
}

export interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isRecommendationModalOpen: boolean;
  recommendationProducts: RecommendationProduct[];
}

// Callback for handling custom (맞춤) 추천 모달
export type RecommendationHandler = (products: RecommendationProduct[]) => void;

export interface ChatContextValue extends ChatState {
  sendMessage: (message: string, onRecommendation?: RecommendationHandler) => Promise<void>;
  clearCurrentSession: () => void;
  loadHistory: () => Promise<void>;
  closeRecommendationModal: () => void;
}

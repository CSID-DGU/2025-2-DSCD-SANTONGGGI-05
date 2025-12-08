import { apiClient } from './client';
import type { ApiResponse } from '@/types';

interface Product {
  product_id: number;
  name: string;
  price: number;
  platform_name: string;
  category: string;
  review: number;
  image_url?: string;
  product_url?: string;
  // 추천 시스템 추가 필드
  savings_ratio_pct?: number;
  similarity?: number;
  final_score?: number;
  normalized_price?: number;
  unit_volume?: string;
  unit_price?: number;
  rank?: number;
  small_category?: string;
  rating?: number;
}

export interface SendMessageResponse {
  user_id: number;
  ai_message: string;
  type: number;
  recommendationItems: Product[];
}

interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  ai_message: string;
  timestamp: string;
}

interface GetHistoryResponse {
  messages: ChatMessage[];
}

export const chatApi = {
  sendMessage: async (
    user_id: number,
    message: string
  ): Promise<ApiResponse<SendMessageResponse>> => {
    return apiClient.post<SendMessageResponse>('/chat/messages', { user_id, message });
  },

  getHistory: async (user_id?: number): Promise<ApiResponse<GetHistoryResponse>> => {
    const params = user_id ? { user_id } : undefined;
    return apiClient.get<GetHistoryResponse>('/chat/history', params);
  }
};

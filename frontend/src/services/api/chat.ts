import { apiClient } from './client';
import type { ApiResponse } from '@/types';

interface Product {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  review: number;
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

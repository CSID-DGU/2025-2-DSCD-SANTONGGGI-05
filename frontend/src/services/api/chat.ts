import { ApiResponse } from '../../types';

// Message types for chat API
interface ChatMessage {
  id: string | number;
  content: string;
  type: 'user' | 'bot' | 'assistant';
  timestamp: string;
}

interface SendMessageResponse {
  message: ChatMessage;
  panel?: any; // Panel data if expansion is needed
}

interface GetHistoryResponse {
  messages: ChatMessage[];
}

// Mock Chat API for development
export const chatApi = {
  sendMessage: async (message: string): Promise<ApiResponse<SendMessageResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        message: {
          id: Date.now(),
          content: `Echo: ${message}`,
          type: 'bot',
          timestamp: new Date().toISOString()
        },
        panel: null // No panel expansion for now
      }
    };
  },

  getHistory: async (): Promise<ApiResponse<GetHistoryResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        messages: [
          {
            id: 1,
            content: '안녕하세요! 쇼핑 비서입니다. 무엇을 도와드릴까요?',
            type: 'bot',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            content: '나 물 6개 사야 될 것 같아',
            type: 'user',
            timestamp: new Date().toISOString()
          }
        ]
      }
    };
  }
};
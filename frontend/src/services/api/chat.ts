import { ApiResponse } from '../../types';

// CLAUDE.md ERD 기반 Chat API
// ERD: products { product_id: number, price: number, platform_name: string, category: string, review: number }

// Product interface from ERD
interface Product {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  review: number;
}

// CLAUDE.md 명세: POST /api/chat/messages
interface SendMessageRequest {
  user_id: number;
  message: string;
}

interface SendMessageResponse {
  user_id: number;
  ai_message: string;
  type: number; // 0: 일반, 1: 상품 추천, 2: 결제통계사진첨부
  recommendationItems: Product[];
}

// CLAUDE.md 명세: GET /api/chat/history
interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  ai_message: string;
  timestamp: string; // ISO 8601
}

interface GetHistoryResponse {
  messages: ChatMessage[];
}

// Mock Chat API for development
export const chatApi = {
  // POST /api/chat/messages
  sendMessage: async (user_id: number, message: string): Promise<ApiResponse<SendMessageResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - 상품 추천 예시
    const mockProducts: Product[] = [
      {
        product_id: 501,
        price: 12000,
        platform_name: '쿠팡',
        category: '생수',
        review: 250
      },
      {
        product_id: 502,
        price: 15000,
        platform_name: '네이버쇼핑',
        category: '생수',
        review: 180
      }
    ];

    return {
      success: true,
      data: {
        user_id,
        ai_message: '물 6개를 찾아드렸습니다. 가성비 좋은 상품을 추천해드릴게요!',
        type: 1, // 1: 상품 추천
        recommendationItems: mockProducts
      }
    };
  },

  // GET /api/chat/history?user_id={user_id}
  getHistory: async (user_id?: number): Promise<ApiResponse<GetHistoryResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        messages: [
          {
            id: 1,
            user_id: user_id || 1123,
            message: '나 물 6개 사야 될 것 같아',
            ai_message: '물 6개를 찾아드렸습니다...',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            user_id: user_id || 1123,
            message: '가장 저렴한 거 보여줘',
            ai_message: '가장 저렴한 상품을 찾았습니다...',
            timestamp: new Date().toISOString()
          }
        ]
      }
    };
  }
};
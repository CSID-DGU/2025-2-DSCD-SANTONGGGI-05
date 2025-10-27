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
      },
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
      },
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

    // Sample messages matching ChatContext initial state
    const baseTime = Date.now();

    return {
      success: true,
      data: {
        messages: [
          {
            id: 1,
            user_id: user_id || 1123,
            message: '',
            ai_message: '안녕하세요! 무엇을 도와드릴까요?',
            timestamp: new Date(baseTime - 300000).toISOString()
          },
          {
            id: 2,
            user_id: user_id || 1123,
            message: '',
            ai_message: '총인님에게 적합한 상품을 추천해 드릴게요!',
            timestamp: new Date(baseTime - 240000).toISOString()
          },
          {
            id: 3,
            user_id: user_id || 1123,
            message: '나 물 6개 사야 될 것 같아',
            ai_message: '',
            timestamp: new Date(baseTime - 180000).toISOString()
          },
          {
            id: 4,
            user_id: user_id || 1123,
            message: '내 장바구니 불러워줘',
            ai_message: '장바구니를 확인했습니다',
            timestamp: new Date(baseTime - 120000).toISOString()
          }
        ]
      }
    };
  }
};
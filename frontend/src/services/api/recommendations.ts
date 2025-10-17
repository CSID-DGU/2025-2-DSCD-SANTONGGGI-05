import { ApiResponse } from '../../types';

// CLAUDE.md ERD 기반 Recommendations API
// ERD: products { product_id: number, price: number, platform_name: string, category: string, review: number }

// POST /api/recommendations
interface GetRecommendationsRequest {
  user_id: number;
  rating: number; // 평점 가중치
  review: number; // 리뷰 가중치
}

interface RecommendedProduct {
  product_id: number;
  price: number;
  platform_name: string;
  category: string;
  url: string;
}

interface RecommendationsResponse {
  user_id: number;
  recommendations: RecommendedProduct[];
  generated_at: string; // ISO 8601
}

// Mock Recommendations API
export const recommendationsApi = {
  // POST /api/recommendations
  getRecommendations: async (
    request: GetRecommendationsRequest
  ): Promise<ApiResponse<RecommendationsResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock 추천 상품 - rating과 review 가중치 기반
    const mockRecommendations: RecommendedProduct[] = [
      {
        product_id: 501,
        price: 12000,
        platform_name: '쿠팡',
        category: '생수',
        url: 'https://www.coupang.com/vp/products/5625704601'
      },
      {
        product_id: 505,
        price: 18000,
        platform_name: '11번가',
        category: '음료',
        url: 'https://www.11st.co.kr/products/8584772955'
      },
      {
        product_id: 502,
        price: 15000,
        platform_name: '네이버쇼핑',
        category: '생수',
        url: 'https://search.shopping.naver.com/catalog/34739644906'
      },
      {
        product_id: 506,
        price: 22000,
        platform_name: '쿠팡',
        category: '청소용품',
        url: 'https://www.coupang.com/vp/products/6789012345'
      },
      {
        product_id: 507,
        price: 9500,
        platform_name: '네이버쇼핑',
        category: '생활용품',
        url: 'https://search.shopping.naver.com/catalog/45678901234'
      },
      {
        product_id: 508,
        price: 14500,
        platform_name: '11번가',
        category: '음료',
        url: 'https://www.11st.co.kr/products/9876543210'
      }
    ];

    return {
      success: true,
      data: {
        user_id: request.user_id,
        recommendations: mockRecommendations,
        generated_at: new Date().toISOString()
      }
    };
  }
};

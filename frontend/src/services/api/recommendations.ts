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

// ===================================
// ProductRecommendations용 UI 타입
// ===================================
export interface UIRecommendedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  discount?: number;
  rating: number;
  reviewCount: number;
  url: string;
  reason: string;
}

export interface UIRecommendationsData {
  products: UIRecommendedProduct[];
  page?: string;
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
  },

  // ===================================
  // ProductRecommendations용 통합 API (Aggregator)
  // ===================================
  // ERD 기반 응답을 UI 형식으로 변환
  getAllRecommendations: async (params: {
    page?: string;
    user_id?: number
  }): Promise<ApiResponse<UIRecommendationsData>> => {
    try {
      // ERD 기반 API 호출 (기본값 사용)
      const userId = params.user_id || 1123;
      const response = await recommendationsApi.getRecommendations({
        user_id: userId,
        rating: 4,
        review: 6
      });

      if (!response.success) {
        return {
          success: false,
          data: null as any,
          error: 'Failed to fetch recommendations'
        };
      }

      // ERD 기반 RecommendedProduct를 UI UIRecommendedProduct 형식으로 변환
      const categoryEmojis: Record<string, string> = {
        '생수': '💧',
        '음료': '🥤',
        '생활용품': '🧴',
        '청소용품': '🧹',
        '식품': '🍔',
        '기타': '📦'
      };

      const categoryReasons: Record<string, string> = {
        '생수': '자주 구매하시는 생수 카테고리 상품입니다',
        '음료': '음료 카테고리에서 인기 있는 상품입니다',
        '생활용품': '생활에 필요한 필수 아이템입니다',
        '청소용품': '청소에 효과적인 추천 상품입니다',
        '식품': '건강한 식생활을 위한 추천입니다',
        '기타': '고객님께 추천하는 상품입니다'
      };

      const products: UIRecommendedProduct[] = response.data.recommendations.map((item, index) => {
        const basePrice = item.price;
        const hasDiscount = index % 3 === 0; // 일부 상품에 할인 적용
        const discount = hasDiscount ? Math.floor(Math.random() * 20) + 10 : undefined;
        const originalPrice = hasDiscount ? Math.floor(basePrice / (1 - discount! / 100)) : undefined;

        return {
          id: String(item.product_id),
          name: `${item.category} - ${item.platform_name}`,
          price: basePrice,
          originalPrice,
          image: categoryEmojis[item.category] || '📦',
          category: item.category,
          discount,
          rating: 4.0 + Math.random(), // 4.0-5.0 범위의 랜덤 평점
          reviewCount: Math.floor(Math.random() * 500) + 50, // 50-550 범위의 리뷰 수
          url: item.url,
          reason: categoryReasons[item.category] || '추천 상품입니다'
        };
      });

      return {
        success: true,
        data: {
          products: products,
          page: params.page
        }
      };
    } catch (error) {
      console.error('getAllRecommendations error:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

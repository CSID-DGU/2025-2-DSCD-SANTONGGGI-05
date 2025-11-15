import { apiClient } from './client';
import { ApiResponse } from '../../types';

// POST /api/recommendations/custom
interface GetRecommendationsRequest {
  user_id: number;
}

export interface RecommendedProduct {
  product_id: number;
  name: string;
  price: number;
  platform_name: string;
  category: string;
  review: number;
  image_url: string;
  product_url: string;
}

interface RecommendationsResponse {
  user_id: number;
  recommendations: RecommendedProduct[];
  generated_at: string;
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
    return apiClient.post<RecommendationsResponse>('/recommendations/custom', request);
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
        user_id: userId
      });

      if (!response.success || !response.data) {
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

        let discount: number | undefined;
        let originalPrice: number | undefined;

        if (hasDiscount) {
          discount = Math.floor(Math.random() * 20) + 10;
          originalPrice = Math.floor(basePrice / (1 - discount / 100));
        }

        return {
          id: String(item.product_id),
          name: item.name || `${item.category} - ${item.platform_name}`,
          price: basePrice,
          image: categoryEmojis[item.category] || '📦',
          category: item.category,
          rating: 4.0 + Math.random(), // 4.0-5.0 범위의 랜덤 평점
          reviewCount: item.review || (Math.floor(Math.random() * 500) + 50),
          url: item.product_url,
          reason: categoryReasons[item.category] || '추천 상품입니다',
          ...(hasDiscount && discount !== undefined && originalPrice !== undefined && {
            originalPrice,
            discount
          })
        };
      });

      const result: UIRecommendationsData = {
        products: products
      };

      if (params.page !== undefined) {
        result.page = params.page;
      }

      return {
        success: true,
        data: result
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

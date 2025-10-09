import { ApiResponse } from '../../types';

// Product Recommendation Types
export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  discount?: number;
  reason: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
}

export interface RecommendationContext {
  userId?: string;
  page: 'statistics' | 'chat' | 'cart' | 'purchase-history';
  categoryPreferences?: string[];
  recentPurchases?: string[];
}

export interface RecommendationsApiResponse {
  products: RecommendedProduct[];
  context: RecommendationContext;
  algorithm: string;
  generatedAt: string;
}

// Mock Recommendations API
export const recommendationsApi = {
  // Get personalized product recommendations
  getRecommendations: async (
    context: RecommendationContext,
    limit: number = 5
  ): Promise<ApiResponse<RecommendationsApiResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Different recommendations based on context
    const statisticsRecommendations: RecommendedProduct[] = [
      {
        id: 'rec-stat-1',
        name: '프리미엄 물티슈 10팩',
        price: 15900,
        originalPrice: 19900,
        image: '🧻',
        category: '생활용품',
        discount: 20,
        reason: '자주 구매하는 생활용품',
        rating: 4.8,
        reviewCount: 256,
        inStock: true
      },
      {
        id: 'rec-stat-2',
        name: '친환경 주방세제 2L',
        price: 8500,
        image: '🧽',
        category: '청소용품',
        reason: '청소용품 재구매 시기',
        rating: 4.6,
        reviewCount: 189,
        inStock: true
      },
      {
        id: 'rec-stat-3',
        name: '미네랄 워터 24병',
        price: 12000,
        originalPrice: 14100,
        image: '💧',
        category: '음료',
        discount: 15,
        reason: '정기 구매 상품',
        rating: 4.9,
        reviewCount: 432,
        inStock: true
      },
      {
        id: 'rec-stat-4',
        name: '고급 화장지 48롤',
        price: 28000,
        image: '🧻',
        category: '생활용품',
        reason: '대용량 할인 혜택',
        rating: 4.7,
        reviewCount: 167,
        inStock: true
      },
      {
        id: 'rec-stat-5',
        name: '다목적 세정제',
        price: 6800,
        originalPrice: 9000,
        image: '🧴',
        category: '청소용품',
        discount: 25,
        reason: '계절 추천 상품',
        rating: 4.5,
        reviewCount: 203,
        inStock: true
      }
    ];

    const chatRecommendations: RecommendedProduct[] = [
      {
        id: 'rec-chat-1',
        name: '스마트 청소기',
        price: 189000,
        originalPrice: 229000,
        image: '🔌',
        category: '가전제품',
        discount: 17,
        reason: 'AI 추천 상품',
        rating: 4.8,
        reviewCount: 89,
        inStock: true
      },
      {
        id: 'rec-chat-2',
        name: '유기농 세제 세트',
        price: 25000,
        image: '🌱',
        category: '청소용품',
        reason: '환경친화 상품',
        rating: 4.9,
        reviewCount: 156,
        inStock: true
      }
    ];

    const purchaseHistoryRecommendations: RecommendedProduct[] = [
      {
        id: 'rec-hist-1',
        name: '고급 텀블러 세트',
        price: 24900,
        originalPrice: 35000,
        image: '☕',
        category: '주방용품',
        discount: 29,
        reason: '이전 구매 상품과 유사',
        rating: 4.7,
        reviewCount: 158,
        inStock: true
      },
      {
        id: 'rec-hist-2',
        name: '프리미엄 차량용 방향제',
        price: 12800,
        image: '🚗',
        category: '자동차용품',
        reason: '재구매 고객 선호 상품',
        rating: 4.5,
        reviewCount: 203,
        inStock: true
      },
      {
        id: 'rec-hist-3',
        name: '스마트 무선 충전기',
        price: 29900,
        originalPrice: 39900,
        image: '🔌',
        category: '전자제품',
        discount: 25,
        reason: '구매 패턴 기반 추천',
        rating: 4.8,
        reviewCount: 312,
        inStock: true
      },
      {
        id: 'rec-hist-4',
        name: '편안한 메모리폼 베개',
        price: 35000,
        image: '🛏️',
        category: '침구',
        reason: '구매 이력 맞춤 추천',
        rating: 4.6,
        reviewCount: 145,
        inStock: true
      },
      {
        id: 'rec-hist-5',
        name: '아로마 캔들 3종 세트',
        price: 18500,
        originalPrice: 24000,
        image: '🕯️',
        category: '홈데코',
        discount: 23,
        reason: '리뷰 기반 추천',
        rating: 4.9,
        reviewCount: 287,
        inStock: true
      }
    ];

    // Select recommendations based on context
    let selectedProducts: RecommendedProduct[];

    switch (context.page) {
      case 'statistics':
        selectedProducts = statisticsRecommendations.slice(0, limit);
        break;
      case 'chat':
        selectedProducts = chatRecommendations.slice(0, limit);
        break;
      case 'purchase-history':
        selectedProducts = purchaseHistoryRecommendations.slice(0, limit);
        break;
      default:
        selectedProducts = statisticsRecommendations.slice(0, limit);
    }

    return {
      success: true,
      data: {
        products: selectedProducts,
        context,
        algorithm: 'collaborative-filtering-v2',
        generatedAt: new Date().toISOString()
      }
    };
  },

  // Refresh recommendations
  refreshRecommendations: async (
    context: RecommendationContext
  ): Promise<ApiResponse<RecommendationsApiResponse>> => {
    // Simulate refresh with slightly different data
    await new Promise(resolve => setTimeout(resolve, 400));

    // Just call the main function with a slight delay to simulate refresh
    return recommendationsApi.getRecommendations(context);
  },

  // Get recommendation by product interaction
  getRelatedProducts: async (
    productId: string,
    limit: number = 3
  ): Promise<ApiResponse<{ products: RecommendedProduct[] }>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const relatedProducts: RecommendedProduct[] = [
      {
        id: 'related-1',
        name: '관련 상품 1',
        price: 9900,
        image: '📦',
        category: '관련용품',
        reason: '함께 구매하는 상품',
        inStock: true
      }
    ];

    return {
      success: true,
      data: { products: relatedProducts.slice(0, limit) }
    };
  }
};
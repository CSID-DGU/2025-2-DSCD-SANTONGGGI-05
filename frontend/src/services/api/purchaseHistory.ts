import { ApiResponse } from '../../types';

// CLAUDE.md ERD 기반 Purchase History API
// ERD: purchase_history { id, user_id, date(YYYY-MM-DD), platform_name, price }
// ERD: products { product_id, price, platform_name, category, review }

// GET /api/purchase-history?user_id={user_id}
interface PurchaseItem {
  id: number; // purchase_history.id
  user_id: number;
  date: string; // ISO 8601
  platform_name: string;
  price: number;
  product_info?: {
    product_id: number;
    category: string;
    review: number;
  };
}

interface PurchaseHistoryResponse {
  user_id: number;
  purchases: PurchaseItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
  summary: {
    total_spent: number;
    total_orders: number;
  };
}

// ===================================
// Dashboard용 통합 데이터 타입
// ===================================
export interface PurchaseHistoryData {
  summary: {
    totalOrders: number;
    totalSpent: number;
    totalItems: number;
    averageOrderValue: number;
  };
  orders: Order[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  totalAmount: number;
  items: OrderItem[];
  paymentMethod: string;
  trackingNumber?: string;
}

interface OrderItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
}

// Mock Purchase History API
export const purchaseHistoryApi = {
  // GET /api/purchase-history?user_id={user_id}
  getPurchaseHistory: async (user_id: number): Promise<ApiResponse<PurchaseHistoryResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockPurchases: PurchaseItem[] = [
      {
        id: 1,
        user_id,
        date: new Date('2025-10-17T10:30:00Z').toISOString(),
        platform_name: '쿠팡',
        price: 12000,
        product_info: {
          product_id: 501,
          category: '생수',
          review: 250
        }
      },
      {
        id: 2,
        user_id,
        date: new Date('2025-10-16T15:20:00Z').toISOString(),
        platform_name: '네이버쇼핑',
        price: 15000,
        product_info: {
          product_id: 502,
          category: '음료',
          review: 180
        }
      },
      {
        id: 3,
        user_id,
        date: new Date('2025-10-15T09:15:00Z').toISOString(),
        platform_name: '11번가',
        price: 18000,
        product_info: {
          product_id: 503,
          category: '생활용품',
          review: 320
        }
      },
      {
        id: 4,
        user_id,
        date: new Date('2025-10-14T14:30:00Z').toISOString(),
        platform_name: '쿠팡',
        price: 25000,
        product_info: {
          product_id: 504,
          category: '청소용품',
          review: 150
        }
      },
      {
        id: 5,
        user_id,
        date: new Date('2025-10-13T11:00:00Z').toISOString(),
        platform_name: '네이버쇼핑',
        price: 32000,
        product_info: {
          product_id: 505,
          category: '생수',
          review: 280
        }
      }
    ];

    return {
      success: true,
      data: {
        user_id,
        purchases: mockPurchases,
        pagination: {
          current_page: 1,
          total_pages: 3,
          total_items: 25
        },
        summary: {
          total_spent: 450000,
          total_orders: 25
        }
      }
    };
  },

  // ===================================
  // Dashboard용 통합 API (Aggregator)
  // ===================================
  // ERD 기반 응답을 Dashboard 형식으로 변환
  getAllPurchaseHistory: async (user_id: number): Promise<ApiResponse<{ purchaseHistory: PurchaseHistoryData }>> => {
    try {
      const response = await purchaseHistoryApi.getPurchaseHistory(user_id);

      if (!response.success || !response.data) {
        return {
          success: false,
          data: null as any,
          error: 'Failed to fetch purchase history'
        };
      }

      // ERD 기반 PurchaseItem을 Dashboard Order 형식으로 변환
      const orders: Order[] = response.data.purchases.map((item, index) => ({
        id: `order-${item.id}`,
        orderNumber: `ORD-${String(item.id).padStart(6, '0')}`,
        date: item.date,
        status: 'completed' as const, // ERD에는 status 없음, 기본값 사용
        totalAmount: item.price,
        items: [{
          id: `item-${item.id}`,
          name: item.product_info?.category || '상품', // ERD에 상품명 없음
          brand: item.platform_name,
          category: item.product_info?.category || '기타',
          price: item.price,
          quantity: 1,
          image: '📦' // ERD에 이미지 없음, 이모지 사용
        }],
        paymentMethod: item.platform_name,
        ...(index % 3 === 0 && { trackingNumber: `TRK${item.id}0000` })
      }));

      // Summary 계산 (totalItems 추가)
      const totalItems = response.data.purchases.length;
      const purchaseHistoryData: PurchaseHistoryData = {
        summary: {
          totalOrders: response.data.summary.total_orders,
          totalSpent: response.data.summary.total_spent,
          totalItems: totalItems,
          averageOrderValue: response.data.summary.total_orders > 0
            ? Math.round(response.data.summary.total_spent / response.data.summary.total_orders)
            : 0
        },
        orders: orders,
        pagination: response.data.pagination
      };

      return {
        success: true,
        data: {
          purchaseHistory: purchaseHistoryData
        }
      };
    } catch (error) {
      console.error('getAllPurchaseHistory error:', error);
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

import { apiClient } from './client';
import { ApiResponse } from '../../types';

// CLAUDE.md ERD 기반 Purchase History API
// ERD: purchase_history { id, user_id, date(YYYY-MM-DD), platform_name, price }
// ERD: products { product_id, price, platform_name, category, review }

// GET /api/purchase-history?user_id={user_id}
interface PurchaseItem {
  id: number;
  user_id: number;
  product_id?: number;
  date: string;
  name?: string | null;
  platform_name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
  product_url?: string | null;
}

interface PurchaseHistoryResponse {
  user_id: number;
  purchases: PurchaseItem[];
  summary: {
    total_orders: number;
    total_spent: number;
    total_items: number;
    average_order_value: number;
  };
}

interface CheckoutPayload {
  user_id: number;
  product_ids: number[];
}

interface CheckoutApiResponse {
  success: boolean;
  purchased: PurchaseItem[];
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
  imageUrl?: string;
}

// Mock Purchase History API
export const purchaseHistoryApi = {
  getPurchaseHistory: async (user_id: number, page = 1): Promise<PurchaseHistoryResponse> => {
    const response = await apiClient.get<PurchaseHistoryResponse>('/purchase-history', {
      user_id,
      page,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || '구매이력을 불러오지 못했습니다.');
    }

    return response.data;
  },

  checkout: async (payload: CheckoutPayload): Promise<CheckoutApiResponse> => {
    const response = await apiClient.post<CheckoutApiResponse>('/purchase-history/checkout', payload);

    if (!response.success || !response.data) {
      throw new Error(response.error || '구매 완료 처리를 할 수 없습니다.');
    }

    return response.data;
  },

  // ===================================
  // Dashboard용 통합 API (Aggregator)
  // ===================================
  // ERD 기반 응답을 Dashboard 형식으로 변환
  getAllPurchaseHistory: async (user_id: number): Promise<ApiResponse<{ purchaseHistory: PurchaseHistoryData }>> => {
    try {
      const response = await purchaseHistoryApi.getPurchaseHistory(user_id);

      // ERD 기반 PurchaseItem을 Dashboard Order 형식으로 변환
      const ordersMap = new Map<string, Order>();

      response.purchases.forEach((item) => {
        const dateKey = item.date;
        const orderId = `order-${dateKey}`;
        let order = ordersMap.get(dateKey);

        if (!order) {
          order = {
            id: orderId,
            orderNumber: dateKey,
            date: item.date,
            status: 'completed' as const,
            totalAmount: 0,
            items: [],
            paymentMethod: item.platform_name,
          };
          ordersMap.set(dateKey, order);
        }

        order.totalAmount += item.price;
        const hasImage = Boolean(item.image_url && item.image_url.length > 0);
        order.items.push({
          id: `item-${item.id}`,
          name: item.name || item.category || '상품',
          brand: item.platform_name,
          category: item.category || '기타',
          price: item.price,
          quantity: 1,
          image: hasImage ? '' : '📦',
          imageUrl: hasImage ? item.image_url! : undefined,
        });

        const uniqueBrands = new Set(order.items.map((i) => i.brand));
        order.paymentMethod = uniqueBrands.size === 1 ? item.platform_name : '다양한 스토어';
      });

      const orders = Array.from(ordersMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const totalItems = response.summary.total_items ?? response.purchases.length;
      const totalOrders = orders.length;
      const purchaseHistoryData: PurchaseHistoryData = {
        summary: {
          totalOrders,
          totalSpent: response.summary.total_spent,
          totalItems: totalItems,
          averageOrderValue: Math.round(response.summary.average_order_value || 0)
        },
        orders: orders,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: totalItems,
        },
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

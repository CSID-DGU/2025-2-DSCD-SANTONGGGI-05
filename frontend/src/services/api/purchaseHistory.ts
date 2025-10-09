import { ApiResponse } from '../../types';

// Purchase History Types
export interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  brand?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  totalAmount: number;
  items: PurchaseItem[];
  paymentMethod: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export interface PurchaseSummary {
  totalOrders: number;
  totalSpent: number;
  totalItems: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  favoriteCategory: string;
}

export interface PurchaseHistoryData {
  orders: PurchaseOrder[];
  summary: PurchaseSummary;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PurchaseHistoryApiResponse {
  purchaseHistory: PurchaseHistoryData;
  lastUpdated: string;
}

// Mock Purchase History API
export const purchaseHistoryApi = {
  // Get user purchase history
  getPurchaseHistory: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    dateRange?: string
  ): Promise<ApiResponse<PurchaseHistoryApiResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockOrders: PurchaseOrder[] = [
      {
        id: 'order-001',
        orderNumber: 'ORD-2024-001',
        date: '2024-12-15T10:30:00Z',
        status: 'completed',
        totalAmount: 45900,
        paymentMethod: '카드',
        deliveryAddress: '서울시 강남구 테헤란로 123',
        estimatedDelivery: '2024-12-16',
        trackingNumber: 'TK123456789',
        items: [
          {
            id: 'item-001',
            name: '프리미엄 물티슈 10팩',
            price: 15900,
            quantity: 2,
            image: '🧻',
            category: '생활용품',
            brand: 'CleanCare'
          },
          {
            id: 'item-002',
            name: '친환경 주방세제 2L',
            price: 8500,
            quantity: 1,
            image: '🧽',
            category: '청소용품',
            brand: 'EcoClean'
          },
          {
            id: 'item-003',
            name: '미네랄 워터 24병',
            price: 12000,
            quantity: 1,
            image: '💧',
            category: '음료',
            brand: 'PureWater'
          }
        ]
      },
      {
        id: 'order-002',
        orderNumber: 'ORD-2024-002',
        date: '2024-12-10T14:20:00Z',
        status: 'completed',
        totalAmount: 28000,
        paymentMethod: '계좌이체',
        deliveryAddress: '서울시 강남구 테헤란로 123',
        estimatedDelivery: '2024-12-11',
        trackingNumber: 'TK987654321',
        items: [
          {
            id: 'item-004',
            name: '고급 화장지 48롤',
            price: 28000,
            quantity: 1,
            image: '🧻',
            category: '생활용품',
            brand: 'SoftTissue'
          }
        ]
      },
      {
        id: 'order-003',
        orderNumber: 'ORD-2024-003',
        date: '2024-12-05T16:45:00Z',
        status: 'pending',
        totalAmount: 19800,
        paymentMethod: '카드',
        deliveryAddress: '서울시 강남구 테헤란로 123',
        estimatedDelivery: '2024-12-17',
        items: [
          {
            id: 'item-005',
            name: '다목적 세정제 3개',
            price: 6800,
            quantity: 3,
            image: '🧴',
            category: '청소용품',
            brand: 'MultiClean'
          }
        ]
      },
      {
        id: 'order-004',
        orderNumber: 'ORD-2024-004',
        date: '2024-11-28T11:15:00Z',
        status: 'completed',
        totalAmount: 67500,
        paymentMethod: '카드',
        deliveryAddress: '서울시 강남구 테헤란로 123',
        estimatedDelivery: '2024-11-29',
        trackingNumber: 'TK456789123',
        items: [
          {
            id: 'item-006',
            name: '유기농 세제 세트',
            price: 25000,
            quantity: 1,
            image: '🌱',
            category: '청소용품',
            brand: 'OrganicLife'
          },
          {
            id: 'item-007',
            name: '프리미엄 샴푸 & 린스',
            price: 42500,
            quantity: 1,
            image: '🧴',
            category: '개인관리',
            brand: 'HairCare'
          }
        ]
      },
      {
        id: 'order-005',
        orderNumber: 'ORD-2024-005',
        date: '2024-11-20T09:30:00Z',
        status: 'refunded',
        totalAmount: 15000,
        paymentMethod: '카드',
        deliveryAddress: '서울시 강남구 테헤란로 123',
        items: [
          {
            id: 'item-008',
            name: '주방용 스펀지 20개',
            price: 15000,
            quantity: 1,
            image: '🧽',
            category: '청소용품',
            brand: 'KitchenClean'
          }
        ]
      }
    ];

    const summary: PurchaseSummary = {
      totalOrders: 24,
      totalSpent: 486200,
      totalItems: 67,
      averageOrderValue: 20258,
      lastPurchaseDate: '2024-12-15',
      favoriteCategory: '생활용품'
    };

    const mockData: PurchaseHistoryApiResponse = {
      purchaseHistory: {
        orders: mockOrders,
        summary,
        pagination: {
          currentPage: page,
          totalPages: 3,
          totalItems: 24,
          itemsPerPage: limit
        }
      },
      lastUpdated: new Date().toISOString()
    };

    return {
      success: true,
      data: mockData
    };
  },

  // Get order details by ID
  getOrderDetails: async (orderId: string): Promise<ApiResponse<{ order: PurchaseOrder }>> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    const mockOrder: PurchaseOrder = {
      id: orderId,
      orderNumber: 'ORD-2024-001',
      date: '2024-12-15T10:30:00Z',
      status: 'completed',
      totalAmount: 45900,
      paymentMethod: '카드',
      deliveryAddress: '서울시 강남구 테헤란로 123',
      estimatedDelivery: '2024-12-16',
      trackingNumber: 'TK123456789',
      items: [
        {
          id: 'item-001',
          name: '프리미엄 물티슈 10팩',
          price: 15900,
          quantity: 2,
          image: '🧻',
          category: '생활용품',
          brand: 'CleanCare'
        }
      ]
    };

    return {
      success: true,
      data: { order: mockOrder }
    };
  },

  // Reorder items from previous order
  reorderItems: async (orderId: string): Promise<ApiResponse<{ message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      data: { message: '장바구니에 상품이 추가되었습니다.' }
    };
  },

  // Cancel order
  cancelOrder: async (orderId: string): Promise<ApiResponse<{ message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: { message: '주문이 취소되었습니다.' }
    };
  },

  // Request refund
  requestRefund: async (orderId: string, reason: string): Promise<ApiResponse<{ message: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      success: true,
      data: { message: '환불 요청이 접수되었습니다.' }
    };
  }
};
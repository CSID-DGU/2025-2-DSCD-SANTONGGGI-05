// Mock cart API service - CLAUDE.md ERD 기반
// ERD: cart { product_id: number, user_id: number, platform_name: string, price: number }

import { CartItem as UICartItem, CartSummary } from '../../types/cart';

// API 응답 타입 (ERD 기반)
export interface ApiCartItem {
  product_id: number;
  user_id: number;
  platform_name: string;
  price: number;
}

interface GetCartResponse {
  items: ApiCartItem[];
}

interface AddToCartRequest {
  user_id: number;
  product_id: number;
  platform_name: string;
  price: number;
}

interface AddToCartResponse {
  success: boolean;
  message: string;
  item: ApiCartItem;
}

interface DeleteCartItemResponse {
  success: boolean;
  message: string;
}

// API 응답을 UI 타입으로 변환하는 함수
export const convertApiCartItemToUI = (apiItem: ApiCartItem): UICartItem => {
  return {
    id: `${apiItem.product_id}`,
    productId: `${apiItem.product_id}`,
    product: {
      id: `${apiItem.product_id}`,
      name: `상품 ${apiItem.product_id}`,
      description: '',
      price: apiItem.price,
      currency: 'KRW',
      images: [],
      category: { id: '1', name: '기타', slug: 'other' },
      brand: apiItem.platform_name,
      sku: `${apiItem.product_id}`,
      stock: 100,
      url: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    unitPrice: apiItem.price,
    addedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// CartSummary 계산 함수
export const calculateCartSummary = (items: UICartItem[]): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice, 0);
  const itemCount = items.length; // 상품 개수 (수량 아님)
  const tax = 0; // 세금 없음
  const shipping = 0; // 무료 배송
  const discount = 0; // 할인 없음
  const total = subtotal + tax + shipping - discount;

  return {
    subtotal,
    tax,
    shipping,
    discount,
    total,
    currency: 'KRW',
    itemCount,
  };
};

export const cartApi = {
  // GET /api/cart?user_id={user_id}
  getCart: async (user_id?: number) => {
    // Mock get cart
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockItems: ApiCartItem[] = [
      {
        product_id: 501,
        user_id: user_id || 1123,
        platform_name: '쿠팡',
        price: 12000
      },
      {
        product_id: 502,
        user_id: user_id || 1123,
        platform_name: '네이버쇼핑',
        price: 15000
      }
    ];

    return {
      data: {
        items: mockItems
      }
    };
  },

  // POST /api/cart/items
  addToCart: async (request: AddToCartRequest) => {
    // Mock add to cart
    await new Promise(resolve => setTimeout(resolve, 300));

    const newItem: ApiCartItem = {
      product_id: request.product_id,
      user_id: request.user_id,
      platform_name: request.platform_name,
      price: request.price
    };

    return {
      data: {
        success: true,
        message: '장바구니에 추가되었습니다',
        item: newItem
      }
    };
  },

  // DELETE /api/cart/items/{itemId}?user_id={user_id}
  removeItem: async (itemId: number, user_id: number) => {
    // Mock remove item
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: {
        success: true,
        message: '장바구니에서 삭제되었습니다'
      }
    };
  }
};
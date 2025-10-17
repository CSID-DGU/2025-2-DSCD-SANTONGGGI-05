// Mock cart API service - CLAUDE.md ERD 기반
// ERD: cart { product_id: number, user_id: number, platform_name: string, price: number }

interface CartItem {
  product_id: number;
  user_id: number;
  platform_name: string;
  price: number;
}

interface GetCartResponse {
  items: CartItem[];
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
  item: CartItem;
}

interface DeleteCartItemResponse {
  success: boolean;
  message: string;
}

export const cartApi = {
  // GET /api/cart?user_id={user_id}
  getCart: async (user_id?: number) => {
    // Mock get cart
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockItems: CartItem[] = [
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

    const newItem: CartItem = {
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
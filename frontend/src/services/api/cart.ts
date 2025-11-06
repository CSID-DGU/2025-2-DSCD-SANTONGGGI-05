import { apiClient } from './client';
import { CartItem as UICartItem, CartSummary } from '../../types/cart';
import { DEFAULT_CART_IMAGE_URL, DEFAULT_CART_PRODUCT_URL } from '../../constants/cart';

export interface ApiCartItem {
  product_id: number;
  user_id: number;
  name?: string | null;
  platform_name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  createdAt: string;
}

interface GetCartResponse {
  items: ApiCartItem[];
}

export interface AddToCartRequest {
  user_id: number;
  product_id: number;
  name?: string | null;
  platform_name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
}

interface CartMutationResponse {
  success: boolean;
  message: string;
  item?: ApiCartItem;
}

export const convertApiCartItemToUI = (apiItem: ApiCartItem): UICartItem => {
  const createdAt = new Date(apiItem.createdAt);
  const imageUrl = apiItem.imageUrl && apiItem.imageUrl.trim().length > 0
    ? apiItem.imageUrl
    : DEFAULT_CART_IMAGE_URL;
  const productUrl = apiItem.productUrl && apiItem.productUrl.trim().length > 0
    ? apiItem.productUrl
    : DEFAULT_CART_PRODUCT_URL;

  return {
    id: `${apiItem.product_id}`,
    productId: `${apiItem.product_id}`,
    product: {
      id: `${apiItem.product_id}`,
      name: apiItem.name ?? `상품 ${apiItem.product_id}`,
      description: '',
      price: apiItem.price,
      currency: 'KRW',
      images: [
        {
          id: `img-${apiItem.product_id}`,
          url: imageUrl,
          alt: apiItem.name ?? '',
          isPrimary: true,
          order: 0,
        },
      ],
      category: { id: 'misc', name: '기타', slug: 'misc' },
      brand: apiItem.platform_name,
      sku: `${apiItem.product_id}`,
      stock: 0,
      url: productUrl,
      createdAt,
      updatedAt: createdAt,
    },
    unitPrice: apiItem.price,
    addedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  };
};

export const calculateCartSummary = (items: UICartItem[]): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice, 0);
  const itemCount = items.length;
  const tax = 0;
  const shipping = 0;
  const discount = 0;
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
  getCart: async (user_id: number): Promise<GetCartResponse> => {
    const response = await apiClient.get<GetCartResponse>('/cart', { user_id });

    if (!response.success || !response.data) {
      throw new Error(response.error || '장바구니를 불러오지 못했습니다.');
    }

    return response.data;
  },

  addToCart: async (request: AddToCartRequest): Promise<CartMutationResponse> => {
    const response = await apiClient.post<CartMutationResponse>('/cart/items', request);

    if (!response.success || !response.data) {
      throw new Error(response.error || '장바구니에 추가하지 못했습니다.');
    }

    return response.data;
  },

  removeItem: async (productId: number, user_id: number): Promise<CartMutationResponse> => {
    const response = await apiClient.delete<CartMutationResponse>(
      `/cart/items/${productId}`,
      { user_id }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || '장바구니에서 삭제하지 못했습니다.');
    }

    return response.data;
  }
};

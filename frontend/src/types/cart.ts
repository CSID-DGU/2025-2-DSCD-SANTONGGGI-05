import { BaseEntity } from './index';

export interface DetailedProduct extends BaseEntity {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: ProductImage[];
  category: ProductCategory;
  brand: string;
  sku: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  url?: string; // 외부 쇼핑몰 URL (쿠팡, 네이버쇼핑 등)
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'color' | 'size';
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  sku: string;
}

export interface CartItem extends BaseEntity {
  productId: string;
  product: DetailedProduct;
  variantId?: string;
  variant?: ProductVariant;
  unitPrice: number;
  addedAt: Date;
  customizations?: CartItemCustomization[];
}

export interface CartItemCustomization {
  type: string;
  value: string;
  additionalPrice?: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  itemCount: number; // 장바구니에 담긴 상품 개수 (수량 아님)
}

export interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface AddCartItemParams {
  productId: string;
  name: string;
  price: number;
  platformName: string;
  imageUrl: string;
  productUrl: string;
}

export interface CartContextValue extends Omit<CartState, 'items'> {
  // Simplified properties for component compatibility
  items: CartItemType[];
  total: number;
  itemCount: number;

  // Original methods
  addItem: (params: AddCartItemParams) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemByProductId: (productId: string) => CartItem | undefined;
  refreshCart: () => Promise<void>;

  // Simplified methods for component compatibility
  addToCart: (item: { id: string; name: string; price: number; platformName: string; imageUrl?: string; productUrl?: string }) => Promise<void>;
}

export interface CartUpdate {
  type: 'add' | 'remove' | 'clear' | 'apply_discount';
  productId?: string;
  itemId?: string;
  variantId?: string;
  discountCode?: string;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  customizations?: CartItemCustomization[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  carrier: string;
}

export interface DiscountCoupon {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minimumAmount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount?: number;
}

// Simplified types for component compatibility
export interface CartItemType {
  id: string;
  name: string;
  price: number;
  image?: string;
  variant?: string;
  url?: string; // 외부 쇼핑몰 URL (쿠팡, 네이버쇼핑 등)
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parentId?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  badge?: string;
  rating?: number;
  url?: string; // 외부 쇼핑몰 URL (쿠팡, 네이버쇼핑 등)
}

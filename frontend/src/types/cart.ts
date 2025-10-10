import { BaseEntity } from './index';

export interface Product extends BaseEntity {
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
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  itemCount: number;
}

export interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface CartContextValue extends CartState {
  // Simplified properties for component compatibility
  items: CartItemType[];
  total: number;
  itemCount: number;

  // Original methods
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: () => Promise<void>;
  calculateShipping: (shippingMethod: string) => Promise<void>;
  getItemByProductId: (productId: string) => CartItem | undefined;
  getTotalQuantity: () => number;
  refreshCart: () => Promise<void>;

  // Simplified methods for component compatibility
  addToCart: (item: { id: string; name: string; price: number; image?: string; quantity: number }) => Promise<void>;
}

export interface CartUpdate {
  type: 'add' | 'remove' | 'update_quantity' | 'clear' | 'apply_discount';
  productId?: string;
  itemId?: string;
  quantity?: number;
  variantId?: string;
  discountCode?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variantId?: string;
  customizations?: CartItemCustomization[];
}

export interface UpdateCartRequest {
  itemId: string;
  quantity?: number;
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
  quantity: number;
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
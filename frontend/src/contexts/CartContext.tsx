import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { CartState, CartContextValue, CartItem, CartSummary } from '../types/cart';
import { cartApi, convertApiCartItemToUI, calculateCartSummary } from '../services/api/cart';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storage/localStorage';

// Sample data for testing mockup design
const sampleCartItems: CartItem[] = [
  {
    id: '1',
    productId: 'water-2l',
    product: {
      id: 'water-2l',
      name: '미네랄 워터 2L',
      description: '프리미엄 미네랄 워터',
      price: 1500,
      currency: 'KRW',
      images: [{ id: 'img-1', url: 'https://cdn.pixabay.com/photo/2016/10/22/20/34/bottles-1761613_1280.jpg', alt: '미네랄 워터', isPrimary: true, order: 0 }],
      brand: '에비안',
      category: { id: '1', name: '음료', slug: 'beverages' },
      sku: 'water-2l-001',
      stock: 100,
      url: 'https://www.coupang.com/vp/products/6305358952',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    unitPrice: 1500,
    addedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    productId: 'cleaner-30',
    product: {
      id: 'cleaner-30',
      name: '화장지 30롤',
      description: '프리미엄 화장지',
      price: 15000,
      currency: 'KRW',
      images: [{ id: 'img-2', url: 'https://cdn.pixabay.com/photo/2020/04/28/20/12/toilet-paper-5106638_1280.jpg', alt: '화장지', isPrimary: true, order: 0 }],
      brand: '크리넥스',
      category: { id: '2', name: '생활용품', slug: 'household' },
      sku: 'cleaner-30-001',
      stock: 50,
      url: 'https://search.shopping.naver.com/catalog/35126752621',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    unitPrice: 15000,
    addedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    productId: 'detergent-1l',
    product: {
      id: 'detergent-1l',
      name: '주방세제 1L',
      description: '친환경 주방세제',
      price: 3500,
      currency: 'KRW',
      images: [{ id: 'img-3', url: 'https://cdn.pixabay.com/photo/2020/03/24/12/46/soap-4963471_1280.jpg', alt: '주방세제', isPrimary: true, order: 0 }],
      brand: '참그린',
      category: { id: '2', name: '생활용품', slug: 'household' },
      sku: 'detergent-1l-001',
      stock: 30,
      url: 'https://www.coupang.com/vp/products/7234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    unitPrice: 3500,
    addedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Initial state with sample data
const initialState: CartState = {
  items: sampleCartItems,
  summary: {
    subtotal: 20000, // 1500 + 15000 + 3500
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 20000,
    currency: 'KRW',
    itemCount: 3, // 상품 개수 (수량 아님)
  },
  isLoading: false,
  error: null,
  lastUpdated: new Date(),
};

// Action types
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART_DATA'; payload: { items: CartItem[]; summary: CartSummary } }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { itemId: string; updates: Partial<CartItem> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_SUMMARY'; payload: CartSummary }
  | { type: 'SET_LAST_UPDATED'; payload: Date };

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_CART_DATA':
      return {
        ...state,
        items: action.payload.items,
        summary: action.payload.summary,
        lastUpdated: new Date(),
        error: null,
      };

    case 'ADD_ITEM':
      // 이미 장바구니에 있는 상품인지 확인
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId &&
                item.variantId === action.payload.variantId
      );

      // 이미 있으면 추가하지 않음 (수량 개념 없음)
      if (existingItemIndex >= 0) {
        return state;
      }

      // 새 상품 추가
      return {
        ...state,
        items: [...state.items, action.payload],
        lastUpdated: new Date(),
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? { ...item, ...action.payload.updates }
            : item
        ),
        lastUpdated: new Date(),
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        lastUpdated: new Date(),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        summary: {
          ...initialState.summary,
          currency: state.summary.currency,
        },
        lastUpdated: new Date(),
      };

    case 'UPDATE_SUMMARY':
      return {
        ...state,
        summary: action.payload,
      };

    case 'SET_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: action.payload,
      };

    default:
      return state;
  }
};

// Context
const CartContext = createContext<CartContextValue | undefined>(undefined);

// Provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load cart data when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && user) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const response = await cartApi.getCart();
          const uiItems = response.data.items.map(convertApiCartItemToUI);
          const summary = calculateCartSummary(uiItems);
          dispatch({
            type: 'SET_CART_DATA',
            payload: {
              items: uiItems,
              summary: summary,
            },
          });
        } catch (error: any) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // Load cart from localStorage for guest users
        const guestCart = storageService.getGuestCart();
        if (guestCart) {
          dispatch({
            type: 'SET_CART_DATA',
            payload: {
              items: guestCart.items,
              summary: guestCart.summary,
            },
          });
        }
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]); // Only run when auth status or user ID changes

  // Auto-save cart to localStorage for guest users
  useEffect(() => {
    if (!isAuthenticated && state.items.length > 0) {
      storageService.setGuestCart({
        items: state.items,
        summary: state.summary,
        lastUpdated: state.lastUpdated,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items.length, isAuthenticated]); // Only track length and auth status

  // Load cart data from API
  const loadCartData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartApi.getCart();
      const uiItems = response.data.items.map(convertApiCartItemToUI);
      const summary = calculateCartSummary(uiItems);
      dispatch({
        type: 'SET_CART_DATA',
        payload: {
          items: uiItems,
          summary: summary,
        },
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load guest cart from localStorage
  const loadGuestCart = useCallback(() => {
    const guestCart = storageService.getGuestCart();
    if (guestCart) {
      dispatch({
        type: 'SET_CART_DATA',
        payload: {
          items: guestCart.items,
          summary: guestCart.summary,
        },
      });
    }
  }, []);

  // Add item to cart
  const addItem = useCallback(async (productId: string, variantId?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isAuthenticated && user) {
        const response = await cartApi.addToCart({
          user_id: user.id,
          product_id: Number(productId),
          platform_name: '쿠팡',
          price: 10000, // 임시 가격
        });

        const uiItem = convertApiCartItemToUI(response.data.item);
        dispatch({ type: 'ADD_ITEM', payload: uiItem });

        // Recalculate summary with the new item
        const updatedItems = [...state.items, uiItem];
        dispatch({ type: 'UPDATE_SUMMARY', payload: calculateCartSummary(updatedItems) });
      } else {
        // For guest users, simulate adding item
        // In a real app, you'd need product data to create the cart item
        const newItem: CartItem = {
          id: `temp-${Date.now()}`,
          productId,
          product: {
            id: productId,
            name: 'Product',
            description: '',
            price: 0,
            currency: 'KRW',
            images: [],
            category: { id: '', name: '', slug: '' },
            brand: '',
            sku: '',
            stock: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...(variantId && { variantId }),
          unitPrice: 0, // Would come from product data
          addedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        dispatch({ type: 'ADD_ITEM', payload: newItem });

        // Recalculate summary with the new item included
        const updatedItems = [...state.items, newItem];
        dispatch({ type: 'UPDATE_SUMMARY', payload: calculateCartSummary(updatedItems) });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // Include user for authenticated calls

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isAuthenticated && user) {
        await cartApi.removeItem(Number(itemId), user.id);
      }

      dispatch({ type: 'REMOVE_ITEM', payload: itemId });

      // Recalculate summary
      const remainingItems = state.items.filter(item => item.id !== itemId);
      const newSummary = calculateCartSummary(remainingItems);
      dispatch({ type: 'UPDATE_SUMMARY', payload: newSummary });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // Include user for authenticated calls

  // Clear cart (local only - no API call needed)
  const clearCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (!isAuthenticated) {
        storageService.clearGuestCart();
      }

      dispatch({ type: 'CLEAR_CART' });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated]);

  // Get item by product ID
  const getItemByProductId = useCallback((productId: string): CartItem | undefined => {
    return state.items.find(item => item.productId === productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items.length]); // Use length to avoid full array dependency

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      await loadCartData();
    } else {
      loadGuestCart();
    }
  }, [isAuthenticated, loadCartData, loadGuestCart]);

  // Add simplified methods for component compatibility
  const addToCart = useCallback(async (item: { id: string; name: string; price: number; image?: string }) => {
    // Simplified addToCart that matches component expectations
    try {
      await addItem(item.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  }, [addItem]);

  // Simplified getters for component compatibility
  const items = useMemo(() => state.items.map(item => {
    const mappedItem: any = {
      id: item.id,
      name: item.product?.name || `Product ${item.productId}`,
      price: item.unitPrice,
    };

    if (item.product?.images?.[0]?.url) {
      mappedItem.image = item.product.images[0].url;
    }

    if (item.variant?.name) {
      mappedItem.variant = item.variant.name;
    }

    if (item.product?.url) {
      mappedItem.url = item.product.url;
    }

    return mappedItem;
  }), [state.items]);

  const contextValue: CartContextValue = useMemo(() => ({
    items,
    summary: state.summary,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    total: state.summary.total,
    itemCount: state.summary.itemCount,
    addItem,
    addToCart,
    removeItem,
    clearCart,
    getItemByProductId,
    refreshCart,
  }), [
    items,
    state.summary,
    state.isLoading,
    state.error,
    state.lastUpdated,
    addItem,
    addToCart,
    removeItem,
    clearCart,
    getItemByProductId,
    refreshCart,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
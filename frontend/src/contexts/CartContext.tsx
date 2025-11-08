import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  CartState,
  CartContextValue,
  CartItem,
  CartSummary,
  AddCartItemParams,
} from '../types/cart';
import { cartApi, convertApiCartItemToUI, calculateCartSummary } from '../services/api/cart';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storage/localStorage';
import { DEFAULT_CART_IMAGE_URL, DEFAULT_CART_PRODUCT_URL } from '../constants/cart';

const initialState: CartState = {
  items: [],
  summary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    currency: 'KRW',
    itemCount: 0,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
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

    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.variantId === action.payload.variantId
      );

      if (existingItemIndex >= 0) {
        const updatedItems = state.items.slice();
        updatedItems[existingItemIndex] = action.payload;
        return {
          ...state,
          items: updatedItems,
          lastUpdated: new Date(),
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload],
        lastUpdated: new Date(),
      };
    }

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
        storageService.clearGuestCart();
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const response = await cartApi.getCart(user.id);
          const uiItems = response.items.map(convertApiCartItemToUI);
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
          dispatch({
            type: 'SET_CART_DATA',
            payload: {
              items: [],
              summary: calculateCartSummary([]),
            },
          });
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
  }, [isAuthenticated, state.items, state.summary, state.lastUpdated]);

  // Load cart data from API
  const loadCartData = useCallback(async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartApi.getCart(user.id);
      const uiItems = response.items.map(convertApiCartItemToUI);
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
      dispatch({
        type: 'SET_CART_DATA',
        payload: {
          items: [],
          summary: calculateCartSummary([]),
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

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
  const addItem = useCallback(async ({
    productId,
    name,
    price,
    platformName,
    imageUrl,
    productUrl,
  }: AddCartItemParams) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const resolvedImageUrl = imageUrl && imageUrl.trim().length > 0
        ? imageUrl
        : DEFAULT_CART_IMAGE_URL;
      const resolvedProductUrl = productUrl && productUrl.trim().length > 0
        ? productUrl
        : DEFAULT_CART_PRODUCT_URL;

      if (isAuthenticated && user) {
        const response = await cartApi.addToCart({
          user_id: user.id,
          product_id: Number(productId),
          name,
          platform_name: platformName,
          price,
          imageUrl: resolvedImageUrl,
          productUrl: resolvedProductUrl,
        });

        if (!response.item) {
          throw new Error('장바구니 항목 정보를 받을 수 없습니다.');
        }

        const converted = convertApiCartItemToUI(response.item);
        const uiItem: CartItem = {
          ...converted,
          product: {
            ...converted.product,
            name: name || converted.product.name,
            images: [
              {
                id: `img-${productId}`,
                url: resolvedImageUrl,
                alt: name || converted.product.name,
                isPrimary: true,
                order: 0,
              },
            ],
            url: resolvedProductUrl,
          },
        };

        const mergedItems = (() => {
          const existingIndex = state.items.findIndex(item => item.productId === uiItem.productId);
          if (existingIndex >= 0) {
            const clone = state.items.slice();
            clone[existingIndex] = uiItem;
            return clone;
          }
          return [...state.items, uiItem];
        })();

        const summary = calculateCartSummary(mergedItems);
        dispatch({
          type: 'SET_CART_DATA',
          payload: {
            items: mergedItems,
            summary,
          },
        });
      } else {
        // For guest users, simulate adding item
        // In a real app, you'd need product data to create the cart item
        const newItem: CartItem = {
          id: `temp-${Date.now()}`,
          productId,
          product: {
            id: productId,
            name,
            description: '',
            price,
            currency: 'KRW',
            images: [
              {
                id: `img-${Date.now()}`,
                url: resolvedImageUrl,
                alt: name,
                isPrimary: true,
                order: 0,
              },
            ],
            category: { id: '', name: '', slug: '' },
            brand: platformName,
            sku: '',
            stock: 0,
            url: resolvedProductUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          unitPrice: price,
          addedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mergedItems = (() => {
          const existingIndex = state.items.findIndex(item => item.productId === newItem.productId);
          if (existingIndex >= 0) {
            const clone = state.items.slice();
            clone[existingIndex] = newItem;
            return clone;
          }
          return [...state.items, newItem];
        })();

        const summary = calculateCartSummary(mergedItems);
        dispatch({
          type: 'SET_CART_DATA',
          payload: {
            items: mergedItems,
            summary,
          },
        });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, user, state.items]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isAuthenticated && user) {
        await cartApi.removeItem(Number(itemId), user.id);
      }

      const remainingItems = state.items.filter(item => item.id !== itemId);
      const newSummary = calculateCartSummary(remainingItems);
      dispatch({
        type: 'SET_CART_DATA',
        payload: {
          items: remainingItems,
          summary: newSummary,
        },
      });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, user, state.items]);

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
  }, [state.items]);

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      await loadCartData();
    } else {
      loadGuestCart();
    }
  }, [isAuthenticated, loadCartData, loadGuestCart]);

  // Add simplified methods for component compatibility
  const addToCart = useCallback(async (item: { id: string; name: string; price: number; platformName: string; imageUrl?: string; productUrl?: string }) => {
    try {
      await addItem({
        productId: item.id,
        name: item.name,
        price: item.price,
        platformName: item.platformName,
        imageUrl: item.imageUrl ?? DEFAULT_CART_IMAGE_URL,
        productUrl: item.productUrl ?? DEFAULT_CART_PRODUCT_URL,
      });
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
      productId: item.productId,
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

    if (item.product?.category?.name) {
      mappedItem.category = item.product.category.name;
    }

    if (item.product?.brand) {
      mappedItem.platformName = item.product.brand;
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

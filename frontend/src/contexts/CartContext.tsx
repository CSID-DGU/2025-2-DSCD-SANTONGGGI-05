import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { CartState, CartContextValue, CartItem, CartSummary } from '../types/cart';
import { cartApi } from '../services/api/cart';
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
    quantity: 6,
    unitPrice: 1500,
    totalPrice: 9000,
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
    quantity: 2,
    unitPrice: 15000,
    totalPrice: 30000,
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
    quantity: 3,
    unitPrice: 3500,
    totalPrice: 10500,
    addedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Initial state with sample data
const initialState: CartState = {
  items: sampleCartItems,
  summary: {
    subtotal: 49500,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 49500,
    currency: 'KRW',
    itemCount: 11, // 6 + 2 + 3
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
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId &&
                item.variantId === action.payload.variantId
      );

      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + action.payload.quantity,
                totalPrice: (item.quantity + action.payload.quantity) * item.unitPrice
              }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }

      return {
        ...state,
        items: newItems,
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
          dispatch({
            type: 'SET_CART_DATA',
            payload: {
              items: response.data.items,
              summary: response.data.summary,
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
      dispatch({
        type: 'SET_CART_DATA',
        payload: {
          items: response.data.items,
          summary: response.data.summary,
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

  // Calculate cart summary
  const calculateSummary = (items: CartItem[]): CartSummary => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + tax + shipping - state.summary.discount;

    return {
      subtotal,
      tax,
      shipping,
      discount: state.summary.discount,
      total,
      currency: state.summary.currency,
      itemCount,
    };
  };

  // Add item to cart
  const addItem = useCallback(async (productId: string, quantity: number = 1, variantId?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isAuthenticated) {
        const response = await cartApi.addToCart({
          productId,
          quantity,
          variantId,
        });

        dispatch({ type: 'ADD_ITEM', payload: response.data.item as unknown as CartItem });
        dispatch({ type: 'UPDATE_SUMMARY', payload: response.data.summary });
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
          quantity,
          unitPrice: 0, // Would come from product data
          totalPrice: 0,
          addedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        dispatch({ type: 'ADD_ITEM', payload: newItem });

        // Will recalculate in next render with updated items
        setTimeout(() => {
          dispatch({ type: 'UPDATE_SUMMARY', payload: calculateSummary(state.items) });
        }, 0);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Don't include calculateSummary or state

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isAuthenticated) {
        await cartApi.removeItem(itemId);
      }

      dispatch({ type: 'REMOVE_ITEM', payload: itemId });

      // Recalculate summary
      const remainingItems = state.items.filter(item => item.id !== itemId);
      const newSummary = calculateSummary(remainingItems);
      dispatch({ type: 'UPDATE_SUMMARY', payload: newSummary });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update item quantity (local only - no API call needed)
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const item = state.items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      const updates: Partial<CartItem> = {
        quantity,
        totalPrice: quantity * item.unitPrice,
        updatedAt: new Date(),
      };

      dispatch({ type: 'UPDATE_ITEM', payload: { itemId, updates } });

      // Recalculate summary
      const updatedItems = state.items.map(i =>
        i.id === itemId ? { ...i, ...updates } : i
      );
      const newSummary = calculateSummary(updatedItems);
      dispatch({ type: 'UPDATE_SUMMARY', payload: newSummary });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear cart (local only - no API call needed)
  const clearCart = async () => {
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
  };

  // Get item by product ID
  const getItemByProductId = (productId: string): CartItem | undefined => {
    return state.items.find(item => item.productId === productId);
  };

  // Get total quantity
  const getTotalQuantity = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      await loadCartData();
    } else {
      loadGuestCart();
    }
  }, [isAuthenticated, loadCartData, loadGuestCart]);

  // Add simplified methods for component compatibility
  const addToCart = useCallback(async (item: { id: string; name: string; price: number; image?: string; quantity: number }) => {
    // Simplified addToCart that matches component expectations
    try {
      await addItem(item.id, item.quantity);
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
      quantity: item.quantity,
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
    updateQuantity,
    clearCart,
    getItemByProductId,
    getTotalQuantity,
    refreshCart,
  }), [
    items,
    state.summary,
    state.isLoading,
    state.error,
    state.lastUpdated,
    addItem,
    addToCart,
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
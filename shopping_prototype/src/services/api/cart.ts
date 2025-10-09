// Mock cart API service
export const cartApi = {
  getCart: async () => {
    // Mock get cart
    await new Promise(resolve => setTimeout(resolve, 500));
    const stored = localStorage.getItem('guest_cart');
    const cartData = stored ? JSON.parse(stored) : { items: [], summary: null };

    return {
      data: {
        items: cartData.items || [],
        summary: cartData.summary || {
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
          total: 0,
          currency: 'USD',
          itemCount: 0
        }
      }
    };
  },

  addToCart: async (request: any) => {
    // Mock add to cart
    await new Promise(resolve => setTimeout(resolve, 300));

    const newItem = {
      id: `item-${Date.now()}`,
      productId: request.productId,
      product: {
        name: `Product ${request.productId}`,
        images: []
      },
      variantId: request.variantId,
      quantity: request.quantity,
      unitPrice: 29.99,
      totalPrice: 29.99 * request.quantity,
      addedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      data: {
        item: newItem,
        summary: {
          subtotal: newItem.totalPrice,
          tax: newItem.totalPrice * 0.08,
          shipping: newItem.totalPrice > 50 ? 0 : 5.99,
          discount: 0,
          total: newItem.totalPrice * 1.08 + (newItem.totalPrice > 50 ? 0 : 5.99),
          currency: 'USD',
          itemCount: request.quantity
        }
      }
    };
  },

  updateItem: async (itemId: string, updates: any) => {
    // Mock update item
    await new Promise(resolve => setTimeout(resolve, 300));

    const updatedItem = {
      id: itemId,
      productId: 'product-1',
      product: { name: 'Updated Product' },
      quantity: updates.quantity,
      unitPrice: 29.99,
      totalPrice: 29.99 * updates.quantity,
      updatedAt: new Date()
    };

    return {
      data: {
        item: updatedItem,
        summary: {
          subtotal: updatedItem.totalPrice,
          tax: updatedItem.totalPrice * 0.08,
          shipping: updatedItem.totalPrice > 50 ? 0 : 5.99,
          discount: 0,
          total: updatedItem.totalPrice * 1.08 + (updatedItem.totalPrice > 50 ? 0 : 5.99),
          currency: 'USD',
          itemCount: updates.quantity
        }
      }
    };
  },

  removeItem: async (itemId: string) => {
    // Mock remove item
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  },

  clearCart: async () => {
    // Mock clear cart
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  },

  applyDiscount: async (code: string) => {
    // Mock apply discount
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        discount: { code, value: 10 },
        summary: {
          subtotal: 100,
          tax: 8,
          shipping: 5.99,
          discount: 10,
          total: 103.99,
          currency: 'USD',
          itemCount: 1
        }
      }
    };
  },

  removeDiscount: async () => {
    // Mock remove discount
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  },

  calculateShipping: async (method: string) => {
    // Mock calculate shipping
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        summary: {
          subtotal: 100,
          tax: 8,
          shipping: method === 'express' ? 15.99 : 5.99,
          discount: 0,
          total: method === 'express' ? 123.99 : 113.99,
          currency: 'USD',
          itemCount: 1
        }
      }
    };
  }
};
// Local storage service for cart and auth data
export const storageService = {
  // Auth-related storage
  setUser: (user: any) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  getUser: () => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  },

  setTokens: (tokens: any) => {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  },

  getTokens: () => {
    const stored = localStorage.getItem('auth_tokens');
    return stored ? JSON.parse(stored) : null;
  },

  clearAuth: () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_tokens');
  },

  // Guest cart storage
  setGuestCart: (cartData: any) => {
    localStorage.setItem('guest_cart', JSON.stringify(cartData));
  },

  getGuestCart: () => {
    const stored = localStorage.getItem('guest_cart');
    return stored ? JSON.parse(stored) : null;
  },

  clearGuestCart: () => {
    localStorage.removeItem('guest_cart');
  },

  // General utility methods
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get: (key: string) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  },

  remove: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};
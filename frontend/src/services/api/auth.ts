// Mock auth API service
export const authApi = {
  login: async (credentials: any) => {
    // Mock login - simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    };
  },

  register: async (data: any) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        user: {
          id: '1',
          email: data.email,
          name: data.name,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }
    };
  },

  refreshToken: async (refreshToken: string) => {
    // Mock token refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      accessToken: 'new-mock-access-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  },

  updateProfile: async (updates: any) => {
    // Mock profile update
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        id: '1',
        email: 'demo@example.com',
        name: updates.name || 'Demo User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updates
      }
    };
  },

  updatePreferences: async (preferences: any) => {
    // Mock preferences update
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences
      }
    };
  },

  checkAuth: async () => {
    // Mock auth check - simulate checking stored token
    await new Promise(resolve => setTimeout(resolve, 500));
    const stored = localStorage.getItem('auth_tokens');
    if (stored) {
      return {
        data: {
          user: {
            id: '1',
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          tokens: JSON.parse(stored)
        }
      };
    }
    throw new Error('Not authenticated');
  }
};
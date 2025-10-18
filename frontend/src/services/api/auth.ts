// Mock auth API service - ERD 기반
// ERD: users { id: number, number: string (username), password: string }

export const authApi = {
  // POST /api/auth/login
  login: async (credentials: any) => {
    // Mock login - simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - AuthContext 호환성을 위해 user와 tokens 객체 반환
    return {
      data: {
        user: {
          id: 1123,
          email: credentials.email || 'demo@example.com',
          name: 'Demo User',
          role: 'user' as const
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    };
  },

  // POST /api/auth/register
  register: async (data: any) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - AuthContext 호환성을 위해 user와 tokens 객체 반환
    return {
      data: {
        user: {
          id: 1124,
          email: data.email || 'newuser@example.com',
          name: data.name || 'New User',
          role: 'user' as const
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }
    };
  },

  // 내부 사용 - 토큰 검증용
  checkAuth: async () => {
    // Mock auth check - simulate checking stored token
    await new Promise(resolve => setTimeout(resolve, 500));
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      return {
        data: {
          user: {
            id: 1123,
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'user' as const
          },
          tokens: {
            accessToken: stored,
            refreshToken: 'mock-refresh-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        }
      };
    }
    throw new Error('Not authenticated');
  }
};
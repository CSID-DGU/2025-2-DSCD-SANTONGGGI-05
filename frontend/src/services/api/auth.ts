// Mock auth API service - ERD 기반
// ERD: users { id: number, number: string (username), password: string }

export const authApi = {
  // POST /api/auth/login
  login: async (credentials: any) => {
    // Mock login - simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // CLAUDE.md 명세에 따른 응답
    return {
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token',
        user_id: 1123 // user.id (Long)
      }
    };
  },

  // POST /api/auth/register
  register: async (data: any) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1000));

    // CLAUDE.md 명세에 따른 응답
    return {
      data: {
        user_id: 1124, // 생성된 user.id (Long)
        status: 'success'
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
          user_id: 1123,
          token: stored
        }
      };
    }
    throw new Error('Not authenticated');
  }
};
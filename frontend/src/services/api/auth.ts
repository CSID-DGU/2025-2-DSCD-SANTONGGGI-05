import { apiClient } from './client';
import type { LoginCredentials, RegisterData, User, AuthTokens } from '@/types/auth';

interface ApiUser {
  id: number;
  phone_number: string;
  name: string;
}

interface ApiAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface AuthApiResponse {
  user: ApiUser;
  tokens: ApiAuthTokens;
}

const mapUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  phone_number: apiUser.phone_number,
  name: apiUser.name,
  role: 'user',
});

const mapTokens = (apiTokens: ApiAuthTokens): AuthTokens => ({
  accessToken: apiTokens.accessToken,
  refreshToken: apiTokens.refreshToken,
  expiresAt: new Date(apiTokens.expiresAt),
});

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const payload = {
      phone_number: credentials.phone_number,
      password: credentials.password,
    };

    const response = await apiClient.post<AuthApiResponse>('/auth/login', payload);

    if (!response.success || !response.data) {
      throw new Error(response.error || '로그인에 실패했습니다.');
    }

    return {
      data: {
        user: mapUser(response.data.user),
        tokens: mapTokens(response.data.tokens),
      },
    };
  },

  register: async (data: RegisterData) => {
    const payload = {
      phone_number: data.phone_number,
      password: data.password,
      name: data.name,
    };

    const response = await apiClient.post<AuthApiResponse>('/auth/register', payload);

    if (!response.success || !response.data) {
      throw new Error(response.error || '회원가입에 실패했습니다.');
    }

    return {
      data: {
        user: mapUser(response.data.user),
        tokens: mapTokens(response.data.tokens),
      },
    };
  },

  checkAuth: async () => {
    const stored = localStorage.getItem('auth_user');
    const storedTokens = localStorage.getItem('auth_tokens');

    if (!stored || !storedTokens) {
      throw new Error('Not authenticated');
    }

    const user: User = JSON.parse(stored);
    const tokensData = JSON.parse(storedTokens) as ApiAuthTokens;

    return {
      data: {
        user,
        tokens: mapTokens(tokensData),
      },
    };
  },
};

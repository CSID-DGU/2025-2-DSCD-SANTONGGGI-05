// User 타입은 ERD 기준으로 독립 정의 (id: number)
export interface User {
  id: number;  // ERD: Long (number)
  phone_number: string;  // ERD: number 필드 (전화번호)
  name: string;
  avatar?: string;
  preferences?: UserPreferences;
  role: 'user' | 'admin';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  notifications: NotificationSettings;
  shopping: ShoppingPreferences;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

export interface ShoppingPreferences {
  defaultPaymentMethod?: string;
  defaultShippingAddress?: string;
  priceAlerts: boolean;
  categoryInterests: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  phone_number: string;  // 전화번호로 로그인
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  phone_number: string;  // 전화번호로 회원가입
  password: string;
  confirmPassword: string;
  name: string;
  acceptTerms: boolean;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}